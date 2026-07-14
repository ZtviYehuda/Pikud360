import uuid
import logging
from typing import List, Optional
from datetime import datetime, date, time

from app.modules.workforce_schedule.models import (
    ScheduleSettings,
    ShiftType,
    ScheduleStatus,
    EmployeeDailySchedule
)
from app.modules.workforce_schedule.repositories import WorkforceScheduleRepository
from app.modules.workforce.repositories import EmployeeRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce_schedule.schemas import (
    ScheduleStatusCreateRequest,
    ScheduleStatusUpdateRequest,
    ScheduleCreateRequest,
    ScheduleUpdateRequest,
    BulkScheduleRequest
)
from app.core.authorization import (
    can_view_schedule,
    can_manage_schedule,
    resolve_access_scope,
    AccessDeniedError
)

logger = logging.getLogger("pikud360.modules.workforce_schedule.services")

class WorkforceScheduleService:
    """Service handling daily commander workforce planning, dynamic statuses, and dashboard aggregates."""

    def __init__(
        self,
        schedule_repo: WorkforceScheduleRepository,
        employee_repo: EmployeeRepository,
        audit_repo: AuditLogRepository
    ):
        self._schedule_repo = schedule_repo
        self._employee_repo = employee_repo
        self._audit_repo = audit_repo

    def _write_audit_log(
        self,
        tenant_id: str,
        user_id: str,
        event_type: str,
        action: str,
        record_id: str,
        new_values: Optional[dict] = None,
        old_values: Optional[dict] = None,
        org_unit_id: Optional[str] = None,
        employee_id: Optional[str] = None
    ) -> None:
        try:
            import flask
            request_id = str(uuid.uuid4())
            ip_address = "127.0.0.1"
            user_agent = "WorkforceScheduleService"
            if flask.has_request_context():
                request_id = flask.request.headers.get("X-Request-ID") or str(uuid.uuid4())
                ip_address = flask.request.headers.get("X-Forwarded-For", flask.request.remote_addr) or "127.0.0.1"
                user_agent = flask.request.headers.get("User-Agent", "")

            audit_new = new_values or {}
            audit_old = old_values or {}
            
            meta = {
                "actor_user_id": user_id,
                "tenant_id": tenant_id,
                "organization_unit_id": org_unit_id,
                "employee_id": employee_id,
                "old_value": audit_old.get("status_code") or audit_old.get("status_id") or audit_old.get("scheduling_mode"),
                "new_value": audit_new.get("status_code") or audit_new.get("status_id") or audit_new.get("scheduling_mode")
            }
            
            final_new = {**audit_new, **meta}
            final_old = {**audit_old, **meta}

            self._audit_repo.create({
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "user_id": user_id,
                "session_id": None,
                "request_id": request_id,
                "event_type": event_type,
                "action": action,
                "table_name": "workforce.employee_daily_schedule",
                "record_id": record_id,
                "old_values": final_old,
                "new_values": final_new,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "severity": "INFO"
            })
        except Exception as e:
            logger.error(f"Failed to write schedule audit log: {e}", exc_info=True)

    # --- Schedule Settings ---

    def get_or_create_settings(self, org_unit_id: str, tenant_id: str, operator_id: str) -> ScheduleSettings:
        """Fetches or initializes scheduling settings for the organization unit."""
        settings = self._schedule_repo.get_settings(org_unit_id)
        if not settings:
            settings = ScheduleSettings(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                organization_unit_id=org_unit_id,
                scheduling_mode="DIRECT_STATUS",
                created_by=operator_id
            )
            settings = self._schedule_repo.create_settings(settings)
        return settings

    def update_settings(
        self,
        org_unit_id: str,
        scheduling_mode: str,
        tenant_id: str,
        operator_id: str,
        unassigned_threshold: Optional[float] = None,
        sick_threshold: Optional[float] = None,
        shortage_threshold: Optional[float] = None
    ) -> ScheduleSettings:
        """Modifies daily workforce status settings (DIRECT_STATUS vs SHIFT_BASED) and alert thresholds."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.settings_manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks settings_manage permission.")

        if scheduling_mode not in ["DIRECT_STATUS", "SHIFT_BASED"]:
            raise ValueError("Invalid scheduling mode.")

        settings = self.get_or_create_settings(org_unit_id, tenant_id, operator_id)
        updated = self._schedule_repo.update_settings(
            org_unit_id,
            scheduling_mode,
            unassigned_threshold,
            sick_threshold,
            shortage_threshold
        )
        if not updated:
            raise RuntimeError("Failed to update schedule settings.")

        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_id,
            event_type="SCHEDULE_SETTINGS_CHANGED",
            action="UPDATE",
            record_id=org_unit_id,
            new_values={
                "scheduling_mode": updated.scheduling_mode,
                "unassigned_threshold": updated.unassigned_threshold,
                "sick_threshold": updated.sick_threshold,
                "shortage_threshold": updated.shortage_threshold
            },
            old_values={
                "scheduling_mode": settings.scheduling_mode,
                "unassigned_threshold": settings.unassigned_threshold,
                "sick_threshold": settings.sick_threshold,
                "shortage_threshold": settings.shortage_threshold
            },
            org_unit_id=org_unit_id
        )

        return updated

    # --- Shift Types ---

    def create_shift_type(
        self,
        org_unit_id: str,
        name: str,
        start_time_str: str,
        end_time_str: str,
        tenant_id: str,
        operator_id: str
    ) -> ShiftType:
        """Creates a custom shift configuration for a specific organization unit."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.settings_manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks settings_manage permission.")

        start_time = datetime.strptime(start_time_str, "%H:%M" if len(start_time_str) == 5 else "%H:%M:%S").time()
        end_time = datetime.strptime(end_time_str, "%H:%M" if len(end_time_str) == 5 else "%H:%M:%S").time()

        st = ShiftType(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            organization_unit_id=org_unit_id,
            name=name,
            start_time=start_time,
            end_time=end_time,
            active=True,
            created_by=operator_id
        )
        return self._schedule_repo.create_shift_type(st)

    # --- Schedule Statuses ---

    def create_custom_status(
        self,
        req: ScheduleStatusCreateRequest,
        tenant_id: str,
        operator_id: str
    ) -> ScheduleStatus:
        """Commander custom status category onboarding."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.status_manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks status_manage permission.")

        existing = self._schedule_repo.get_status_by_code(tenant_id, req.code.upper())
        if existing:
            raise ValueError(f"Status code {req.code} already exists for this tenant.")

        status = ScheduleStatus(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            code=req.code.upper(),
            name=req.name,
            category=req.category.upper(),
            color=req.color,
            is_active=True,
            sort_order=req.sort_order or 0,
            created_by=operator_id
        )

        created = self._schedule_repo.create_status(status)

        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_id,
            event_type="SCHEDULE_STATUS_CREATED",
            action="CREATE",
            record_id=created.id,
            new_values={"code": created.code, "name": created.name}
        )

        return created

    def update_custom_status(
        self,
        status_id: str,
        req: ScheduleStatusUpdateRequest,
        tenant_id: str,
        operator_id: str
    ) -> Optional[ScheduleStatus]:
        """Edits characteristics of a scheduling status."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.status_manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks status_manage permission.")

        before = self._schedule_repo.get_status_by_id(status_id)
        if not before or before.tenant_id != tenant_id:
            return None

        updated = self._schedule_repo.update_status(
            status_id=status_id,
            name=req.name,
            category=req.category.upper() if req.category else None,
            color=req.color,
            sort_order=req.sort_order,
            is_active=req.is_active
        )

        if updated:
            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_id,
                event_type="SCHEDULE_STATUS_UPDATED",
                action="UPDATE",
                record_id=status_id,
                new_values={"name": updated.name, "category": updated.category},
                old_values={"name": before.name, "category": before.category}
            )

        return updated

    def disable_custom_status(self, status_id: str, tenant_id: str, operator_id: str) -> bool:
        """Soft-deletes/disables a custom status record. Prevents deletion of system default statuses."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.status_manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks status_manage permission.")

        status = self._schedule_repo.get_status_by_id(status_id)
        if not status or status.tenant_id != tenant_id:
            return False

        if status.code.upper() in ["AVAILABLE", "SICK", "VACATION", "TRAINING", "REINFORCEMENT", "MISSION", "OTHER", "UNAVAILABLE"]:
            raise ValueError("System default status types cannot be deleted.")

        disabled = self._schedule_repo.soft_delete_status(status_id)
        if disabled:
            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_id,
                event_type="SCHEDULE_STATUS_UPDATED",
                action="UPDATE",
                record_id=status_id,
                new_values={"is_active": False},
                old_values={"is_active": True}
            )
        return disabled

    # --- Schedule Entries ---

    def create_schedule_entry(
        self,
        req: ScheduleCreateRequest,
        tenant_id: str,
        operator_id: str
    ) -> EmployeeDailySchedule:
        """Assigns an employee Daily workforce status under commander control."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.manage permission.")

        if not can_manage_schedule(operator_id, tenant_id, req.organization_unit_id):
            raise AccessDeniedError("Access Denied: Lacks commander scope to assign schedules for this unit.")

        emp = self._employee_repo.get_by_id(req.employee_id)
        if not emp:
            raise ValueError("Employee profile not found.")

        # Unit scope validation checks
        if emp.org_unit_id != req.organization_unit_id:
            from app.database.connection import get_db_connection
            closure_query = """
                SELECT 1 FROM core.organization_unit_closure
                WHERE ancestor_id = %s AND descendant_id = %s;
            """
            is_descendant = False
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(closure_query, (req.organization_unit_id, emp.org_unit_id))
                    if cur.fetchone():
                        is_descendant = True
            if not is_descendant:
                raise ValueError("Employee resides outside commander planning unit tree.")

        # Validate status
        status_obj = self._schedule_repo.get_status_by_id(req.status_id)
        if not status_obj or status_obj.tenant_id != tenant_id:
            raise ValueError("Invalid status ID.")

        schedule_date = datetime.strptime(req.schedule_date, "%Y-%m-%d").date()
        settings = self.get_or_create_settings(req.organization_unit_id, tenant_id, operator_id)

        start_time_val = None
        end_time_val = None
        shift_id = None

        if settings.scheduling_mode == "DIRECT_STATUS":
            if req.shift_type_id or req.start_time or req.end_time:
                raise ValueError("Shift types or time parameters are disabled under DIRECT_STATUS mode.")
        elif settings.scheduling_mode == "SHIFT_BASED":
            if not req.shift_type_id:
                raise ValueError("Shift type is required under SHIFT_BASED scheduling mode.")
            shift_id = req.shift_type_id
            if req.start_time:
                start_time_val = datetime.strptime(req.start_time, "%H:%M" if len(req.start_time) == 5 else "%H:%M:%S").time()
            if req.end_time:
                end_time_val = datetime.strptime(req.end_time, "%H:%M" if len(req.end_time) == 5 else "%H:%M:%S").time()

        # Overwrite prior assignments
        existing = self._schedule_repo.get_schedule_by_employee_and_date(req.employee_id, schedule_date)
        if existing:
            self._schedule_repo.delete_schedule(existing.id)

        schedule = EmployeeDailySchedule(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            employee_id=req.employee_id,
            organization_unit_id=req.organization_unit_id,
            schedule_date=schedule_date,
            status_id=req.status_id,
            shift_type_id=shift_id,
            start_time=start_time_val,
            end_time=end_time_val,
            notes=req.notes,
            created_by_commander_id=operator_id,
            updated_by_commander_id=operator_id
        )

        created = self._schedule_repo.create_schedule(schedule)

        # Audit logs
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_id,
            event_type="SCHEDULE_ASSIGNMENT_CREATED",
            action="CREATE",
            record_id=created.id,
            new_values={"status_id": created.status_id, "status_code": status_obj.code},
            org_unit_id=created.organization_unit_id,
            employee_id=created.employee_id
        )

        return created

    def update_schedule_entry(
        self,
        schedule_id: str,
        req: ScheduleUpdateRequest,
        tenant_id: str,
        operator_id: str
    ) -> Optional[EmployeeDailySchedule]:
        """Modifies planned daily assignments attributes."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.manage permission.")

        ass = self._schedule_repo.get_schedule_by_id(schedule_id)
        if not ass:
            return None

        if not can_manage_schedule(operator_id, tenant_id, ass.organization_unit_id):
            raise AccessDeniedError("Access Denied: Lacks commander scope to edit assignments for this unit.")

        settings = self.get_or_create_settings(ass.organization_unit_id, tenant_id, operator_id)

        start_time_val = ass.start_time
        end_time_val = ass.end_time
        shift_id = ass.shift_type_id
        target_status_id = req.status_id or ass.status_id

        if settings.scheduling_mode == "DIRECT_STATUS":
            if req.shift_type_id or req.start_time or req.end_time:
                raise ValueError("Shift types or time parameters are disabled under DIRECT_STATUS mode.")
            shift_id = None
            start_time_val = None
            end_time_val = None
        elif settings.scheduling_mode == "SHIFT_BASED":
            if req.shift_type_id is not None:
                shift_id = req.shift_type_id
            if not shift_id:
                raise ValueError("Shift type is required under SHIFT_BASED scheduling mode.")
            if req.start_time:
                start_time_val = datetime.strptime(req.start_time, "%H:%M" if len(req.start_time) == 5 else "%H:%M:%S").time()
            if req.end_time:
                end_time_val = datetime.strptime(req.end_time, "%H:%M" if len(req.end_time) == 5 else "%H:%M:%S").time()

        before_status = self._schedule_repo.get_status_by_id(ass.status_id)
        after_status = self._schedule_repo.get_status_by_id(target_status_id)

        updated = self._schedule_repo.update_schedule(
            schedule_id=schedule_id,
            status_id=target_status_id,
            shift_type_id=shift_id,
            start_time=start_time_val,
            end_time=end_time_val,
            notes=req.notes,
            commander_id=operator_id
        )

        if updated:
            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_id,
                event_type="SCHEDULE_ASSIGNMENT_UPDATED",
                action="UPDATE",
                record_id=schedule_id,
                new_values={"status_id": updated.status_id, "status_code": after_status.code if after_status else None},
                old_values={"status_id": ass.status_id, "status_code": before_status.code if before_status else None},
                org_unit_id=updated.organization_unit_id,
                employee_id=updated.employee_id
            )

        return updated

    def delete_schedule_entry(self, schedule_id: str, tenant_id: str, operator_id: str) -> bool:
        """Deletes a planned daily status assignment."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.manage permission.")

        ass = self._schedule_repo.get_schedule_by_id(schedule_id)
        if not ass:
            return False

        if not can_manage_schedule(operator_id, tenant_id, ass.organization_unit_id):
            raise AccessDeniedError("Access Denied: Lacks commander scope to delete assignments.")

        deleted = self._schedule_repo.delete_schedule(schedule_id)
        if deleted:
            status_obj = self._schedule_repo.get_status_by_id(ass.status_id)
            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_id,
                event_type="SCHEDULE_ASSIGNMENT_DELETED",
                action="DELETE",
                record_id=schedule_id,
                old_values={"status_id": ass.status_id, "status_code": status_obj.code if status_obj else None},
                org_unit_id=ass.organization_unit_id,
                employee_id=ass.employee_id
            )
        return deleted

    # --- Bulk Assignments ---

    def bulk_schedule(
        self,
        req: BulkScheduleRequest,
        tenant_id: str,
        operator_id: str
    ) -> List[EmployeeDailySchedule]:
        """Performs mass commander status allocations across multiple employee profiles."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.bulk_manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks bulk_manage permission.")

        if not can_manage_schedule(operator_id, tenant_id, req.organization_unit_id):
            raise AccessDeniedError("Access Denied: Lacks scheduling edit permission for this unit.")

        status_obj = self._schedule_repo.get_status_by_id(req.status_id)
        if not status_obj or status_obj.tenant_id != tenant_id:
            raise ValueError("Invalid status ID.")

        schedule_date = datetime.strptime(req.date, "%Y-%m-%d").date()
        created_entries = []

        for emp_id in req.employee_ids:
            emp = self._employee_repo.get_by_id(emp_id)
            if not emp:
                raise ValueError(f"Employee profile {emp_id} not found.")

            if emp.org_unit_id != req.organization_unit_id:
                from app.database.connection import get_db_connection
                closure_query = """
                    SELECT 1 FROM core.organization_unit_closure
                    WHERE ancestor_id = %s AND descendant_id = %s;
                """
                is_descendant = False
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(closure_query, (req.organization_unit_id, emp.org_unit_id))
                        if cur.fetchone():
                            is_descendant = True
                if not is_descendant:
                    raise ValueError(f"Employee {emp_id} resides outside unit tree scope.")

            existing = self._schedule_repo.get_schedule_by_employee_and_date(emp_id, schedule_date)
            if existing:
                self._schedule_repo.delete_schedule(existing.id)

            schedule = EmployeeDailySchedule(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                employee_id=emp_id,
                organization_unit_id=req.organization_unit_id,
                schedule_date=schedule_date,
                status_id=req.status_id,
                shift_type_id=None,
                start_time=None,
                end_time=None,
                notes="Bulk Assignment",
                created_by_commander_id=operator_id,
                updated_by_commander_id=operator_id
            )
            created = self._schedule_repo.create_schedule(schedule)
            created_entries.append(created)

            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_id,
                event_type="SCHEDULE_BULK_ASSIGNMENT_CREATED",
                action="CREATE",
                record_id=created.id,
                new_values={"status_id": created.status_id, "status_code": status_obj.code},
                org_unit_id=created.organization_unit_id,
                employee_id=created.employee_id
            )

        return created_entries

    # --- Dashboard Summaries ---

    def get_daily_workforce_summary(
        self,
        unit_id: str,
        date_str: str,
        tenant_id: str,
        operator_id: str
    ) -> dict:
        """Compiles workforce planning daily stats recursively for commanders including descendant subtree counts."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.view permission.")

        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks view access to unit.")

        schedule_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        # Load all descendants recursively using closure matrix
        from app.database.connection import get_db_connection
        descendants_query = """
            SELECT descendant_id FROM core.organization_unit_closure
            WHERE ancestor_id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(descendants_query, (unit_id,))
                descendant_ids = [row[0] for row in cur.fetchall()]
        if not descendant_ids:
            descendant_ids = [unit_id]

        # Total personnel recursively
        count_query = """
            SELECT COUNT(*) FROM workforce.employees
            WHERE org_unit_id = ANY(%s) AND deleted_at IS NULL;
        """
        total_employees = 0
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(count_query, (descendant_ids,))
                row = cur.fetchone()
                if row:
                    total_employees = row[0]

        # Active schedules recursively
        schedules_query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at
            FROM workforce.employee_daily_schedule
            WHERE schedule_date = %s AND organization_unit_id = ANY(%s);
        """
        schedules = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(schedules_query, (schedule_date, descendant_ids))
                for row in cur.fetchall():
                    schedules.append(self._schedule_repo._row_to_schedule(row))

        settings = self.get_or_create_settings(unit_id, tenant_id, operator_id)
        statuses_list = self._schedule_repo.list_statuses(tenant_id)
        id_to_code = {s.id: s.code.upper() for s in statuses_list}
        
        statuses_summary = {s.code.upper(): 0 for s in statuses_list}
        shifts_summary = {}

        assigned_count = len(schedules)
        for s in schedules:
            status_code = id_to_code.get(s.status_id)
            if status_code:
                statuses_summary[status_code] = statuses_summary.get(status_code, 0) + 1

            if settings.scheduling_mode == "SHIFT_BASED" and s.shift_type_id:
                st = self._schedule_repo.get_shift_type_by_id(s.shift_type_id)
                if st:
                    sd_name = st.name.lower()
                    if "בוקר" in sd_name or "morning" in sd_name:
                        key = "MORNING"
                    elif "צהרים" in sd_name or "צהריים" in sd_name or "afternoon" in sd_name or "noon" in sd_name or "ערב" in sd_name or "evening" in sd_name:
                        key = "AFTERNOON"
                    elif "לילה" in sd_name or "night" in sd_name:
                        key = "NIGHT"
                    else:
                        key = st.name.upper()
                    shifts_summary[key] = shifts_summary.get(key, 0) + 1

        unassigned_count = max(0, total_employees - assigned_count)

        # Child units breakdown list (Only immediate children)
        child_units_query = """
            SELECT id, name FROM core.organization_units
            WHERE parent_id = %s AND deleted_at IS NULL;
        """
        child_units = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(child_units_query, (unit_id,))
                child_units = [{"id": row[0], "name": row[1]} for row in cur.fetchall()]

        child_breakdown = []
        for child in child_units:
            # Query descendants of this specific child unit
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(descendants_query, (child["id"],))
                    child_desc_ids = [row[0] for row in cur.fetchall()]
            if not child_desc_ids:
                child_desc_ids = [child["id"]]

            # Total employees in child subtree
            child_total = 0
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(count_query, (child_desc_ids,))
                    row = cur.fetchone()
                    if row:
                        child_total = row[0]

            # Assigned count in child subtree
            child_assigned = 0
            child_schedules_query = """
                SELECT COUNT(DISTINCT employee_id) FROM workforce.employee_daily_schedule
                WHERE schedule_date = %s AND organization_unit_id = ANY(%s);
            """
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(child_schedules_query, (schedule_date, child_desc_ids))
                    row = cur.fetchone()
                    if row:
                        child_assigned = row[0]

            child_unassigned = max(0, child_total - child_assigned)
            child_breakdown.append({
                "unit_id": child["id"],
                "unit_name": child["name"],
                "total_employees": child_total,
                "assigned_employees": child_assigned,
                "unassigned_employees": child_unassigned
            })

        res = {
            "date": date_str,
            "total_employees": total_employees,
            "assigned_employees": assigned_count,
            "unassigned_employees": unassigned_count,
            "statuses": statuses_summary,
            "child_units": child_breakdown
        }

        if settings.scheduling_mode == "SHIFT_BASED":
            res["shifts"] = {
                "MORNING": shifts_summary.get("MORNING", 0),
                "AFTERNOON": shifts_summary.get("AFTERNOON", 0),
                "NIGHT": shifts_summary.get("NIGHT", 0)
            }
            # Custom shifts
            for k, v in shifts_summary.items():
                if k not in res["shifts"]:
                    res["shifts"][k] = v

        return res

    def get_unit_employees_with_schedule(self, unit_id: str, schedule_date: date, tenant_id: str, operator_id: str) -> List[dict]:
        """Loads all employees under a unit and maps their decrypted roles with active daily status logs on a date."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.view permission.")

        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks access to this organization unit.")

        from app.database.connection import get_db_connection

        # Get Unit name
        unit_name = "Unknown Unit"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT name FROM core.organization_units WHERE id = %s", (unit_id,))
                row = cur.fetchone()
                if row:
                    unit_name = row[0]

        # Get employees of this specific unit (flat)
        emp_query = """
            SELECT id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                   phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                   email_ciphertext, email_nonce, email_tag, email_blind_index,
                   birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                   rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by
            FROM workforce.employees
            WHERE org_unit_id = %s AND deleted_at IS NULL;
        """
        employees = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(emp_query, (unit_id,))
                for row in cur.fetchall():
                    employees.append(self._employee_repo._row_to_entity(row))

        # Get schedules for this unit on this date
        schedules_map = {}
        schedules = self._schedule_repo.get_unit_schedules_by_date(unit_id, schedule_date)
        for s in schedules:
            schedules_map[s.employee_id] = s

        statuses_list = self._schedule_repo.list_statuses(tenant_id)
        status_by_id = {st.id: st for st in statuses_list}

        results = []
        for emp in employees:
            sched = schedules_map.get(emp.id)
            assignment = None
            if sched:
                status_obj = status_by_id.get(sched.status_id)
                assignment = {
                    "id": sched.id,
                    "status_id": sched.status_id,
                    "status_code": status_obj.code if status_obj else "UNKNOWN",
                    "status_name": status_obj.name if status_obj else "Unknown",
                    "color": status_obj.color if status_obj else "#9E9E9E",
                    "shift_type_id": sched.shift_type_id,
                    "start_time": sched.start_time.strftime("%H:%M") if sched.start_time else None,
                    "end_time": sched.end_time.strftime("%H:%M") if sched.end_time else None,
                    "notes": sched.notes
                }
            results.append({
                "employee_id": emp.id,
                "display_name": f"{emp.first_name} {emp.last_name}",
                "rank": emp.rank,
                "role": emp.position,
                "organization_unit": {
                    "id": emp.org_unit_id,
                    "name": unit_name
                },
                "daily_assignment": assignment
            })

        return results

    def get_scheduling_calendar(
        self,
        unit_id: str,
        start_date_str: str,
        end_date_str: str,
        tenant_id: str,
        operator_id: str
    ) -> List[dict]:
        """Calculates daily workforce presence rates and status aggregates recursively over a date range."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.view permission.")

        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks view access to unit.")

        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        # Load descendants recursively
        from app.database.connection import get_db_connection
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT descendant_id FROM core.organization_unit_closure WHERE ancestor_id = %s;", (unit_id,))
                descendant_ids = [row[0] for row in cur.fetchall()]
                if not descendant_ids:
                    descendant_ids = [unit_id]

                # Get current total personnel count in the hierarchy
                cur.execute(
                    "SELECT COUNT(*) FROM workforce.employees WHERE org_unit_id = ANY(%s) AND deleted_at IS NULL;",
                    (descendant_ids,)
                )
                total_personnel = cur.fetchone()[0]

                # Fetch schedules grouped by date and status
                query = """
                    SELECT schedule_date, status_id, COUNT(*)
                    FROM workforce.employee_daily_schedule
                    WHERE organization_unit_id = ANY(%s)
                      AND schedule_date >= %s AND schedule_date <= %s
                    GROUP BY schedule_date, status_id;
                """
                cur.execute(query, (descendant_ids, start_date, end_date))
                rows = cur.fetchall()

                # Map status IDs to code strings
                statuses_list = self._schedule_repo.list_statuses(tenant_id)
                id_to_code = {s.id: s.code.upper() for s in statuses_list}

                by_date = {}
                for r in rows:
                    s_date = r[0].strftime("%Y-%m-%d")
                    status_id = r[1]
                    count = r[2]

                    status_code = id_to_code.get(status_id, "UNKNOWN")
                    if s_date not in by_date:
                        by_date[s_date] = {
                            "date": s_date,
                            "total_employees": total_personnel,
                            "assigned": 0,
                            "unassigned": total_personnel,
                            "status_distribution": {s.code.upper(): 0 for s in statuses_list}
                        }

                    by_date[s_date]["assigned"] += count
                    by_date[s_date]["unassigned"] = max(0, total_personnel - by_date[s_date]["assigned"])
                    by_date[s_date]["status_distribution"][status_code] = count

                from datetime import timedelta
                current = start_date
                calendar_data = []
                while current <= end_date:
                    d_str = current.strftime("%Y-%m-%d")
                    if d_str in by_date:
                        calendar_data.append(by_date[d_str])
                    else:
                        calendar_data.append({
                            "date": d_str,
                            "total_employees": total_personnel,
                            "assigned": 0,
                            "unassigned": total_personnel,
                            "status_distribution": {s.code.upper(): 0 for s in statuses_list}
                        })
                    current += timedelta(days=1)

                return calendar_data

    def get_scheduling_snapshot(
        self,
        unit_id: str,
        date_str: str,
        tenant_id: str,
        operator_id: str
    ) -> dict:
        """Reconstructs the workforce status assignments picture for a previous date from daily schedule logs."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "schedule.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks schedule.view permission.")

        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks view access to unit.")

        schedule_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        from app.database.connection import get_db_connection
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT descendant_id FROM core.organization_unit_closure WHERE ancestor_id = %s;", (unit_id,))
                descendant_ids = [row[0] for row in cur.fetchall()]
                if not descendant_ids:
                    descendant_ids = [unit_id]

                # Fetch daily schedules mapping to the date
                query = """
                    SELECT s.employee_id, s.organization_unit_id, s.status_id, s.shift_type_id,
                           e.first_name, e.last_name, e.rank, e.position, ou.name
                    FROM workforce.employee_daily_schedule s
                    JOIN workforce.employees e ON s.employee_id = e.id
                    JOIN core.organization_units ou ON s.organization_unit_id = ou.id
                    WHERE s.schedule_date = %s AND s.organization_unit_id = ANY(%s);
                """
                cur.execute(query, (schedule_date, descendant_ids))
                rows = cur.fetchall()

                statuses_list = self._schedule_repo.list_statuses(tenant_id)
                id_to_code = {s.id: s.code.upper() for s in statuses_list}

                assignments = []
                status_counts = {s.code.upper(): 0 for s in statuses_list}
                org_breakdown = {}

                for r in rows:
                    emp_id = r[0]
                    o_unit_id = r[1]
                    status_id = r[2]
                    shift_type_id = r[3]
                    first_name = r[4]
                    last_name = r[5]
                    rank = r[6]
                    position = r[7]
                    unit_name = r[8]

                    status_code = id_to_code.get(status_id, "UNKNOWN")
                    status_counts[status_code] = status_counts.get(status_code, 0) + 1
                    org_breakdown[unit_name] = org_breakdown.get(unit_name, 0) + 1

                    shift_name = ""
                    if shift_type_id:
                        st = self._schedule_repo.get_shift_type_by_id(shift_type_id)
                        if st:
                            shift_name = st.name

                    assignments.append({
                        "employee_id": emp_id,
                        "display_name": f"{first_name} {last_name}",
                        "rank": rank,
                        "role": position,
                        "organization_unit": unit_name,
                        "status": status_code,
                        "shift": shift_name
                    })

                return {
                    "date": date_str,
                    "total_personnel": len(rows),
                    "statuses": status_counts,
                    "organization_breakdown": org_breakdown,
                    "assignments": assignments
                }
