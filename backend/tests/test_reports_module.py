"""
Phase 7.3A Unit Tests — Reports Engine Foundation
Tests for: models, schemas, services (ReportProcessor, ReportService),
and SchedulerEngine 'reports' job registration.
Refactored to use ReportStatus, ReportFormat, ReportType enums.
"""
import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch, call

from app.modules.reports.models import (
    ReportTemplate, ReportRequest,
    ReportStatus, ReportFormat, ReportType
)
from app.modules.reports.schemas import ReportRequestCreate, ReportTemplateResponse, ReportRequestResponse
from app.modules.reports.services import ReportProcessor, NoOpReportProcessor, ReportService


# ── Model Instantiation ────────────────────────────────────────────────────────

class TestReportModels:
    def test_report_template_defaults(self):
        t = ReportTemplate(
            id="1",
            code=ReportType.MANPOWER_SUMMARY,
            name="Manpower Summary",
            supported_formats=[ReportFormat.PDF, ReportFormat.EXCEL]
        )
        assert t.enabled is True
        assert t.description is None

    def test_report_request_defaults(self):
        r = ReportRequest(
            id="r1", tenant_id="t1", name="Test",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF,
            generated_by="user1"
        )
        assert r.status == ReportStatus.PENDING
        assert r.download_count == 0
        assert r.file_name is None
        assert r.file_size is None
        assert r.mime_type is None
        assert r.checksum is None

    def test_enum_values_are_strings(self):
        """Enums inherit from str — their values are plain strings for DB / API."""
        assert ReportStatus.PENDING.value == "PENDING"
        assert ReportFormat.PDF.value == "PDF"
        assert ReportType.MANPOWER_SUMMARY.value == "manpower_summary"

    def test_report_status_members(self):
        assert set(s.value for s in ReportStatus) == {"PENDING", "GENERATING", "COMPLETED", "FAILED"}

    def test_report_format_members(self):
        assert set(f.value for f in ReportFormat) == {"PDF", "EXCEL", "CSV"}

    def test_report_type_members(self):
        codes = {t.value for t in ReportType}
        assert "manpower_summary" in codes
        assert "alert_log" in codes
        assert "schedule_details" in codes
        assert "organization_summary" in codes
        assert "attendance_statistics" in codes
        assert "personnel_distribution" in codes


# ── Schema Validation ──────────────────────────────────────────────────────────

