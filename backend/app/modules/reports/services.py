"""
Reports module — service layer.
Contains:
  - ReportProcessor: abstract interface (pipeline for Phase 7.3B concrete generators)
  - ReportService: orchestration of validation + enqueue
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.authorization.exceptions import AccessDeniedError
from app.modules.reports.models import (
    ReportRequest, ReportTemplate, ReportFormat, ReportStatus, ReportType
)
from app.modules.reports.repositories import TemplateRepository, ReportRepository

logger = logging.getLogger("pikud360.modules.reports.services")


class ReportProcessor(ABC):
    """
    Abstract interface for concrete report generators (PDF, Excel, CSV).
    Phase 7.3B will implement concrete subclasses.
    The SchedulerEngine invokes process() on the appropriate processor.
    """

    @abstractmethod
    def supports(self, format: ReportFormat) -> bool:
        """Return True if this processor handles the given output format."""

    @abstractmethod
    def process(self, report: ReportRequest) -> Dict[str, Any]:
        """
        Execute report generation for the given request.
        Must return a dict with keys:
          - file_name (str)
          - file_size (int)
          - duration_ms (int)
          - mime_type (str)
          - checksum (str, optional)
          - file_path (str, optional)
        """


class NoOpReportProcessor(ReportProcessor):
    """
    Placeholder processor used in Phase 7.3A.
    Records requests without actual file generation.
    Phase 7.3B will replace this with format-specific processors.
    """

    def supports(self, format: ReportFormat) -> bool:
        return True  # Accepts all formats as a fallback

    def process(self, report: ReportRequest) -> Dict[str, Any]:
        raise NotImplementedError(
            f"No concrete processor registered for format '{report.format}'. "
            "Register a PDF, Excel or CSV processor in Phase 7.3B."
        )


class ReportService:
    """Orchestrates report request lifecycle: validation, creation, and enqueue."""

    def __init__(self):
        self._template_repo = TemplateRepository()
        self._report_repo = ReportRepository()

    def get_enabled_templates(self):
        """Return all enabled report templates."""
        return self._template_repo.list_enabled_templates()

    def get_report(self, report_id: str, tenant_id: str) -> Optional[ReportRequest]:
        """Fetch a single report record, enforcing tenant scope."""
        report = self._report_repo.load_report(report_id)
        if not report:
            return None
        if report.tenant_id != tenant_id:
            raise AccessDeniedError("Access denied: report belongs to a different tenant.")
        return report

    def get_history(
        self,
        tenant_id: str,
        org_unit_id: Optional[str] = None,
        limit: int = 50
    ):
        """Return tenant-scoped report history."""
        return self._report_repo.load_reports_history(tenant_id, org_unit_id, limit)

    def request_report(
        self,
        tenant_id: str,
        user_id: str,
        report_type: str,
        format: str,
        org_unit_id: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> ReportRequest:
        """
        Validate the report request and create a PENDING record.
        Actual generation is deferred to the SchedulerEngine via the reports job.
        """
        # 1. Validate and coerce format to enum
        try:
            fmt = ReportFormat(format.upper())
        except ValueError:
            allowed = ", ".join(f.value for f in ReportFormat)
            raise ValueError(f"Unsupported format '{format}'. Must be one of: {allowed}")

        # 2. Validate template exists and is enabled
        template = self._template_repo.load_template_by_code(report_type)
        if not template:
            raise ValueError(f"Unknown report type '{report_type}'.")
        if not template.enabled:
            raise ValueError(f"Report type '{report_type}' is currently disabled.")

        # 3. Validate format is supported by this template
        if fmt not in template.supported_formats:
            allowed_fmts = ", ".join(
                f.value if isinstance(f, ReportFormat) else f
                for f in template.supported_formats
            )
            raise ValueError(
                f"Format '{fmt.value}' is not supported for '{report_type}'. "
                f"Supported: {allowed_fmts}"
            )

        # 4. Create PENDING request record
        report_name = f"{template.name} — {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        report_id = self._report_repo.create_report_request(
            tenant_id=tenant_id,
            name=report_name,
            report_type=report_type,
            format=fmt.value,
            generated_by=user_id,
            org_unit_id=org_unit_id,
            parameters=parameters
        )

        logger.info(
            f"Report request '{report_id}' created ({report_type}/{fmt.value}). "
            "Pending SchedulerEngine execution."
        )
        return self._report_repo.load_report(report_id)

    def delete_report(self, report_id: str, tenant_id: str) -> bool:
        """Delete a report, enforcing tenant scope."""
        report = self._report_repo.load_report(report_id)
        if not report:
            return False
        if report.tenant_id != tenant_id:
            raise AccessDeniedError("Access denied: report belongs to a different tenant.")
        return self._report_repo.delete_report_request(report_id)

    def process_pending_reports(self, processor: ReportProcessor) -> int:
        """
        Invoked by the SchedulerEngine reports job.
        Iterates PENDING requests, transitions them via processor,
        and records results or failures.
        """
        pending = self._report_repo.load_pending_reports()
        processed = 0
        for report in pending:
            self._report_repo.update_status(report.id, ReportStatus.GENERATING)
            try:
                result = processor.process(report)
                self._report_repo.save_report_result(
                    report_id=report.id,
                    file_name=result["file_name"],
                    file_size=result["file_size"],
                    duration_ms=result["duration_ms"],
                    mime_type=result["mime_type"],
                    checksum=result.get("checksum"),
                    file_path=result.get("file_path")
                )
                processed += 1
            except NotImplementedError as e:
                # Processor not yet implemented — revert to PENDING for Phase 7.3B
                logger.info(f"Report '{report.id}' deferred: {e}")
                self._report_repo.update_status(report.id, ReportStatus.PENDING)
            except Exception as e:
                logger.error(f"Report '{report.id}' failed: {e}", exc_info=True)
                self._report_repo.update_status(report.id, ReportStatus.FAILED, str(e))
        return processed
