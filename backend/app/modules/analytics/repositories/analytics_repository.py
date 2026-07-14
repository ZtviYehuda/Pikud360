"""
Analytics module repository for core analytics lookups.
"""
from typing import List, Dict, Any
from datetime import date
from app.database.connection import get_db_connection


class AnalyticsRepository:
    """Handles raw queries for schedules, hierarchy resolutions, personnel counts, and statuses."""

    def load_organization_subtree(self, unit_id: str) -> List[str]:
        """Fetch all descendant organization unit IDs recursively using the closure table."""
        query = "SELECT descendant_id FROM core.organization_unit_closure WHERE ancestor_id = %s;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    return [row[0] for row in cur.fetchall()]
        except Exception:
            return [unit_id]

    def load_child_units(self, unit_id: str) -> List[Dict[str, str]]:
        """Fetch immediate child organization units (one level down)."""
        query = "SELECT id, name FROM core.organization_units WHERE parent_id = %s AND deleted_at IS NULL;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    return [{"id": row[0], "name": row[1]} for row in cur.fetchall()]
        except Exception:
            return []

    def load_employee_counts(self, descendant_ids: List[str]) -> int:
        """Count all active employees assigned to the specified units."""
        query = "SELECT COUNT(*) FROM workforce.employees WHERE org_unit_id = ANY(%s) AND deleted_at IS NULL;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (descendant_ids,))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception:
            return 0

    def load_schedule_statuses(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Fetch all configured schedule statuses for a given tenant."""
        query = """
            SELECT id, code, name, category, color, is_active
            FROM workforce.schedule_statuses
            WHERE tenant_id = %s AND is_active = TRUE
            ORDER BY sort_order ASC, code ASC;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    return [
                        {
                            "id": row[0],
                            "code": row[1],
                            "name": row[2],
                            "category": row[3],
                            "color": row[4],
                            "is_active": row[5]
                        }
                        for row in cur.fetchall()
                    ]
        except Exception:
            return []

    def load_workforce_schedule_by_date(
        self, descendant_ids: List[str], start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """Retrieve daily schedule assignments in the specified date range."""
        query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes
            FROM workforce.employee_daily_schedule
            WHERE organization_unit_id = ANY(%s) AND schedule_date BETWEEN %s AND %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (descendant_ids, start_date, end_date))
                    return [
                        {
                            "id": row[0],
                            "tenant_id": row[1],
                            "employee_id": row[2],
                            "organization_unit_id": row[3],
                            "schedule_date": row[4],
                            "status_id": row[5],
                            "shift_type_id": row[6],
                            "start_time": row[7],
                            "end_time": row[8],
                            "notes": row[9]
                        }
                        for row in cur.fetchall()
                    ]
        except Exception:
            return []

    def load_active_shifts_count(self, descendant_ids: List[str], start_date: date, end_date: date) -> int:
        """Count shift assignments inside shifts scheduler domain."""
        query = """
            SELECT COUNT(*) FROM shifts.shift_assignments sa
            JOIN shifts.shift_schedules ss ON ss.id = sa.shift_schedule_id
            JOIN shifts.shift_templates st ON st.id = ss.shift_template_id
            WHERE st.org_unit_id = ANY(%s) AND ss.schedule_date BETWEEN %s AND %s AND ss.deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (descendant_ids, start_date, end_date))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception:
            return 0
