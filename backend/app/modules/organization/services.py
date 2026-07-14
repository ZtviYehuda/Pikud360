import uuid
import logging
from typing import List, Optional

from app.modules.organization.models import OrganizationUnit
from app.modules.organization.repositories import OrganizationRepository, UnitCommanderRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.organization.schemas import (
    OrganizationUnitCreateRequest,
    OrganizationUnitUpdateRequest,
    OrganizationMoveRequest,
    CommanderAssignRequest
)

logger = logging.getLogger("pikud360.modules.organization.services")

class OrganizationTreeService:
    """Service handling organization structures, command trees, and unit movements."""

    def __init__(
        self,
        org_repo: OrganizationRepository,
        commander_repo: UnitCommanderRepository,
        audit_repo: AuditLogRepository
    ):
        self._org_repo = org_repo
        self._commander_repo = commander_repo
        self._audit_repo = audit_repo

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
            user_agent = "OrganizationTreeService"
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
                "table_name": "core.organization_units",
                "record_id": record_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "severity": "INFO"
            })
        except Exception as e:
            logger.error(f"Failed to write organization audit log: {e}", exc_info=True)

    def get_nested_tree(self, tenant_id: str) -> List[dict]:
        """Loads and returns the nested organization tree schema for the active tenant."""
        roots = self._org_repo.get_root_units(tenant_id)
        
        def build_node(unit: OrganizationUnit) -> dict:
            children = self._org_repo.get_children(unit.id)
            return {
                "id": unit.id,
                "name": unit.name,
                "code": unit.code,
                "description": unit.description,
                "children": [build_node(child) for child in children]
            }

        return [build_node(root) for root in roots]

    def create_unit(
        self,
        req: OrganizationUnitCreateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> OrganizationUnit:
        """Onboards a new organization unit into the tree hierarchy."""
        # 1. Code uniqueness constraint per tenant
        existing = self._org_repo.get_by_code(tenant_id, req.code)
        if existing:
            raise ValueError(f"Organization unit with code '{req.code}' already exists in tenant.")

        # 2. Parent verification constraint (must reside within the same tenant context)
        if req.parent_id:
            parent = self._org_repo.get_by_id(req.parent_id)
            if not parent:
                raise ValueError("Parent unit not found.")
            if parent.tenant_id != tenant_id:
                raise ValueError("Parent unit belongs to a different tenant.")

        unit_id = str(uuid.uuid4())
        unit = OrganizationUnit(
            id=unit_id,
            tenant_id=tenant_id,
            parent_id=req.parent_id,
            type_id=req.type_id,
            name=req.name,
            code=req.code,
            description=req.description,
            sort_order=req.sort_order or 0,
            is_active=True
        )

        created_unit = self._org_repo.create(unit, created_by=operator_user_id)

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="ORGANIZATION_UNIT_CREATED",
            action="CREATE",
            record_id=unit_id,
            new_values={
                "id": created_unit.id,
                "name": created_unit.name,
                "code": created_unit.code,
                "parent_id": created_unit.parent_id
            }
        )

        return created_unit

    def update_unit(
        self,
        unit_id: str,
        req: OrganizationUnitUpdateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> Optional[OrganizationUnit]:
        """Modifies organization unit attributes (excludes parent structural adjustments)."""
        before_unit = self._org_repo.get_by_id(unit_id)
        if not before_unit:
            return None

        # Check code uniqueness if updated
        if req.code and req.code != before_unit.code:
            existing = self._org_repo.get_by_code(tenant_id, req.code)
            if existing:
                raise ValueError(f"Organization unit with code '{req.code}' already exists in tenant.")

        updated_data = OrganizationUnit(
            id=before_unit.id,
            tenant_id=before_unit.tenant_id,
            parent_id=before_unit.parent_id, # Must use move endpoint for parent updates
            type_id=before_unit.type_id,
            name=req.name if req.name is not None else before_unit.name,
            code=req.code if req.code is not None else before_unit.code,
            description=req.description if req.description is not None else before_unit.description,
            sort_order=req.sort_order if req.sort_order is not None else before_unit.sort_order,
            is_active=req.is_active if req.is_active is not None else before_unit.is_active
        )

        after_unit = self._org_repo.update(unit_id, updated_data, updated_by=operator_user_id)

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="ORGANIZATION_UNIT_UPDATED",
            action="UPDATE",
            record_id=unit_id,
            new_values={
                "name": after_unit.name,
                "code": after_unit.code,
                "is_active": after_unit.is_active
            },
            old_values={
                "name": before_unit.name,
                "code": before_unit.code,
                "is_active": before_unit.is_active
            }
        )

        return after_unit

    def move_unit(
        self,
        unit_id: str,
        req: OrganizationMoveRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> bool:
        """Moves a department to another node, checking circular relationships."""
        unit = self._org_repo.get_by_id(unit_id)
        if not unit:
            return False

        if req.parent_id:
            if req.parent_id == unit_id:
                raise ValueError("Cannot move a unit under itself.")

            parent = self._org_repo.get_by_id(req.parent_id)
            if not parent:
                raise ValueError("Target parent unit does not exist.")
            if parent.tenant_id != tenant_id:
                raise ValueError("Target parent unit belongs to a different tenant.")

            # Prevent circular reference: parent node cannot reside inside the moving node descendants closure
            descendants = self._org_repo.get_descendants(unit_id)
            descendant_ids = [d.id for d in descendants]
            if req.parent_id in descendant_ids:
                raise ValueError("Cannot move a unit under one of its descendants (circular reference).")

        old_parent_id = unit.parent_id
        success = self._org_repo.move(unit_id, req.parent_id, updated_by=operator_user_id)
        if not success:
            return False

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="ORGANIZATION_UNIT_MOVED",
            action="UPDATE",
            record_id=unit_id,
            new_values={"parent_id": req.parent_id},
            old_values={"parent_id": old_parent_id}
        )

        return True

    def delete_unit(
        self,
        unit_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> bool:
        """Soft deletes an organization unit."""
        unit = self._org_repo.get_by_id(unit_id)
        if not unit:
            return False

        success = self._org_repo.delete(unit_id, deleted_by=operator_user_id)
        if not success:
            return False

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="ORGANIZATION_UNIT_DELETED",
            action="DELETE",
            record_id=unit_id,
            old_values={
                "name": unit.name,
                "code": unit.code
            }
        )

        return True

    def assign_commander(
        self,
        org_unit_id: str,
        req: CommanderAssignRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> bool:
        """Assigns an employee as the unit commander, writing commander audit events."""
        old_commander = self._commander_repo.get_current_commander(org_unit_id)
        
        success = self._commander_repo.assign_commander(org_unit_id, req.commander_id)
        if not success:
            return False

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="COMMANDER_CHANGED",
            action="UPDATE",
            record_id=org_unit_id,
            new_values={"commander_id": req.commander_id},
            old_values={"commander_id": old_commander}
        )

        return True

    def remove_commander(
        self,
        org_unit_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> bool:
        """Removes the unit active commander assignment."""
        old_commander = self._commander_repo.get_current_commander(org_unit_id)
        if not old_commander:
            return False

        success = self._commander_repo.remove_commander(org_unit_id)
        if not success:
            return False

        # Write Audit Log
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="COMMANDER_CHANGED",
            action="UPDATE",
            record_id=org_unit_id,
            new_values={"commander_id": None},
            old_values={"commander_id": old_commander}
        )

        return True

    def get_current_commander(self, org_unit_id: str) -> Optional[str]:
        return self._commander_repo.get_current_commander(org_unit_id)
