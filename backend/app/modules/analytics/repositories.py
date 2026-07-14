"""
Analytics module repositories mapping raw database queries.
Separates concerns into AnalyticsRepository, SnapshotRepository, and AlertRepository.
"""
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from app.database.connection import get_db_connection
from app.modules.analytics.models import AlertRule, DashboardSnapshot, GeneratedReport


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


class SnapshotRepository:
    """Handles raw DML operations for pre-aggregated dashboard snapshots."""

    def upsert_snapshot(self, snapshot: Dict[str, Any]) -> None:
        """Insert or update a dashboard snapshot for an org unit, date, and hour."""
        query = """
            INSERT INTO workforce.dashboard_snapshots (
                tenant_id, org_unit_id, snapshot_date, snapshot_hour,
                total_employees, assigned_employees, unassigned_employees,
                available_count, sick_count, vacation_count, training_count,
                mission_count, reinforcement_count, other_count, readiness_percentage,
                status_distribution, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, org_unit_id, snapshot_date, snapshot_hour) DO UPDATE SET
                total_employees = EXCLUDED.total_employees,
                assigned_employees = EXCLUDED.assigned_employees,
                unassigned_employees = EXCLUDED.unassigned_employees,
                available_count = EXCLUDED.available_count,
                sick_count = EXCLUDED.sick_count,
                vacation_count = EXCLUDED.vacation_count,
                training_count = EXCLUDED.training_count,
                mission_count = EXCLUDED.mission_count,
                reinforcement_count = EXCLUDED.reinforcement_count,
                other_count = EXCLUDED.other_count,
                readiness_percentage = EXCLUDED.readiness_percentage,
                status_distribution = EXCLUDED.status_distribution,
                updated_at = CURRENT_TIMESTAMP;
        """
        params = (
            snapshot["tenant_id"], snapshot["org_unit_id"], snapshot["snapshot_date"], snapshot["snapshot_hour"],
            snapshot["total_employees"], snapshot["assigned_employees"], snapshot["unassigned_employees"],
            snapshot["available_count"], snapshot["sick_count"], snapshot["vacation_count"], snapshot["training_count"],
            snapshot["mission_count"], snapshot["reinforcement_count"], snapshot["other_count"], snapshot["readiness_percentage"],
            snapshot["status_distribution"]
        )
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)

    def load_snapshots_history(self, descendant_ids: List[str], start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Fetch historical snapshots from workforce.dashboard_snapshots."""
        query = """
            SELECT id, tenant_id, org_unit_id, snapshot_date, snapshot_hour,
                   total_employees, assigned_employees, unassigned_employees,
                   available_count, sick_count, vacation_count, training_count,
                   mission_count, reinforcement_count, other_count, readiness_percentage,
                   status_distribution, updated_at
            FROM workforce.dashboard_snapshots
            WHERE org_unit_id = ANY(%s) AND snapshot_date BETWEEN %s AND %s
            ORDER BY snapshot_date ASC, snapshot_hour ASC;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (descendant_ids, start_date, end_date))
                    return [
                        {
                            "id": row[0],
                            "tenant_id": row[1],
                            "org_unit_id": row[2],
                            "snapshot_date": row[3],
                            "snapshot_hour": row[4],
                            "total_employees": row[5],
                            "assigned_employees": row[6],
                            "unassigned_employees": row[7],
                            "available_count": row[8],
                            "sick_count": row[9],
                            "vacation_count": row[10],
                            "training_count": row[11],
                            "mission_count": row[12],
                            "reinforcement_count": row[13],
                            "other_count": row[14],
                            "readiness_percentage": float(row[15]) if row[15] is not None else 100.0,
                            "status_distribution": row[16],
                            "updated_at": row[17]
                        }
                        for row in cur.fetchall()
                    ]
        except Exception:
            return []


class AlertRepository:
    """Handles raw DML operations for alert rules validation."""

    def load_alert_rules(self, tenant_id: str, unit_id: Optional[str] = None) -> List[AlertRule]:
        """Fetch configured alert rules from workforce.alert_rules."""
        query = """
            SELECT id, tenant_id, org_unit_id, name, metric_name, operator, threshold_value, evaluation_period, severity, is_active
            FROM workforce.alert_rules
            WHERE tenant_id = %s AND is_active = TRUE
        """
        params = [tenant_id]
        if unit_id:
            query += " AND (org_unit_id IS NULL OR org_unit_id = %s)"
            params.append(unit_id)
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, tuple(params))
                    return [
                        AlertRule(
                            id=row[0],
                            tenant_id=row[1],
                            org_unit_id=row[2],
                            name=row[3],
                            metric_name=row[4],
                            operator=row[5],
                            threshold_value=float(row[6]),
                            evaluation_period=row[7],
                            severity=row[8],
                            is_active=row[9]
                        )
                        for row in cur.fetchall()
                    ]
        except Exception:
            return []
