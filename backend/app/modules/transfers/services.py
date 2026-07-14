import uuid
import logging
import json
from datetime import datetime
from typing import List, Optional

from app.modules.transfers.models import EmployeeTransfer
from app.modules.transfers.repositories import TransferRepository
from app.modules.workforce.repositories import EmployeeRepository, EmployeeHistoryRepository
from app.modules.workforce.models import EmployeeHistory, Employee
from app.modules.organization.repositories import OrganizationRepository
from app.modules.security.repositories import AuditLogRepository
from app.core.authorization import resolve_access_scope, check_authorization, ScopeType, AccessDeniedError
from app.database.connection import get_db_connection

logger = logging.getLogger("pikud360.modules.transfers.services")

class TransfersService:
    """Service class executing employee unit transfer workflows."""

    def __init__(
        self,
        transfer_repo: TransferRepository,
        employee_repo: EmployeeRepository,
        org_repo: OrganizationRepository,
        history_repo: EmployeeHistoryRepository,
        audit_repo: AuditLogRepository,
        notification_service=None  # Inject dynamically to avoid circular import dependencies
    ):
        self._transfer_repo = transfer_repo
        self._employee_repo = employee_repo
        self._org_repo = org_repo
        self._history_repo = history_repo
        self._audit_repo = audit_repo
        self._notification_service = notification_service

    def _write_audit_log(
        self,
        tenant_id: str,
        user_id: str,
        event_type: str,
        action: str,
        record_id: str,
        new_values: Optional[dict] = None,
        old_values: Optional[dict] = None
    ) -> None:
        try:
            import flask
            request_id = str(uuid.uuid4())
            ip_address = "127.0.0.1"
            user_agent = "TransfersService"
            if flask.has_request_context():
                request_id = flask.request.headers.get("X-Request-ID") or str(uuid.uuid4())
                ip_address = flask.request.headers.get("X-Forwarded-For", flask.request.remote_addr) or "127.0.0.1"
                user_agent = flask.request.headers.get("User-Agent", "")

            self._audit_repo.create({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "user_id": user_id,
                "session_id": None,
                "request_id": request_id,
                "event_type": event_type,
                "action": action,
                "table_name": "workforce.employee_transfers",
                "record_id": record_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "severity": "INFO"
            })
        except Exception as e:
            logger.error(f"Failed to write transfer audit log: {e}", exc_info=True)

    def request_transfer(
        self,
        employee_id: str,
        to_unit_id: str,
        reason: Optional[str],
        tenant_id: str,
        operator_user_id: str
    ) -> EmployeeTransfer:
        # 1. Fetch employee profile
        employee = self._employee_repo.get_by_id(employee_id)
        if not employee or employee.deleted_at is not None:
            raise ValueError("Employee profile not found.")

        # Validate tenant isolation
        if employee.tenant_id != tenant_id:
            raise AccessDeniedError("Tenant context mismatch for employee.")

        # 2. Access Scope check: Check if operator has access to employee's current unit
        ctx = resolve_access_scope(operator_user_id, tenant_id)
        if ctx.scope_type != "GLOBAL" and employee.org_unit_id not in ctx.organization_units:
            raise AccessDeniedError("Lacks authority over employee's current organization unit.")

        # 3. Target unit verification
        to_unit = self._org_repo.get_by_id(to_unit_id)
        if not to_unit or to_unit.deleted_at is not None:
            raise ValueError("Destination organization unit does not exist.")

        if to_unit.tenant_id != tenant_id:
            raise AccessDeniedError("Destination unit does not belong to the same tenant.")

        # 4. Reject duplicate pending transfers
        if self._transfer_repo.has_pending_transfer(employee_id):
            raise ValueError("Employee already has a pending transfer request.")

        # Prevent transferring to the same unit
        if employee.org_unit_id == to_unit_id:
            raise ValueError("Employee is already assigned to the target unit.")

        # 5. Create transfer request
        transfer_id = str(uuid.uuid4())
        req = EmployeeTransfer(
            id=transfer_id,
            tenant_id=tenant_id,
            employee_id=employee_id,
            from_unit_id=employee.org_unit_id,
            to_unit_id=to_unit_id,
            requested_by=operator_user_id,
            approved_by=None,
            reason=reason,
            status="PENDING",
            requested_at=datetime.utcnow()
        )
        created = self._transfer_repo.create(req)

        # 6. Publish Notification Alert
        if self._notification_service:
            try:
                self._notification_service.create_notification(
                    tenant_id=tenant_id,
                    organization_unit_id=to_unit_id,
                    user_id=None,
                    notification_type="TRANSFER_REQUEST_CREATED",
                    severity="INFO",
                    message=f"New employee transfer requested for {employee.first_name} {employee.last_name} to unit {to_unit.name}."
                )
            except Exception as e:
                logger.error(f"Failed to generate transfer alert: {e}")

        # Write audit
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="TRANSFER_REQUESTED",
            action="INSERT",
            record_id=transfer_id,
            new_values={"employee_id": employee_id, "from_unit_id": employee.org_unit_id, "to_unit_id": to_unit_id}
        )

        return created

    def approve_transfer(
        self,
        transfer_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> EmployeeTransfer:
        # 1. Fetch transfer details
        transfer = self._transfer_repo.get_by_id(transfer_id)
        if not transfer:
            raise ValueError("Transfer request not found.")

        if transfer.tenant_id != tenant_id:
            raise AccessDeniedError("Tenant context mismatch for transfer request.")

        if transfer.status != "PENDING":
            raise ValueError(f"Cannot approve transfer with status '{transfer.status}'. Only PENDING transfers can be approved.")

        # 2. Access Scope check: Check if operator has access to the target unit
        ctx = resolve_access_scope(operator_user_id, tenant_id)
        if ctx.scope_type != "GLOBAL" and transfer.to_unit_id not in ctx.organization_units:
            raise AccessDeniedError("Lacks authority over target organization unit to approve transfer.")

        # 3. Resolve employee details
        employee = self._employee_repo.get_by_id(transfer.employee_id)
        if not employee or employee.deleted_at is not None:
            raise ValueError("Target employee profile not found.")

        # 4. Save history snapshot BEFORE modifying employee state
        old_snapshot = {
            "org_unit_id": employee.org_unit_id,
            "commander_id": employee.commander_id,
            "rank": employee.rank,
            "position": employee.position,
            "service_type": employee.service_type,
            "status": employee.status
        }
        history_id = str(uuid.uuid4())
        history_entry = EmployeeHistory(
            id=history_id,
            employee_id=employee.id,
            change_type="TRANSFER",
            org_unit_id=employee.org_unit_id,
            commander_id=employee.commander_id,
            rank=employee.rank,
            position=employee.position,
            service_type=employee.service_type,
            status=employee.status,
            snapshot_json=old_snapshot,
            effective_from=datetime.utcnow(),
            recorded_by=operator_user_id
        )
        self._history_repo.create(history_entry)

        # 5. Perform the employee unit update
        employee.org_unit_id = transfer.to_unit_id
        # Update in database using custom UPDATE schema
        # We need a direct update of the employee's org_unit_id
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE workforce.employees SET org_unit_id = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
                    (transfer.to_unit_id, employee.id)
                )
                conn.commit()

        # 6. Mark transfer request status as COMPLETED
        now = datetime.utcnow()
        self._transfer_repo.update_status(
            transfer_id=transfer_id,
            status="COMPLETED",
            approved_by=operator_user_id,
            approved_at=now,
            completed_at=now
        )

        transfer.status = "COMPLETED"
        transfer.approved_by = operator_user_id
        transfer.approved_at = now
        transfer.completed_at = now

        # 7. Publish Notification Alert
        if self._notification_service:
            try:
                self._notification_service.create_notification(
                    tenant_id=tenant_id,
                    organization_unit_id=transfer.from_unit_id,
                    user_id=None,
                    notification_type="TRANSFER_APPROVED",
                    severity="SUCCESS",
                    message=f"Transfer approved for {employee.first_name} {employee.last_name} to unit {transfer.to_unit_id}."
                )
            except Exception as e:
                logger.error(f"Failed to generate transfer approved alert: {e}")

        # 8. Write audit trail event
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="EMPLOYEE_TRANSFER_COMPLETED",
            action="UPDATE",
            record_id=transfer_id,
            old_values={"org_unit_id": transfer.from_unit_id},
            new_values={"org_unit_id": transfer.to_unit_id, "status": "COMPLETED"}
        )

        return transfer

    def reject_transfer(
        self,
        transfer_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> EmployeeTransfer:
        transfer = self._transfer_repo.get_by_id(transfer_id)
        if not transfer:
            raise ValueError("Transfer request not found.")

        if transfer.tenant_id != tenant_id:
            raise AccessDeniedError("Tenant context mismatch for transfer request.")

        if transfer.status != "PENDING":
            raise ValueError(f"Cannot reject transfer with status '{transfer.status}'. Only PENDING transfers can be rejected.")

        # Access Scope checks: Check if operator has access to the target unit
        ctx = resolve_access_scope(operator_user_id, tenant_id)
        if ctx.scope_type != "GLOBAL" and transfer.to_unit_id not in ctx.organization_units:
            raise AccessDeniedError("Lacks authority over target organization unit to reject transfer.")

        now = datetime.utcnow()
        self._transfer_repo.update_status(
            transfer_id=transfer_id,
            status="REJECTED",
            approved_by=operator_user_id,
            approved_at=now
        )

        transfer.status = "REJECTED"
        transfer.approved_by = operator_user_id
        transfer.approved_at = now

        # Publish alert
        if self._notification_service:
            try:
                self._notification_service.create_notification(
                    tenant_id=tenant_id,
                    organization_unit_id=transfer.from_unit_id,
                    user_id=transfer.requested_by,
                    notification_type="TRANSFER_REJECTED",
                    severity="WARNING",
                    message=f"Transfer request rejected for employee {transfer.employee_id}."
                )
            except Exception as e:
                logger.error(f"Failed to generate transfer reject alert: {e}")

        # Write audit
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="TRANSFER_REJECTED",
            action="UPDATE",
            record_id=transfer_id,
            new_values={"status": "REJECTED"}
        )

        return transfer

    def cancel_transfer(
        self,
        transfer_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> EmployeeTransfer:
        transfer = self._transfer_repo.get_by_id(transfer_id)
        if not transfer:
            raise ValueError("Transfer request not found.")

        if transfer.tenant_id != tenant_id:
            raise AccessDeniedError("Tenant context mismatch for transfer request.")

        if transfer.status != "PENDING":
            raise ValueError("Only PENDING transfers can be cancelled.")

        # Scope: Requester can cancel their own transfer
        if transfer.requested_by != operator_user_id:
            # Or if commander has scope over the from unit
            ctx = resolve_access_scope(operator_user_id, tenant_id)
            if ctx.scope_type != "GLOBAL" and transfer.from_unit_id not in ctx.organization_units:
                raise AccessDeniedError("Cannot cancel another user's transfer request without scope access.")

        self._transfer_repo.update_status(
            transfer_id=transfer_id,
            status="CANCELLED"
        )
        transfer.status = "CANCELLED"

        # Write audit
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="TRANSFER_CANCELLED",
            action="UPDATE",
            record_id=transfer_id,
            new_values={"status": "CANCELLED"}
        )

        return transfer

    def list_transfers(self, tenant_id: str, user_id: str) -> List[dict]:
        ctx = resolve_access_scope(user_id, tenant_id)
        if ctx.scope_type == "GLOBAL":
            transfers = self._transfer_repo.list_by_tenant(tenant_id)
        else:
            transfers = self._transfer_repo.list_by_units(tenant_id, ctx.organization_units)

        serialized = []
        for t in transfers:
            # Resolve employee name & unit details for UX readability
            emp = self._employee_repo.get_by_id(t.employee_id)
            emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown Employee"
            
            from_u = self._org_repo.get_by_id(t.from_unit_id)
            to_u = self._org_repo.get_by_id(t.to_unit_id)
            
            serialized.append({
                "id": t.id,
                "tenant_id": t.tenant_id,
                "employee_id": t.employee_id,
                "employee_name": emp_name,
                "from_unit_id": t.from_unit_id,
                "from_unit_name": from_u.name if from_u else "Unknown Unit",
                "to_unit_id": t.to_unit_id,
                "to_unit_name": to_u.name if to_u else "Unknown Unit",
                "requested_by": t.requested_by,
                "approved_by": t.approved_by,
                "reason": t.reason,
                "status": t.status,
                "requested_at": t.requested_at.isoformat() if t.requested_at else None,
                "approved_at": t.approved_at.isoformat() if t.approved_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None
            })
        return serialized
