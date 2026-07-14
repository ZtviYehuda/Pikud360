"""
Reports module download management.
Provides clean service verification and delivery access control logic.
"""
import os
from typing import Optional, Tuple
from app.core.authorization.exceptions import AccessDeniedError
from app.modules.reports.models import ReportStatus
from app.modules.reports.services import ReportService

class ReportDownloadService:
    """Service handling download verification and file access control."""

    def __init__(self, report_service: Optional[ReportService] = None):
        self.report_service = report_service or ReportService()

    def get_download_metadata(self, report_id: str, tenant_id: str) -> Tuple[str, str, str]:
        """
        Enforces tenant validation, report completion, and file existence.
        Increments download count upon verification success.
        Returns:
            Tuple[file_path, mime_type, original_filename]
        """
        report = self.report_service.get_report(report_id, tenant_id)
        if not report:
            raise ValueError("Report not found.")

        if report.status != ReportStatus.COMPLETED:
            raise ValueError("Report is not completed.")

        file_path = report.file_path
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError("Report file does not exist on disk.")

        # Increment download counter
        self.report_service.increment_download_count(report_id)

        return (
            file_path,
            report.mime_type or "application/octet-stream",
            report.file_name or f"report_{report_id}.dat"
        )
