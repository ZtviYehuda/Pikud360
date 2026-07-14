import uuid
import logging
import json
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db_connection
from app.modules.workforce.models import Employee, EmployeeHistory
from app.modules.workforce.repositories import EmployeeRepository, EmployeeHistoryRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce.schemas import EmployeeCreateRequest, EmployeeUpdateRequest
from app.core.authorization import can_view_employee, can_manage_unit, AccessDeniedError

logger = logging.getLogger("pikud360.modules.workforce.services")

class WorkforceService:
    """Service class encapsulating employee management domains."""

    def __init__(
        self,
        employee_repo: EmployeeRepository,
        history_repo: EmployeeHistoryRepository,
        audit_repo: AuditLogRepository
    ):
        self._employee_repo = employee_repo
        self._history_repo = history_repo
        self._audit_repo = audit_repo

    def _serialize_employee(self, emp: Employee) -> dict:
        return {
            "id": emp.id,
            "user_id": emp.user_id,
            "commander_id": emp.commander_id,
            "org_unit_id": emp.org_unit_id,
            "employee_number": emp.employee_number,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "phone": emp.phone,
            "personal_email": emp.personal_email,
            "birthdate": emp.birthdate,
            "rank": emp.rank,
            "position": emp.position,
            "service_type": emp.service_type,
            "status": emp.status,
            "created_at": emp.created_at.isoformat() if emp.created_at else None,
            "updated_at": emp.updated_at.isoformat() if emp.updated_at else None
        }

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
            user_agent = "WorkforceService"
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
                "table_name": "workforce.employees",
                "record_id": record_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "severity": "INFO"
            })
        except Exception as e:
            logger.error(f"Failed to write employee audit log: {e}", exc_info=True)

    def create_employee(
        self,
        req: EmployeeCreateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> Employee:
        """Creates a new employee record after validating operator manager access scopes."""
        # 1. Access Scope Policy Validation: Check if manager can manage unit
        if not can_manage_unit(operator_user_id, tenant_id, req.org_unit_id):
            raise AccessDeniedError(f"Access Denied: Lacks authority to create employees in unit {req.org_unit_id}.")

        employee_id = str(uuid.uuid4())
        
        emp = Employee(
            id=employee_id,
            tenant_id=tenant_id,
            user_id=req.user_id,
            commander_id=req.commander_id,
            org_unit_id=req.org_unit_id,
            employee_number=req.employee_number,
            first_name=req.first_name,
            last_name=req.last_name,
            birthdate=req.birthdate,
            rank=req.rank,
            position=req.position,
            service_type=req.service_type,
            phone=req.phone,
            personal_email=req.personal_email,
            status=req.status
        )

        # 2. Database Insert
        created_emp = self._employee_repo.create(emp, created_by_user_id=operator_user_id)

        # 3. Create Immutable Change History Record
        history = EmployeeHistory(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            change_type="EMPLOYEE_CREATED",
            org_unit_id=req.org_unit_id,
            commander_id=req.commander_id,
            rank=req.rank,
            position=req.position,
            service_type=req.service_type,
            status=req.status,
            snapshot_json={
                "before": None,
                "after": self._serialize_employee(created_emp)
            },
            recorded_by=operator_user_id
        )
        self._history_repo.create(history)

        # 4. Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="EMPLOYEE_CREATED",
            action="CREATE",
            record_id=employee_id,
            new_values=self._serialize_employee(created_emp)
        )

        return created_emp

    def get_employee(
        self,
        employee_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> Optional[Employee]:
        """Fetches employee record, validating that operator possesses the permission to read the profile."""
        emp = self._employee_repo.get_by_id(employee_id)
        if not emp:
            return None

        # Access Scope Policy Validation: Check if operator can view this unit or self
        # Allow if operator is querying their own user profile (SELF scope validation)
        is_self = (emp.user_id == operator_user_id)
        if not is_self and not can_view_employee(operator_user_id, tenant_id, emp.org_unit_id):
            raise AccessDeniedError(f"Access Denied: Lacks authority to view employee details for unit {emp.org_unit_id}.")

        # Log EMPLOYEE_VIEWED audit entry
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="EMPLOYEE_VIEWED",
            action="READ",
            record_id=employee_id
        )

        return emp

    def list_employees(
        self,
        tenant_id: str,
        operator_user_id: str
    ) -> List[Employee]:
        """Lists active employees. Automatically scopes entries the user is permitted to view."""
        all_emps = self._employee_repo.list_all()
        allowed_emps = []

        for emp in all_emps:
            # Check if operator can view this specific employee unit (or if it is their own profile)
            if emp.user_id == operator_user_id or can_view_employee(operator_user_id, tenant_id, emp.org_unit_id):
                allowed_emps.append(emp)

        return allowed_emps

    def update_employee(
        self,
        employee_id: str,
        req: EmployeeUpdateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> Optional[Employee]:
        """Updates employee profile, logging history and transfers, checking parent organization unit managerships."""
        before_emp = self._employee_repo.get_by_id(employee_id)
        if not before_emp:
            return None

        # Access Scope Policy Validation: Check if manager can update employee's unit
        if not can_manage_unit(operator_user_id, tenant_id, before_emp.org_unit_id):
            raise AccessDeniedError(f"Access Denied: Lacks authority to modify employee in unit {before_emp.org_unit_id}.")

        # If transferring unit, check if manager has access on target unit as well
        if req.org_unit_id and req.org_unit_id != before_emp.org_unit_id:
            if not can_manage_unit(operator_user_id, tenant_id, req.org_unit_id):
                raise AccessDeniedError(f"Access Denied: Lacks authority to transfer employee to unit {req.org_unit_id}.")

        # Update properties dynamically
        updated_data = Employee(
            id=before_emp.id,
            tenant_id=before_emp.tenant_id,
            org_unit_id=req.org_unit_id if req.org_unit_id is not None else before_emp.org_unit_id,
            employee_number=req.employee_number if req.employee_number is not None else before_emp.employee_number,
            first_name=req.first_name if req.first_name is not None else before_emp.first_name,
            last_name=req.last_name if req.last_name is not None else before_emp.last_name,
            birthdate=req.birthdate if req.birthdate is not None else before_emp.birthdate,
            rank=req.rank if req.rank is not None else before_emp.rank,
            position=req.position if req.position is not None else before_emp.position,
            service_type=req.service_type if req.service_type is not None else before_emp.service_type,
            user_id=req.user_id if req.user_id is not None else before_emp.user_id,
            commander_id=req.commander_id if req.commander_id is not None else before_emp.commander_id,
            phone=req.phone if req.phone is not None else before_emp.phone,
            personal_email=req.personal_email if req.personal_email is not None else before_emp.personal_email,
            status=req.status if req.status is not None else before_emp.status
        )

        after_emp = self._employee_repo.update(employee_id, updated_data, updated_by_user_id=operator_user_id)
        if not after_emp:
            return None

        # Determine history change type: EMPLOYEE_TRANSFERRED or EMPLOYEE_UPDATED
        history_event = "EMPLOYEE_UPDATED"
        if before_emp.org_unit_id != after_emp.org_unit_id:
            history_event = "EMPLOYEE_TRANSFERRED"

        # Create Immutable change history
        history = EmployeeHistory(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            change_type=history_event,
            org_unit_id=after_emp.org_unit_id,
            commander_id=after_emp.commander_id,
            rank=after_emp.rank,
            position=after_emp.position,
            service_type=after_emp.service_type,
            status=after_emp.status,
            snapshot_json={
                "before": self._serialize_employee(before_emp),
                "after": self._serialize_employee(after_emp)
            },
            recorded_by=operator_user_id
        )
        self._history_repo.create(history)

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="EMPLOYEE_UPDATED",
            action="UPDATE",
            record_id=employee_id,
            new_values=self._serialize_employee(after_emp),
            old_values=self._serialize_employee(before_emp)
        )

        return after_emp

    def delete_employee(
        self,
        employee_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> bool:
        """Deletes employee record (soft delete)."""
        before_emp = self._employee_repo.get_by_id(employee_id)
        if not before_emp:
            return False

        # Access Scope Policy Validation: Check if manager can manage unit
        if not can_manage_unit(operator_user_id, tenant_id, before_emp.org_unit_id):
            raise AccessDeniedError(f"Access Denied: Lacks authority to delete employee in unit {before_emp.org_unit_id}.")

        success = self._employee_repo.delete(employee_id, deleted_by_user_id=operator_user_id)
        if not success:
            return False

        # Create Immutable change history
        history = EmployeeHistory(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            change_type="EMPLOYEE_DELETED",
            org_unit_id=before_emp.org_unit_id,
            commander_id=before_emp.commander_id,
            rank=before_emp.rank,
            position=before_emp.position,
            service_type=before_emp.service_type,
            status="INACTIVE",
            snapshot_json={
                "before": self._serialize_employee(before_emp),
                "after": None
            },
            recorded_by=operator_user_id
        )
        self._history_repo.create(history)

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="EMPLOYEE_DELETED",
            action="DELETE",
            record_id=employee_id,
            old_values=self._serialize_employee(before_emp)
        )

        return True

    def get_employee_timeline(self, employee_id: str, tenant_id: str, operator_user_id: str) -> List[dict]:
        """Queries and aggregates employee historical logs and unit transfers chronologically."""
        employee = self._employee_repo.get_by_id(employee_id)
        if not employee or employee.deleted_at is not None:
            raise ValueError("Employee profile not found.")

        if employee.tenant_id != tenant_id:
            raise AccessDeniedError("Tenant mismatch for employee profile.")

        # Scope checking
        if not can_view_employee(operator_user_id, tenant_id, employee.org_unit_id):
            raise AccessDeniedError("Access Denied: Lacks scope access to view this employee's history.")

        # Fetch history records
        query_history = """
            SELECT eh.id, eh.change_type, eh.org_unit_id, eh.commander_id, eh.rank, eh.position, eh.service_type, eh.status, eh.snapshot_json, eh.created_at, u.username
            FROM workforce.employee_history eh
            LEFT JOIN security.users u ON eh.recorded_by = u.id
            WHERE eh.employee_id = %s
            ORDER BY eh.created_at DESC;
        """
        # Fetch transfers records
        query_transfers = """
            SELECT et.id, et.from_unit_id, et.to_unit_id, et.reason, et.status, et.requested_at, et.completed_at, u_req.username, u_app.username
            FROM workforce.employee_transfers et
            LEFT JOIN security.users u_req ON et.requested_by = u_req.id
            LEFT JOIN security.users u_app ON et.approved_by = u_app.id
            WHERE et.employee_id = %s
            ORDER BY et.requested_at DESC;
        """

        timeline = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Fetch history changes
                cur.execute(query_history, (employee_id,))
                history_rows = cur.fetchall()
                for r in history_rows:
                    org_name = ""
                    if r[2]:
                        cur.execute("SELECT name FROM core.organization_units WHERE id = %s", (r[2],))
                        unit_row = cur.fetchone()
                        if unit_row:
                            org_name = unit_row[0]

                    timeline.append({
                        "id": r[0],
                        "type": "HISTORY_CHANGE",
                        "change_type": r[1],
                        "org_unit_id": r[2],
                        "org_unit_name": org_name,
                        "rank": r[4],
                        "position": r[5],
                        "status": r[7],
                        "snapshot": r[8] if isinstance(r[8], dict) else json.loads(r[8]) if r[8] else {},
                        "timestamp": r[9].isoformat() if r[9] else None,
                        "operator": r[10] or "System"
                    })

                # 2. Fetch transfers
                cur.execute(query_transfers, (employee_id,))
                transfer_rows = cur.fetchall()
                for r in transfer_rows:
                    from_name = ""
                    to_name = ""
                    if r[1]:
                        cur.execute("SELECT name FROM core.organization_units WHERE id = %s", (r[1],))
                        unit_row = cur.fetchone()
                        from_name = unit_row[0] if unit_row else ""
                    if r[2]:
                        cur.execute("SELECT name FROM core.organization_units WHERE id = %s", (r[2],))
                        unit_row = cur.fetchone()
                        to_name = unit_row[0] if unit_row else ""

                    timeline.append({
                        "id": r[0],
                        "type": "TRANSFER",
                        "from_unit_name": from_name,
                        "to_unit_name": to_name,
                        "reason": r[3],
                        "status": r[4],
                        "timestamp": r[5].isoformat() if r[5] else None,
                        "completed_at": r[6].isoformat() if r[6] else None,
                        "requested_by": r[7] or "Unknown",
                        "approved_by": r[8]
                    })

        timeline.sort(key=lambda x: x["timestamp"] or "", reverse=True)
        return timeline
