import logging
from typing import List, Optional
from datetime import datetime, date, time

from app.database.connection import get_db_connection
from app.modules.workforce_planning.models import (
    OrganizationWorkforceSettings,
    ShiftDefinition,
    DailyWorkforcePlan,
    EmployeeDailyAssignment
)

logger = logging.getLogger("pikud360.modules.workforce_planning.repositories")

class WorkforcePlanningRepository:
    """Repository managing settings, optional shift definitions, daily plans, and daily employee assignments."""

    # --- Settings Mappings ---

    def _row_to_settings(self, row) -> OrganizationWorkforceSettings:
        return OrganizationWorkforceSettings(
            id=row[0],
            org_unit_id=row[1],
            enable_shift_division=row[2],
            shift_model=row[3],
            created_at=row[4],
            updated_at=row[5]
        )

    def get_settings(self, org_unit_id: str) -> Optional[OrganizationWorkforceSettings]:
        query = """
            SELECT id, org_unit_id, enable_shift_division, shift_model, created_at, updated_at
            FROM core.organization_workforce_settings
            WHERE org_unit_id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_settings(row)
        except Exception as e:
            logger.error(f"Error fetching settings for unit {org_unit_id}: {e}", exc_info=True)
        return None

    def create_settings(self, settings: OrganizationWorkforceSettings) -> OrganizationWorkforceSettings:
        query = """
            INSERT INTO core.organization_workforce_settings (
                id, org_unit_id, enable_shift_division, shift_model
            ) VALUES (
                %s, %s, %s, %s
            ) RETURNING id, org_unit_id, enable_shift_division, shift_model, created_at, updated_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        settings.id, settings.org_unit_id, settings.enable_shift_division, settings.shift_model
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_settings(row)
        raise RuntimeError("Failed to create workforce settings.")

    def update_settings(self, org_unit_id: str, enable_shift_division: bool, shift_model: str) -> Optional[OrganizationWorkforceSettings]:
        query = """
            UPDATE core.organization_workforce_settings
            SET enable_shift_division = %s, shift_model = %s, updated_at = CURRENT_TIMESTAMP
            WHERE org_unit_id = %s
            RETURNING id, org_unit_id, enable_shift_division, shift_model, created_at, updated_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (enable_shift_division, shift_model, org_unit_id))
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_settings(row)
        return None

    # --- Shift Definitions Mappings ---

    def _row_to_shift_def(self, row) -> ShiftDefinition:
        return ShiftDefinition(
            id=row[0],
            org_unit_id=row[1],
            name=row[2],
            start_time=row[3],
            end_time=row[4],
            display_order=row[5],
            is_active=row[6],
            created_at=row[7]
        )

    def get_shift_definitions(self, org_unit_id: str) -> List[ShiftDefinition]:
        query = """
            SELECT id, org_unit_id, name, start_time, end_time, display_order, is_active, created_at
            FROM workforce_planning.shift_definitions
            WHERE org_unit_id = %s AND is_active = TRUE
            ORDER BY display_order, name;
        """
        defs = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id,))
                    for row in cur.fetchall():
                        defs.append(self._row_to_shift_def(row))
        except Exception as e:
            logger.error(f"Error fetching shift definitions for unit {org_unit_id}: {e}", exc_info=True)
        return defs

    def get_shift_definition_by_id(self, sd_id: str) -> Optional[ShiftDefinition]:
        query = """
            SELECT id, org_unit_id, name, start_time, end_time, display_order, is_active, created_at
            FROM workforce_planning.shift_definitions
            WHERE id = %s AND is_active = TRUE;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (sd_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_shift_def(row)
        except Exception as e:
            logger.error(f"Error fetching shift definition {sd_id}: {e}", exc_info=True)
        return None

    def create_shift_definition(self, sd: ShiftDefinition) -> ShiftDefinition:
        query = """
            INSERT INTO workforce_planning.shift_definitions (
                id, org_unit_id, name, start_time, end_time, display_order, is_active
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, org_unit_id, name, start_time, end_time, display_order, is_active, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        sd.id, sd.org_unit_id, sd.name, sd.start_time, sd.end_time, sd.display_order, sd.is_active
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_shift_def(row)
        raise RuntimeError("Failed to create shift definition.")

    # --- Daily Plan Mappings ---

    def _row_to_plan(self, row) -> DailyWorkforcePlan:
        return DailyWorkforcePlan(
            id=row[0],
            org_unit_id=row[1],
            plan_date=row[2],
            created_by=row[3],
            notes=row[4],
            created_at=row[5]
        )

    def get_plan_by_id(self, plan_id: str) -> Optional[DailyWorkforcePlan]:
        query = """
            SELECT id, org_unit_id, plan_date, created_by, notes, created_at
            FROM workforce_planning.daily_workforce_plans
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (plan_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_plan(row)
        except Exception as e:
            logger.error(f"Error fetching daily plan {plan_id}: {e}", exc_info=True)
        return None

    def get_plan_by_unit_and_date(self, org_unit_id: str, plan_date: date) -> Optional[DailyWorkforcePlan]:
        query = """
            SELECT id, org_unit_id, plan_date, created_by, notes, created_at
            FROM workforce_planning.daily_workforce_plans
            WHERE org_unit_id = %s AND plan_date = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id, plan_date))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_plan(row)
        except Exception as e:
            logger.error(f"Error fetching daily plan for unit {org_unit_id} on {plan_date}: {e}", exc_info=True)
        return None

    def create_plan(self, plan: DailyWorkforcePlan) -> DailyWorkforcePlan:
        query = """
            INSERT INTO workforce_planning.daily_workforce_plans (
                id, org_unit_id, plan_date, created_by, notes
            ) VALUES (
                %s, %s, %s, %s, %s
            ) RETURNING id, org_unit_id, plan_date, created_by, notes, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        plan.id, plan.org_unit_id, plan.plan_date, plan.created_by, plan.notes
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_plan(row)
        raise RuntimeError("Failed to create daily workforce plan.")

    # --- Daily Assignments Mappings ---

    def _row_to_assignment(self, row) -> EmployeeDailyAssignment:
        return EmployeeDailyAssignment(
            id=row[0],
            plan_id=row[1],
            employee_id=row[2],
            main_status_id=row[3],
            office_sub_status_id=row[4],
            shift_definition_id=row[5],
            notes=row[6],
            created_by=row[7],
            created_at=row[8]
        )

    def get_assignment_by_id(self, assignment_id: str) -> Optional[EmployeeDailyAssignment]:
        query = """
            SELECT id, plan_id, employee_id, main_status_id, office_sub_status_id, shift_definition_id, notes, created_by, created_at
            FROM workforce_planning.employee_daily_assignments
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (assignment_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_assignment(row)
        except Exception as e:
            logger.error(f"Error fetching assignment {assignment_id}: {e}", exc_info=True)
        return None

    def get_assignment_by_plan_and_employee(self, plan_id: str, employee_id: str) -> Optional[EmployeeDailyAssignment]:
        query = """
            SELECT id, plan_id, employee_id, main_status_id, office_sub_status_id, shift_definition_id, notes, created_by, created_at
            FROM workforce_planning.employee_daily_assignments
            WHERE plan_id = %s AND employee_id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (plan_id, employee_id))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_assignment(row)
        except Exception as e:
            logger.error(f"Error fetching assignment for plan {plan_id} and employee {employee_id}: {e}", exc_info=True)
        return None

    def create_assignment(self, ass: EmployeeDailyAssignment) -> EmployeeDailyAssignment:
        query = """
            INSERT INTO workforce_planning.employee_daily_assignments (
                id, plan_id, employee_id, main_status_id, office_sub_status_id, shift_definition_id, notes, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, plan_id, employee_id, main_status_id, office_sub_status_id, shift_definition_id, notes, created_by, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        ass.id, ass.plan_id, ass.employee_id, ass.main_status_id,
                        ass.office_sub_status_id, ass.shift_definition_id, ass.notes, ass.created_by
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_assignment(row)
        raise RuntimeError("Failed to create daily assignment.")

    def update_assignment(
        self,
        assignment_id: str,
        main_status_id: Optional[str],
        office_sub_status_id: Optional[str],
        shift_definition_id: Optional[str],
        notes: Optional[str]
    ) -> Optional[EmployeeDailyAssignment]:
        query = """
            UPDATE workforce_planning.employee_daily_assignments
            SET main_status_id = COALESCE(%s, main_status_id),
                office_sub_status_id = %s,
                shift_definition_id = %s,
                notes = COALESCE(%s, notes)
            WHERE id = %s
            RETURNING id, plan_id, employee_id, main_status_id, office_sub_status_id, shift_definition_id, notes, created_by, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        main_status_id, office_sub_status_id, shift_definition_id, notes, assignment_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_assignment(row)
        return None

    def list_assignments_by_plan(self, plan_id: str) -> List[EmployeeDailyAssignment]:
        query = """
            SELECT id, plan_id, employee_id, main_status_id, office_sub_status_id, shift_definition_id, notes, created_by, created_at
            FROM workforce_planning.employee_daily_assignments
            WHERE plan_id = %s;
        """
        list_ass = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (plan_id,))
                    for row in cur.fetchall():
                        list_ass.append(self._row_to_assignment(row))
        except Exception as e:
            logger.error(f"Error listing assignments for plan {plan_id}: {e}", exc_info=True)
        return list_ass
