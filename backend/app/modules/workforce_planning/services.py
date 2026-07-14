import uuid
import logging
from typing import List, Optional
from datetime import datetime, date

from app.modules.workforce_planning.models import (
    OrganizationWorkforceSettings,
    ShiftDefinition,
    DailyWorkforcePlan,
    EmployeeDailyAssignment
)
from app.modules.workforce_planning.repositories import WorkforcePlanningRepository
from app.modules.workforce.repositories import EmployeeRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce_planning.schemas import (
    WorkforceSettingsUpdateRequest,
    DailyPlanCreateRequest,
    AssignmentCreateRequest,
    AssignmentUpdateRequest
)
from app.core.authorization import can_view_employee, can_manage_unit, AccessDeniedError

logger = logging.getLogger("pikud360.modules.workforce_planning.services")

class WorkforcePlanningService:
    """Service class handling daily workforce planning, shift configurations, and statistics."""

    def __init__(
        self,
        planning_repo: WorkforcePlanningRepository,
        employee_repo: EmployeeRepository,
        audit_repo: AuditLogRepository
    ):
        self._planning_repo = planning_repo
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
        old_values: Optional[dict] = None
    ) -> None:
        try:
            import flask
            request_id = str(uuid.uuid4())
            ip_address = "127.0.0.1"
            user_agent = "WorkforcePlanningService"
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
                "table_name": "workforce_planning.daily_workforce_plans",
                "record_id": record_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "severity": "INFO"
            })
        except Exception as e:
            logger.error(f"Failed to write planning audit log: {e}", exc_info=True)

    def get_or_create_settings(self, org_unit_id: str) -> OrganizationWorkforceSettings:
        """Fetches workforce settings for the unit, initializing with defaults if missing."""
        settings = self._planning_repo.get_settings(org_unit_id)
        if not settings:
            settings = OrganizationWorkforceSettings(
                id=str(uuid.uuid4()),
                org_unit_id=org_unit_id,
                enable_shift_division=False,
                shift_model="NONE"
            )
            settings = self._planning_repo.create_settings(settings)
        return settings

    def update_settings(
        self,
        org_unit_id: str,
        req: WorkforceSettingsUpdateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> OrganizationWorkforceSettings:
        """Modifies workforce planning settings for the unit."""
        if not can_manage_unit(operator_user_id, tenant_id, org_unit_id):
            raise AccessDeniedError("Access Denied: Lacks permission to modify unit settings.")

        settings = self.get_or_create_settings(org_unit_id)
        enable_shift = req.enable_shift_division if req.enable_shift_division is not None else settings.enable_shift_division
        shift_model = req.shift_model if req.shift_model is not None else settings.shift_model

        updated = self._planning_repo.update_settings(org_unit_id, enable_shift, shift_model)
        if not updated:
            raise RuntimeError("Failed to update settings.")

        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="WORKFORCE_SETTINGS_CHANGED",
            action="UPDATE",
            record_id=org_unit_id,
            new_values={
                "enable_shift_division": updated.enable_shift_division,
                "shift_model": updated.shift_model
            },
            old_values={
                "enable_shift_division": settings.enable_shift_division,
                "shift_model": settings.shift_model
            }
        )

        return updated

    def create_daily_plan(
        self,
        req: DailyPlanCreateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> DailyWorkforcePlan:
        """Creates a daily workforce plan for the organization unit."""
        if not can_manage_unit(operator_user_id, tenant_id, req.org_unit_id):
            raise AccessDeniedError("Access Denied: Lacks permission to manage plans for this unit.")

        plan_date = datetime.strptime(req.plan_date, "%Y-%m-%d").date()

        # Idempotent fetch if already exists
        existing = self._planning_repo.get_plan_by_unit_and_date(req.org_unit_id, plan_date)
        if existing:
            return existing

        plan = DailyWorkforcePlan(
            id=str(uuid.uuid4()),
            org_unit_id=req.org_unit_id,
            plan_date=plan_date,
            created_by=operator_user_id,
            notes=req.notes
        )

        created_plan = self._planning_repo.create_plan(plan)

        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="WORKFORCE_PLAN_CREATED",
            action="CREATE",
            record_id=created_plan.id,
            new_values={
                "org_unit_id": created_plan.org_unit_id,
                "plan_date": created_plan.plan_date.isoformat()
            }
        )

        return created_plan

    def assign_employee_status(
        self,
        plan_id: str,
        req: AssignmentCreateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> EmployeeDailyAssignment:
        """Assigns an employee's availability status and optional shift in the daily plan."""
        plan = self._planning_repo.get_plan_by_id(plan_id)
        if not plan:
            raise ValueError("Daily plan not found.")

        # Verify manager permissions on target unit
        if not can_manage_unit(operator_user_id, tenant_id, plan.org_unit_id):
            raise AccessDeniedError("Access Denied: Lacks permission to manage assignments in this unit.")

        emp = self._employee_repo.get_by_id(req.employee_id)
        if not emp:
            raise ValueError("Employee not found.")

        # 1. Reject employee outside organization scope
        if emp.org_unit_id != plan.org_unit_id:
            # Check recursive descendants closure tree scope
            from app.database.connection import get_db_connection
            closure_query = """
                SELECT 1 FROM core.organization_unit_closure
                WHERE ancestor_id = %s AND descendant_id = %s;
            """
            is_descendant = False
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(closure_query, (plan.org_unit_id, emp.org_unit_id))
                    if cur.fetchone():
                        is_descendant = True
            if not is_descendant:
                raise ValueError("Employee resides outside the organization unit planning scope.")

        # 2. Reject duplicate assignment on same day
        existing = self._planning_repo.get_assignment_by_plan_and_employee(plan_id, req.employee_id)
        if existing:
            raise ValueError("Employee already assigned in today's daily plan.")

        # 3. Reject shift assignment configurations constraints
        settings = self.get_or_create_settings(plan.org_unit_id)
        if req.shift_definition_id and not settings.enable_shift_division:
            raise ValueError("Shift assignment is disabled for this unit.")
        if settings.enable_shift_division and not req.shift_definition_id:
            raise ValueError("Shift assignment is required when shift division is enabled.")

        ass = EmployeeDailyAssignment(
            id=str(uuid.uuid4()),
            plan_id=plan_id,
            employee_id=req.employee_id,
            main_status_id=req.main_status_id,
            office_sub_status_id=req.office_sub_status_id,
            shift_definition_id=req.shift_definition_id,
            notes=req.notes,
            created_by=operator_user_id
        )

        created = self._planning_repo.create_assignment(ass)

        # Audit events
        self._write_audit_log(
            tenant_id=tenant_id,
            user_id=operator_user_id,
            event_type="EMPLOYEE_DAILY_ASSIGNED",
            action="CREATE",
            record_id=created.id,
            new_values={
                "plan_id": created.plan_id,
                "employee_id": created.employee_id,
                "main_status_id": created.main_status_id
            }
        )

        if created.shift_definition_id:
            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_user_id,
                event_type="EMPLOYEE_SHIFT_ASSIGNED",
                action="CREATE",
                record_id=created.id,
                new_values={
                    "employee_id": created.employee_id,
                    "shift_definition_id": created.shift_definition_id
                }
            )

        return created

    def update_assignment(
        self,
        assignment_id: str,
        req: AssignmentUpdateRequest,
        tenant_id: str,
        operator_user_id: str
    ) -> Optional[EmployeeDailyAssignment]:
        """Modifies attributes of an existing daily assignment."""
        ass = self._planning_repo.get_assignment_by_id(assignment_id)
        if not ass:
            return None

        plan = self._planning_repo.get_plan_by_id(ass.plan_id)
        if not plan or not can_manage_unit(operator_user_id, tenant_id, plan.org_unit_id):
            raise AccessDeniedError("Access Denied: Lacks permission to modify assignments.")

        settings = self.get_or_create_settings(plan.org_unit_id)
        if req.shift_definition_id and not settings.enable_shift_division:
            raise ValueError("Shift assignment is disabled for this unit.")

        updated = self._planning_repo.update_assignment(
            assignment_id=assignment_id,
            main_status_id=req.main_status_id,
            office_sub_status_id=req.office_sub_status_id,
            shift_definition_id=req.shift_definition_id,
            notes=req.notes
        )

        if updated:
            self._write_audit_log(
                tenant_id=tenant_id,
                user_id=operator_user_id,
                event_type="EMPLOYEE_DAILY_ASSIGNED",
                action="UPDATE",
                record_id=assignment_id,
                new_values={
                    "main_status_id": updated.main_status_id,
                    "shift_definition_id": updated.shift_definition_id
                },
                old_values={
                    "main_status_id": ass.main_status_id,
                    "shift_definition_id": ass.shift_definition_id
                }
            )

        return updated

    def get_daily_workforce_summary(
        self,
        unit_id: str,
        date_str: str,
        tenant_id: str,
        operator_user_id: str
    ) -> dict:
        """Compiles manpower availability dashboard stats summary for the specified unit and date."""
        if not can_view_employee(operator_user_id, tenant_id, unit_id):
            raise AccessDeniedError(f"Access Denied: Lacks permission to view workforce planning for unit {unit_id}.")

        plan_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        # Count total active employees
        from app.database.connection import get_db_connection
        count_query = """
            SELECT COUNT(*) FROM workforce.employees
            WHERE org_unit_id = %s AND deleted_at IS NULL;
        """
        total_employees = 0
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(count_query, (unit_id,))
                row = cur.fetchone()
                if row:
                    total_employees = row[0]

        settings = self.get_or_create_settings(unit_id)
        plan = self._planning_repo.get_plan_by_unit_and_date(unit_id, plan_date)

        statuses = {
            "available": 0,
            "sick": 0,
            "vacation": 0,
            "reinforcement": 0,
            "absent": total_employees
        }
        shifts_summary = {}

        if plan:
            assignments = self._planning_repo.list_assignments_by_plan(plan.id)
            assigned_count = len(assignments)
            
            # Absent employees are count of active who are unreported/unassigned in daily plan
            statuses["absent"] = max(0, total_employees - assigned_count)

            for ass in assignments:
                # Resolve status name
                status_query = "SELECT name FROM workforce.main_statuses WHERE id = %s;"
                status_name = ""
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(status_query, (ass.main_status_id,))
                        row = cur.fetchone()
                        if row:
                            status_name = row[0].upper()

                if "OFFICE" in status_name or "AVAILABLE" in status_name:
                    statuses["available"] += 1
                elif "SICK" in status_name:
                    statuses["sick"] += 1
                elif "VACATION" in status_name:
                    statuses["vacation"] += 1
                elif "REINFORCEMENT" in status_name:
                    statuses["reinforcement"] += 1
                else:
                    statuses["available"] += 1

                # Compile shifts if enabled
                if settings.enable_shift_division and ass.shift_definition_id:
                    shift_def = self._planning_repo.get_shift_definition_by_id(ass.shift_definition_id)
                    if shift_def:
                        sd_name = shift_def.name.lower()
                        # Map common Hebrew shift names to English dashboard response fields
                        if "בוקר" in sd_name or "morning" in sd_name:
                            key = "morning"
                        elif "צהריים" in sd_name or "noon" in sd_name:
                            key = "noon"
                        elif "ערב" in sd_name or "evening" in sd_name:
                            key = "evening"
                        elif "לילה" in sd_name or "night" in sd_name:
                            key = "night"
                        else:
                            key = sd_name
                        shifts_summary[key] = shifts_summary.get(key, 0) + 1

        res = {
            "date": date_str,
            "total": total_employees,
            "statuses": statuses
        }

        if settings.enable_shift_division:
            # Ensure morning, noon, evening, night defaults exist if shift model is enabled
            res["shifts"] = {
                "morning": shifts_summary.get("morning", 0),
                "noon": shifts_summary.get("noon", 0),
                "evening": shifts_summary.get("evening", 0),
                "night": shifts_summary.get("night", 0)
            }
            # Append other custom keys if reported
            for k, v in shifts_summary.items():
                if k not in res["shifts"]:
                    res["shifts"][k] = v

        return res