class TestReportSchemas:
    def test_report_request_create_valid_lowercase(self):
        schema = ReportRequestCreate(
            report_type=ReportType.MANPOWER_SUMMARY, format="pdf"
        )
        # use_enum_values=True — serialised as plain string
        assert schema.format == ReportFormat.PDF.value

    def test_report_request_create_valid_enum(self):
        schema = ReportRequestCreate(
            report_type=ReportType.ALERT_LOG, format=ReportFormat.EXCEL
        )
        assert schema.format == ReportFormat.EXCEL.value

    def test_report_request_create_invalid_format(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            ReportRequestCreate(report_type="any", format="WORD")

    def test_report_template_response_serialization(self):
        schema = ReportTemplateResponse(
            id="1",
            code=ReportType.ALERT_LOG,
            name="Alert Log",
            supported_formats=[ReportFormat.PDF, ReportFormat.CSV],
            enabled=True
        )
        data = schema.model_dump()
        assert data["code"] == "alert_log"
        assert data["enabled"] is True

    def test_report_request_response_optional_fields(self):
        schema = ReportRequestResponse(
            id="r1", name="Test",
            report_type=ReportType.ALERT_LOG,
            format=ReportFormat.CSV,
            status=ReportStatus.PENDING
        )
        data = schema.model_dump()
        assert data["file_name"] is None
        assert data["duration_ms"] is None
        assert data["checksum"] is None

    def test_report_request_response_status_is_string(self):
        """Ensure serialised status is a plain string, not an enum object."""
        schema = ReportRequestResponse(
            id="r1", name="Test",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF,
            status=ReportStatus.COMPLETED
        )
        data = schema.model_dump()
        assert isinstance(data["status"], str)
        assert data["status"] == "COMPLETED"


# ── ReportProcessor Interface ──────────────────────────────────────────────────

class TestReportProcessor:
    def test_no_op_processor_supports_all_formats(self):
        processor = NoOpReportProcessor()
        for fmt in ReportFormat:
            assert processor.supports(fmt) is True

    def test_no_op_processor_raises_not_implemented(self):
        processor = NoOpReportProcessor()
        dummy = ReportRequest(
            id="x", tenant_id="t", name="n",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF,
            generated_by="u"
        )
        with pytest.raises(NotImplementedError):
            processor.process(dummy)

    def test_concrete_processor_can_override(self):
        class CSVProcessor(ReportProcessor):
            def supports(self, format: ReportFormat) -> bool:
                return format == ReportFormat.CSV

            def process(self, report: ReportRequest):
                return {
                    "file_name": "out.csv", "file_size": 100,
                    "duration_ms": 50, "mime_type": "text/csv"
                }

        p = CSVProcessor()
        assert p.supports(ReportFormat.CSV) is True
        assert p.supports(ReportFormat.PDF) is False
        dummy = ReportRequest(
            id="x", tenant_id="t", name="n",
            report_type=ReportType.ALERT_LOG,
            format=ReportFormat.CSV,
            generated_by="u"
        )
        result = p.process(dummy)
        assert result["file_name"] == "out.csv"


# ── ReportService Logic ────────────────────────────────────────────────────────

@pytest.fixture
def mock_template_repo():
    with patch("app.modules.reports.services.TemplateRepository") as MockClass:
        instance = MockClass.return_value
        instance.list_enabled_templates.return_value = [
            ReportTemplate(
                id="t1",
                code=ReportType.MANPOWER_SUMMARY,
                name="Manpower Summary",
                supported_formats=[ReportFormat.PDF, ReportFormat.EXCEL, ReportFormat.CSV]
            )
        ]
        instance.load_template_by_code.return_value = ReportTemplate(
            id="t1",
            code=ReportType.MANPOWER_SUMMARY,
            name="Manpower Summary",
            supported_formats=[ReportFormat.PDF, ReportFormat.EXCEL, ReportFormat.CSV]
        )
        yield instance


@pytest.fixture
def mock_report_repo():
    with patch("app.modules.reports.services.ReportRepository") as MockClass:
        instance = MockClass.return_value
        instance.create_report_request.return_value = "report-uuid-1"
        instance.load_report.return_value = ReportRequest(
            id="report-uuid-1", tenant_id="tenant-111",
            name="Manpower Summary — 2025-01-01 10:00",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF,
            generated_by="user-1"
        )
        instance.load_reports_history.return_value = []
        instance.load_pending_reports.return_value = []
        yield instance


class TestReportService:
    def test_get_enabled_templates(self, mock_template_repo, mock_report_repo):
        service = ReportService()
        templates = service.get_enabled_templates()
        assert len(templates) == 1
        assert templates[0].code == ReportType.MANPOWER_SUMMARY

    def test_request_report_valid(self, mock_template_repo, mock_report_repo):
        service = ReportService()
        report = service.request_report(
            tenant_id="tenant-111", user_id="user-1",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF
        )
        assert report.id == "report-uuid-1"
        assert report.status == ReportStatus.PENDING
        mock_report_repo.create_report_request.assert_called_once()

    def test_request_report_invalid_format(self, mock_template_repo, mock_report_repo):
        service = ReportService()
        with pytest.raises(ValueError, match="Unsupported format"):
            service.request_report(
                tenant_id="t", user_id="u",
                report_type=ReportType.MANPOWER_SUMMARY,
                format="WORD"
            )

    def test_request_report_unknown_type(self, mock_template_repo, mock_report_repo):
        mock_template_repo.load_template_by_code.return_value = None
        service = ReportService()
        with pytest.raises(ValueError, match="Unknown report type"):
            service.request_report(
                tenant_id="t", user_id="u", report_type="nonexistent",
                format=ReportFormat.PDF
            )

    def test_request_report_disabled_template(self, mock_template_repo, mock_report_repo):
        mock_template_repo.load_template_by_code.return_value = ReportTemplate(
            id="t2",
            code=ReportType.ALERT_LOG,
            name="Alert Log",
            supported_formats=[ReportFormat.PDF],
            enabled=False
        )
        service = ReportService()
        with pytest.raises(ValueError, match="currently disabled"):
            service.request_report(
                tenant_id="t", user_id="u",
                report_type=ReportType.ALERT_LOG,
                format=ReportFormat.PDF
            )

    def test_request_report_unsupported_format_for_template(self, mock_template_repo, mock_report_repo):
        mock_template_repo.load_template_by_code.return_value = ReportTemplate(
            id="t3",
            code=ReportType.SCHEDULE_DETAILS,
            name="Schedule Details",
            supported_formats=[ReportFormat.CSV]   # Only CSV supported
        )
        service = ReportService()
        with pytest.raises(ValueError, match="not supported"):
            service.request_report(
                tenant_id="t", user_id="u",
                report_type=ReportType.SCHEDULE_DETAILS,
                format=ReportFormat.PDF
            )

    def test_get_report_enforces_tenant_scope(self, mock_template_repo, mock_report_repo):
        from app.core.authorization.exceptions import AccessDeniedError
        service = ReportService()
        with pytest.raises(AccessDeniedError):
            service.get_report("report-uuid-1", tenant_id="tenant-999")

    def test_get_report_not_found(self, mock_template_repo, mock_report_repo):
        mock_report_repo.load_report.return_value = None
        service = ReportService()
        result = service.get_report("missing-id", "tenant-111")
        assert result is None

    def test_get_history(self, mock_template_repo, mock_report_repo):
        service = ReportService()
        history = service.get_history("tenant-111", limit=10)
        assert history == []
        mock_report_repo.load_reports_history.assert_called_once_with("tenant-111", None, 10)

    def test_process_pending_no_reports(self, mock_template_repo, mock_report_repo):
        service = ReportService()
        processor = NoOpReportProcessor()
        count = service.process_pending_reports(processor)
        assert count == 0

    def test_process_pending_leaves_noop_as_pending(self, mock_template_repo, mock_report_repo):
        """NoOpReportProcessor raises NotImplementedError → request reverts to PENDING."""
        pending_report = ReportRequest(
            id="r1", tenant_id="t", name="Test",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF, generated_by="u"
        )
        mock_report_repo.load_pending_reports.return_value = [pending_report]
        service = ReportService()
        processor = NoOpReportProcessor()
        count = service.process_pending_reports(processor)
        assert count == 0
        update_calls = mock_report_repo.update_status.call_args_list
        # First call: GENERATING, second call: back to PENDING
        assert update_calls[0] == call("r1", ReportStatus.GENERATING)
        assert update_calls[1] == call("r1", ReportStatus.PENDING)

    def test_process_pending_marks_failed_on_exception(self, mock_template_repo, mock_report_repo):
        """A concrete processor that raises RuntimeError should mark the report as FAILED."""
        pending_report = ReportRequest(
            id="r2", tenant_id="t", name="Test",
            report_type=ReportType.MANPOWER_SUMMARY,
            format=ReportFormat.PDF, generated_by="u"
        )
        mock_report_repo.load_pending_reports.return_value = [pending_report]

        class BrokenProcessor(ReportProcessor):
            def supports(self, format: ReportFormat) -> bool: return True
            def process(self, report: ReportRequest): raise RuntimeError("Disk full")

        service = ReportService()
        count = service.process_pending_reports(BrokenProcessor())
        assert count == 0
        last_call = mock_report_repo.update_status.call_args_list[-1]
        assert last_call[0][1] == ReportStatus.FAILED
        assert "Disk full" in last_call[0][2]


# ── Scheduler Integration ──────────────────────────────────────────────────────

class TestSchedulerEngineReportsJob:
    def test_reports_job_registered(self):
        with patch("app.modules.analytics.scheduler.AnalyticsRepository"), \
             patch("app.modules.analytics.scheduler.SnapshotRepository"), \
             patch("app.modules.analytics.scheduler.AlertRepository"), \
             patch("app.modules.analytics.scheduler.JobRepository"):
            from app.modules.analytics.scheduler import SchedulerEngine
            engine = SchedulerEngine()
            assert "reports" in engine.registry
            job = engine.registry["reports"]
            assert job.supports_manual_run is True
            assert job.supports_schedule is True
            assert job.supports_retry is False

    def test_reports_job_definition_metadata(self):
        with patch("app.modules.analytics.scheduler.AnalyticsRepository"), \
             patch("app.modules.analytics.scheduler.SnapshotRepository"), \
             patch("app.modules.analytics.scheduler.AlertRepository"), \
             patch("app.modules.analytics.scheduler.JobRepository"):
            from app.modules.analytics.scheduler import SchedulerEngine
            engine = SchedulerEngine()
            job = engine.registry["reports"]
            assert "report" in job.description.lower()
