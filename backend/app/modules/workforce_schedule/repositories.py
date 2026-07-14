import logging
import uuid
from typing import List, Optional
from datetime import datetime, date, time

from app.database.connection import get_db_connection
from app.modules.workforce_schedule.models import (
    ScheduleSettings,
    ShiftType,
    ScheduleStatus,
    EmployeeDailySchedule
)

logger = logging.getLogger("pikud360.modules.workforce_schedule.repositories")

class WorkforceScheduleRepository:
    """Repository managing workforce.schedule_settings, shift_types, schedule_statuses, and employee_daily_schedule."""

    # --- Schedule Settings ---

    def _row_to_settings(self, row) -> ScheduleSettings:
        return ScheduleSettings(
            id=row[0],
            tenant_id=row[1],
            organization_unit_id=row[2],
            scheduling_mode=row[3],
            unassigned_threshold=float(row[7]) if row[7] is not None else 10.0,
            sick_threshold=float(row[8]) if row[8] is not None else 5.0,
            shortage_threshold=float(row[9]) if row[9] is not None else 70.0,
            created_by=row[4],
            created_at=row[5],
            updated_at=row[6]
        )

    def get_settings(self, org_unit_id: str) -> Optional[ScheduleSettings]:
        query = """
            SELECT id, tenant_id, organization_unit_id, scheduling_mode, created_by, created_at, updated_at, unassigned_threshold, sick_threshold, shortage_threshold
            FROM workforce.schedule_settings
            WHERE organization_unit_id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_settings(row)
        except Exception as e:
            logger.error(f"Error fetching schedule settings for unit {org_unit_id}: {e}", exc_info=True)
        return None

    def create_settings(self, settings: ScheduleSettings) -> ScheduleSettings:
        query = """
            INSERT INTO workforce.schedule_settings (
                id, tenant_id, organization_unit_id, scheduling_mode, created_by, unassigned_threshold, sick_threshold, shortage_threshold
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, tenant_id, organization_unit_id, scheduling_mode, created_by, created_at, updated_at, unassigned_threshold, sick_threshold, shortage_threshold;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        settings.id, settings.tenant_id, settings.organization_unit_id,
                        settings.scheduling_mode, settings.created_by,
                        settings.unassigned_threshold, settings.sick_threshold, settings.shortage_threshold
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_settings(row)
        raise RuntimeError("Failed to create schedule settings.")

    def update_settings(
        self,
        org_unit_id: str,
        scheduling_mode: str,
        unassigned_threshold: Optional[float] = None,
        sick_threshold: Optional[float] = None,
        shortage_threshold: Optional[float] = None
    ) -> Optional[ScheduleSettings]:
        query = """
            UPDATE workforce.schedule_settings
            SET scheduling_mode = %s,
                unassigned_threshold = COALESCE(%s, unassigned_threshold),
                sick_threshold = COALESCE(%s, sick_threshold),
                shortage_threshold = COALESCE(%s, shortage_threshold),
                updated_at = CURRENT_TIMESTAMP
            WHERE organization_unit_id = %s
            RETURNING id, tenant_id, organization_unit_id, scheduling_mode, created_by, created_at, updated_at, unassigned_threshold, sick_threshold, shortage_threshold;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (scheduling_mode, unassigned_threshold, sick_threshold, shortage_threshold, org_unit_id))
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_settings(row)
        return None

    # --- Shift Types ---

    def _row_to_shift_type(self, row) -> ShiftType:
        return ShiftType(
            id=row[0],
            tenant_id=row[1],
            organization_unit_id=row[2],
            name=row[3],
            start_time=row[4],
            end_time=row[5],
            active=row[6],
            created_by=row[7],
            created_at=row[8]
        )

    def get_shift_types(self, org_unit_id: str) -> List[ShiftType]:
        query = """
            SELECT id, tenant_id, organization_unit_id, name, start_time, end_time, active, created_by, created_at
            FROM workforce.shift_types
            WHERE organization_unit_id = %s AND active = TRUE
            ORDER BY name;
        """
        shifts = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id,))
                    for row in cur.fetchall():
                        shifts.append(self._row_to_shift_type(row))
        except Exception as e:
            logger.error(f"Error fetching shift types for unit {org_unit_id}: {e}", exc_info=True)
        return shifts

    def get_shift_type_by_id(self, st_id: str) -> Optional[ShiftType]:
        query = """
            SELECT id, tenant_id, organization_unit_id, name, start_time, end_time, active, created_by, created_at
            FROM workforce.shift_types
            WHERE id = %s AND active = TRUE;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (st_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_shift_type(row)
        except Exception as e:
            logger.error(f"Error fetching shift type {st_id}: {e}", exc_info=True)
        return None

    def create_shift_type(self, st: ShiftType) -> ShiftType:
        query = """
            INSERT INTO workforce.shift_types (
                id, tenant_id, organization_unit_id, name, start_time, end_time, active, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, tenant_id, organization_unit_id, name, start_time, end_time, active, created_by, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        st.id, st.tenant_id, st.organization_unit_id, st.name,
                        st.start_time, st.end_time, st.active, st.created_by
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_shift_type(row)
        raise RuntimeError("Failed to create shift type.")

    # --- Schedule Statuses ---

    def _row_to_status(self, row) -> ScheduleStatus:
        return ScheduleStatus(
            id=row[0],
            tenant_id=row[1],
            code=row[2],
            name=row[3],
            category=row[4],
            color=row[5],
            is_active=row[6],
            sort_order=row[7],
            created_by=row[8],
            created_at=row[9],
            updated_at=row[10]
        )

    def list_statuses(self, tenant_id: str) -> List[ScheduleStatus]:
        """Lists active statuses for the tenant, auto-seeding defaults if empty."""
        query = """
            SELECT id, tenant_id, code, name, category, color, is_active, sort_order, created_by, created_at, updated_at
            FROM workforce.schedule_statuses
            WHERE tenant_id = %s AND is_active = TRUE
            ORDER BY sort_order, name;
        """
        statuses = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    for row in cur.fetchall():
                        statuses.append(self._row_to_status(row))
        except Exception as e:
            logger.error(f"Error fetching statuses for tenant {tenant_id}: {e}", exc_info=True)

        if not statuses:
            # Self-healing seeding of default system statuses
            defaults = [
                ("AVAILABLE", "Available", "AVAILABLE", "#4CAF50", 10),
                ("SICK", "Sick", "SICK", "#F44336", 20),
                ("VACATION", "Vacation", "VACATION", "#FF9800", 30),
                ("TRAINING", "Training", "TRAINING", "#2196F3", 40),
                ("MISSION", "Mission", "MISSION", "#9C27B0", 50),
                ("REINFORCEMENT", "Reinforcement", "REINFORCEMENT", "#00BCD4", 60),
                ("UNAVAILABLE", "Unavailable", "UNAVAILABLE", "#9E9E9E", 70),
                ("OTHER", "Other", "OTHER", "#795548", 80)
            ]
            for code, name, category, color, order in defaults:
                try:
                    st = ScheduleStatus(
                        id=str(uuid.uuid4()),
                        tenant_id=tenant_id,
                        code=code,
                        name=name,
                        category=category,
                        color=color,
                        is_active=True,
                        sort_order=order
                    )
                    self.create_status(st)
                    statuses.append(st)
                except Exception as ex:
                    logger.error(f"Failed to auto-seed default status {code}: {ex}", exc_info=True)
            statuses.sort(key=lambda x: (x.sort_order, x.name))
        return statuses

    def get_status_by_id(self, status_id: str) -> Optional[ScheduleStatus]:
        query = """
            SELECT id, tenant_id, code, name, category, color, is_active, sort_order, created_by, created_at, updated_at
            FROM workforce.schedule_statuses
            WHERE id = %s AND is_active = TRUE;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (status_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_status(row)
        except Exception as e:
            logger.error(f"Error fetching status {status_id}: {e}", exc_info=True)
        return None

    def get_status_by_code(self, tenant_id: str, code: str) -> Optional[ScheduleStatus]:
        query = """
            SELECT id, tenant_id, code, name, category, color, is_active, sort_order, created_by, created_at, updated_at
            FROM workforce.schedule_statuses
            WHERE tenant_id = %s AND code = %s AND is_active = TRUE;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id, code))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_status(row)
        except Exception as e:
            logger.error(f"Error fetching status code {code} for tenant {tenant_id}: {e}", exc_info=True)
        return None

    def create_status(self, status: ScheduleStatus) -> ScheduleStatus:
        query = """
            INSERT INTO workforce.schedule_statuses (
                id, tenant_id, code, name, category, color, is_active, sort_order, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, tenant_id, code, name, category, color, is_active, sort_order, created_by, created_at, updated_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        status.id, status.tenant_id, status.code, status.name, status.category,
                        status.color, status.is_active, status.sort_order, status.created_by
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_status(row)
        raise RuntimeError("Failed to create scheduling status.")

    def update_status(
        self,
        status_id: str,
        name: Optional[str],
        category: Optional[str],
        color: Optional[str],
        sort_order: Optional[int],
        is_active: Optional[bool]
    ) -> Optional[ScheduleStatus]:
        query = """
            UPDATE workforce.schedule_statuses
            SET name = COALESCE(%s, name),
                category = COALESCE(%s, category),
                color = COALESCE(%s, color),
                sort_order = COALESCE(%s, sort_order),
                is_active = COALESCE(%s, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, tenant_id, code, name, category, color, is_active, sort_order, created_by, created_at, updated_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (name, category, color, sort_order, is_active, status_id))
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_status(row)
        return None

    def soft_delete_status(self, status_id: str) -> bool:
        query = """
            UPDATE workforce.schedule_statuses
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (status_id,))
                rowcount = cur.rowcount
                conn.commit()
                return rowcount > 0

    # --- Employee Daily Schedule ---

    def _row_to_schedule(self, row) -> EmployeeDailySchedule:
        return EmployeeDailySchedule(
            id=row[0],
            tenant_id=row[1],
            employee_id=row[2],
            organization_unit_id=row[3],
            schedule_date=row[4],
            status_id=row[5],
            shift_type_id=row[6],
            start_time=row[7],
            end_time=row[8],
            notes=row[9],
            created_by_commander_id=row[10],
            updated_by_commander_id=row[11],
            created_at=row[12],
            updated_at=row[13]
        )

    def get_schedule_by_id(self, schedule_id: str) -> Optional[EmployeeDailySchedule]:
        query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at
            FROM workforce.employee_daily_schedule
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (schedule_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_schedule(row)
        except Exception as e:
            logger.error(f"Error fetching schedule {schedule_id}: {e}", exc_info=True)
        return None

    def get_schedule_by_employee_and_date(self, employee_id: str, schedule_date: date) -> Optional[EmployeeDailySchedule]:
        query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at
            FROM workforce.employee_daily_schedule
            WHERE employee_id = %s AND schedule_date = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (employee_id, schedule_date))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_schedule(row)
        except Exception as e:
            logger.error(f"Error fetching schedule for employee {employee_id} on {schedule_date}: {e}", exc_info=True)
        return None

    def create_schedule(self, schedule: EmployeeDailySchedule) -> EmployeeDailySchedule:
        query = """
            INSERT INTO workforce.employee_daily_schedule (
                id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        schedule.id, schedule.tenant_id, schedule.employee_id, schedule.organization_unit_id,
                        schedule.schedule_date, schedule.status_id, schedule.shift_type_id, schedule.start_time,
                        schedule.end_time, schedule.notes, schedule.created_by_commander_id, schedule.updated_by_commander_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_schedule(row)
        raise RuntimeError("Failed to create daily schedule entry.")

    def update_schedule(
        self,
        schedule_id: str,
        status_id: Optional[str],
        shift_type_id: Optional[str],
        start_time: Optional[time],
        end_time: Optional[time],
        notes: Optional[str],
        commander_id: str
    ) -> Optional[EmployeeDailySchedule]:
        query = """
            UPDATE workforce.employee_daily_schedule
            SET status_id = COALESCE(%s, status_id),
                shift_type_id = %s,
                start_time = %s,
                end_time = %s,
                notes = COALESCE(%s, notes),
                updated_by_commander_id = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        status_id, shift_type_id, start_time, end_time, notes, commander_id, schedule_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_schedule(row)
        return None

    def delete_schedule(self, schedule_id: str) -> bool:
        query = """
            DELETE FROM workforce.employee_daily_schedule WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (schedule_id,))
                    rowcount = cur.rowcount
                    conn.commit()
                    return rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting schedule {schedule_id}: {e}", exc_info=True)
        return False

    def get_employee_history(self, employee_id: str) -> List[EmployeeDailySchedule]:
        query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at
            FROM workforce.employee_daily_schedule
            WHERE employee_id = %s
            ORDER BY schedule_date DESC;
        """
        history = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (employee_id,))
                    for row in cur.fetchall():
                        history.append(self._row_to_schedule(row))
        except Exception as e:
            logger.error(f"Error listing employee history: {e}", exc_info=True)
        return history

    def get_unit_schedules_by_date(self, unit_id: str, schedule_date: date) -> List[EmployeeDailySchedule]:
        query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes, created_by_commander_id, updated_by_commander_id, created_at, updated_at
            FROM workforce.employee_daily_schedule
            WHERE organization_unit_id = %s AND schedule_date = %s;
        """
        schedules = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id, schedule_date))
                    for row in cur.fetchall():
                        schedules.append(self._row_to_schedule(row))
        except Exception as e:
            logger.error(f"Error fetching schedules for unit {unit_id} on {schedule_date}: {e}", exc_info=True)
        return schedules
