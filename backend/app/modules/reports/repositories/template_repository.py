"""
Reports module — template repository.
Direct SQL via psycopg2. No ORM dependency.
"""
from typing import List, Optional, Any
from app.database.connection import get_db_connection
from app.modules.reports.models import ReportTemplate, ReportFormat, ReportType


class TemplateRepository:
    """Handles read-only data access for workforce.report_templates."""

    def _row_to_template(self, row) -> ReportTemplate:
        raw_formats = [f.strip() for f in str(row[4]).split(",")]
        return ReportTemplate(
            id=str(row[0]),
            code=ReportType(str(row[1])),
            name=str(row[2]),
            description=row[3],
            supported_formats=[ReportFormat(f) for f in raw_formats],
            enabled=bool(row[5]),
            created_at=row[6],
            updated_at=row[7]
        )

    def load_templates(self) -> List[ReportTemplate]:
        """Fetch all report templates."""
        query = """
            SELECT id, code, name, description, supported_formats, enabled, created_at, updated_at
            FROM workforce.report_templates
            ORDER BY name;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    return [self._row_to_template(row) for row in cur.fetchall()]
        except Exception:
            return []

    def list_enabled_templates(self) -> List[ReportTemplate]:
        """Fetch only enabled report templates."""
        query = """
            SELECT id, code, name, description, supported_formats, enabled, created_at, updated_at
            FROM workforce.report_templates
            WHERE enabled = TRUE
            ORDER BY name;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    return [self._row_to_template(row) for row in cur.fetchall()]
        except Exception:
            return []

    def load_template_by_code(self, code: Any) -> Optional[ReportTemplate]:
        """Fetch a single template by its unique code."""
        query = """
            SELECT id, code, name, description, supported_formats, enabled, created_at, updated_at
            FROM workforce.report_templates
            WHERE code = %s;
        """
        code_val = code.value if isinstance(code, ReportType) else str(code)
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (code_val,))
                    row = cur.fetchone()
                    return self._row_to_template(row) if row else None
        except Exception:
            return None
