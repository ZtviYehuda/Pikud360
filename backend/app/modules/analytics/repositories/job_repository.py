"""
Analytics Background Scheduler repository.
Manages read/write operations for audit.job_history and prunes expired data.
"""
from typing import Dict, Any, Optional
from datetime import datetime, date
from app.database.connection import get_db_connection


class JobRepository:
    """Handles data access for job executions history and cleanup routines."""

    def log_job_start(self, job_name: str, tenant_id: Optional[str] = None) -> str:
        """Insert a started job run record and return its UUID."""
        query = """
            INSERT INTO audit.job_history (tenant_id, job_name, started_at, success, records_processed)
            VALUES (%s, %s, CURRENT_TIMESTAMP, FALSE, 0)
            RETURNING id;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (tenant_id, job_name))
                row = cur.fetchone()
                return str(row[0]) if row else ""

    def log_job_end(self, job_id: str, success: bool, error_message: Optional[str] = None, records_processed: int = 0) -> None:
        """Update job history record with duration and execution results."""
        query = """
            UPDATE audit.job_history
            SET finished_at = CURRENT_TIMESTAMP,
                duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) * 1000,
                success = %s,
                error_message = %s,
                records_processed = %s
            WHERE id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (success, error_message, records_processed, job_id))

    def get_last_job_run(self, job_name: str, tenant_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Fetch the most recent run details for a given job."""
        query = """
            SELECT started_at, finished_at, success, error_message, records_processed, duration_ms
            FROM audit.job_history
            WHERE job_name = %s
        """
        params = [job_name]
        if tenant_id:
            query += " AND tenant_id = %s"
            params.append(tenant_id)
        query += " ORDER BY started_at DESC LIMIT 1;"

        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, tuple(params))
                    row = cur.fetchone()
                    if row:
                        return {
                            "started_at": row[0],
                            "finished_at": row[1],
                            "success": row[2],
                            "error_message": row[3],
                            "records_processed": row[4],
                            "duration_ms": row[5]
                        }
            return None
        except Exception:
            return None

    def get_job_stats(self, job_name: str, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Aggregate run statistics for the specified job name."""
        query = """
            SELECT 
                COALESCE(AVG(duration_ms), 0)::INTEGER AS avg_duration,
                COUNT(*) FILTER (WHERE NOT success) AS error_count,
                SUM(records_processed) AS total_records,
                MAX(started_at) FILTER (WHERE success) AS last_success,
                MAX(started_at) FILTER (WHERE NOT success) AS last_failure
            FROM audit.job_history
            WHERE job_name = %s
        """
        params = [job_name]
        if tenant_id:
            query += " AND tenant_id = %s"
            params.append(tenant_id)

        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, tuple(params))
                    row = cur.fetchone()
                    
                    last_run = self.get_last_job_run(job_name, tenant_id)
                    last_duration = last_run["duration_ms"] if last_run else 0
                    last_processed = last_run["records_processed"] if last_run else 0
                    
                    return {
                        "average_duration_ms": row[0] if row else 0,
                        "error_count": row[1] if row else 0,
                        "records_processed": last_processed,
                        "last_duration_ms": last_duration,
                        "last_success": row[3] if row and row[3] else None,
                        "last_failure": row[4] if row and row[4] else None
                    }
        except Exception:
            return {
                "average_duration_ms": 0,
                "error_count": 0,
                "records_processed": 0,
                "last_duration_ms": 0,
                "last_success": None,
                "last_failure": None
            }

    def prune_all_expired_data(self, retention_days: int, tenant_id: Optional[str] = None) -> int:
        """Systematically prune expired dashboard snapshots, reports, and job runs."""
        snapshots_query = "DELETE FROM workforce.dashboard_snapshots WHERE snapshot_date < CURRENT_DATE - %s::INT"
        reports_query = "DELETE FROM workforce.generated_reports WHERE created_at < CURRENT_TIMESTAMP - (%s || ' days')::INTERVAL"
        history_query = "DELETE FROM audit.job_history WHERE started_at < CURRENT_TIMESTAMP - (%s || ' days')::INTERVAL"
        
        # Scope filters if tenant ID is supplied
        snapshots_params = [retention_days]
        reports_params = [retention_days]
        history_params = [retention_days]
        
        if tenant_id:
            snapshots_query += " AND tenant_id = %s"
            snapshots_params.append(tenant_id)
            
            reports_query += " AND tenant_id = %s"
            reports_params.append(tenant_id)
            
            history_query += " AND tenant_id = %s"
            history_params.append(tenant_id)

        rows_deleted = 0
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(snapshots_query, tuple(snapshots_params))
                    rows_deleted += cur.rowcount
                    
                    cur.execute(reports_query, tuple(reports_params))
                    rows_deleted += cur.rowcount
                    
                    cur.execute(history_query, tuple(history_params))
                    rows_deleted += cur.rowcount
            return rows_deleted
        except Exception:
            return 0
