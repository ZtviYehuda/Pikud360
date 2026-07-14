"""
Reports module domain models.
Plain @dataclass objects — no ORM dependency.
"""
from enum import Enum
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime


# ── Enums ──────────────────────────────────────────────────────────────────────

class ReportStatus(str, Enum):
    """Lifecycle states of a report generation request."""
    PENDING    = "PENDING"
    GENERATING = "GENERATING"
    COMPLETED  = "COMPLETED"
    FAILED     = "FAILED"


class ReportFormat(str, Enum):
    """Supported output formats for report generation."""
    PDF   = "PDF"
    EXCEL = "EXCEL"
    CSV   = "CSV"


class ReportType(str, Enum):
    """Codes matching seeded workforce.report_templates rows."""
    MANPOWER_SUMMARY       = "manpower_summary"
    ALERT_LOG              = "alert_log"
    SCHEDULE_DETAILS       = "schedule_details"
    ORGANIZATION_SUMMARY   = "organization_summary"
    ATTENDANCE_STATISTICS  = "attendance_statistics"
    PERSONNEL_DISTRIBUTION = "personnel_distribution"


# ── Domain models ──────────────────────────────────────────────────────────────

@dataclass
class ReportTemplate:
    """Represents an available report template definition."""
    id: str
    code: ReportType
    name: str
    supported_formats: List[ReportFormat]
    description: Optional[str] = None
    enabled: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class ReportRequest:
    """
    Represents a report generation request and its result metadata.
    Maps to workforce.generated_reports — a unified request + result record.
    """
    id: str
    tenant_id: str
    name: str
    report_type: ReportType                 # stores ReportType.value (str) from DB
    format: ReportFormat
    generated_by: str
    status: ReportStatus = ReportStatus.PENDING
    org_unit_id: Optional[str] = None
    parameters_json: Optional[dict] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    download_count: int = 0
    error_message: Optional[str] = None
    # Result metadata columns (populated on completion)
    generated_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
