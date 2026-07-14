"""
Reports module — report repository.
Direct SQL via psycopg2. No ORM dependency.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.connection import get_db_connection
from app.modules.reports.models import ReportRequest, ReportFormat, ReportStatus


class ReportRepository:
    """Handles DML operations for workforce.generated_reports."""

    def _row_to_request(self, row) -> ReportRequest:
        return ReportRequest(
            id=str(row[0]),
            tenant_id=str(row[1]),
            org_unit_id=str(row[2]) if row[2] else None,
            name=str(row[3]),
            report_type=str(row[4]),
            format=ReportFormat(str(row[5])),
            file_path=row[6],
            file_size=row[7],
            download_count=row[8] or 0,
            status=ReportStatus(str(row[9])),
            error_message=row[10],
            generated_by=str(row[11]),
            started_at=row[12],
            completed_at=row[13],
            created_at=row[14],
            file_name=row[15],
            generated_at=row[16],
            duration_ms=row[17],
            mime_type=row[18],
            checksum=row[19]
        )

    def create_report_request(
        self,
        tenant_id: str,
        name: str,
        report_type: str,
        format: str,
        generated_by: str,
        org_unit_id: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        """Insert a new PENDING report generation request. Returns new record ID."""
        import json
        query = """
            INSERT INTO workforce.generated_reports
                (tenant_id, org_unit_id, name, report_type, format, parameters_json, status, generated_by)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, 'PENDING', %s)
            RETURNING id;
        """
        params_json = json.dumps(parameters) if parameters else "{}"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (tenant_id, org_unit_id, name, report_type, format, params_json, generated_by))
                row = cur.fetchone()
                return str(row[0]) if row else ""

    def update_status(self, report_id: str, status: ReportStatus, error_message: Optional[str] = None) -> None:
        """Update a report request status and error message."""
        terminal_statuses = f"('{ReportStatus.COMPLETED.value}', '{ReportStatus.FAILED.value}')"
        query = f"""
            UPDATE workforce.generated_reports
            SET status = %s, error_message = %s,
                completed_at = CASE WHEN %s IN {terminal_statuses} THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (status.value, error_message, status.value, report_id))

    def save_report_result(
        self,
        report_id: str,
        file_name: str,
        file_size: int,
        duration_ms: int,
        mime_type: str,
        checksum: Optional[str] = None,
        file_path: Optional[str] = None
    ) -> None:
        """Persist generated report result metadata back into the unified table."""
        query = """
            UPDATE workforce.generated_reports
            SET status = 'COMPLETED',
                file_name = %s,
                file_size = %s,
                duration_ms = %s,
                mime_type = %s,
                checksum = %s,
                file_path = %s,
                generated_at = CURRENT_TIMESTAMP,
                completed_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (file_name, file_size, duration_ms, mime_type, checksum, file_path, report_id))

    def load_report(self, report_id: str) -> Optional[ReportRequest]:
        """Fetch a single report record by ID."""
        query = """
            SELECT id, tenant_id, org_unit_id, name, report_type, format,
                   file_path, file_size, download_count, status, error_message,
                   generated_by, started_at, completed_at, created_at,
                   file_name, generated_at, duration_ms, mime_type, checksum
            FROM workforce.generated_reports
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (report_id,))
                    row = cur.fetchone()
                    return self._row_to_request(row) if row else None
        except Exception:
            return None

    def load_reports_history(
        self,
        tenant_id: str,
        org_unit_id: Optional[str] = None,
        limit: int = 50
    ) -> List[ReportRequest]:
        """Fetch paginated report history for a tenant, optionally scoped by unit."""
        query = """
            SELECT id, tenant_id, org_unit_id, name, report_type, format,
                   file_path, file_size, download_count, status, error_message,
                   generated_by, started_at, completed_at, created_at,
                   file_name, generated_at, duration_ms, mime_type, checksum
            FROM workforce.generated_reports
            WHERE tenant_id = %s
        """
        params = [tenant_id]
        if org_unit_id:
            query += " AND org_unit_id = %s"
            params.append(org_unit_id)
        query += " ORDER BY created_at DESC LIMIT %s;"
        params.append(limit)
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, tuple(params))
                    return [self._row_to_request(row) for row in cur.fetchall()]
        except Exception:
            return []

    def load_pending_reports(self) -> List[ReportRequest]:
        """Fetch all PENDING report requests for background processing."""
        query = """
            SELECT id, tenant_id, org_unit_id, name, report_type, format,
                   file_path, file_size, download_count, status, error_message,
                   generated_by, started_at, completed_at, created_at,
                   file_name, generated_at, duration_ms, mime_type, checksum
            FROM workforce.generated_reports
            WHERE status = 'PENDING'
            ORDER BY created_at ASC;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    return [self._row_to_request(row) for row in cur.fetchall()]
        except Exception:
            return []

    def delete_report_request(self, report_id: str) -> bool:
        """Delete a report record and its metadata. Returns True if deleted."""
        query = "DELETE FROM workforce.generated_reports WHERE id = %s RETURNING id;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (report_id,))
                    return cur.fetchone() is not None
        except Exception:
            return False
