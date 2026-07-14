"""
Analytics module repository for dashboard snapshots.
"""
from typing import List, Dict, Any
from datetime import date
from app.database.connection import get_db_connection


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
