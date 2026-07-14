"""
Reports module Pydantic v2 schemas — request/response DTOs.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.modules.reports.models import ReportFormat, ReportStatus, ReportType


class ReportTemplateResponse(BaseModel):
    """Schema representing an available report template."""
    id: str
    code: ReportType
    name: str
    description: Optional[str] = None
    supported_formats: List[ReportFormat]   # serialised as plain strings for API consumers
    enabled: bool

    model_config = {"use_enum_values": True}


class ReportRequestCreate(BaseModel):
    """Incoming DTO for requesting report generation."""
    report_type: ReportType
    format: ReportFormat
    org_unit_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

    @field_validator("format", mode="before")
    @classmethod
    def normalise_format(cls, v: Any) -> ReportFormat:
        """Accept lowercase input/enum and map to the matching ReportFormat member."""
        if isinstance(v, ReportFormat):
            return v
        v_str = v.value if isinstance(v, ReportFormat) else str(v)
        upper = v_str.upper()
        try:
            return ReportFormat(upper)
        except ValueError:
            allowed = ", ".join(f.value for f in ReportFormat)
            raise ValueError(f"Unsupported format '{v}'. Must be one of: {allowed}")

    model_config = {"use_enum_values": True}


class ReportRequestResponse(BaseModel):
    """Response after creating or tracking a report request."""
    id: str
    name: str
    report_type: ReportType
    format: ReportFormat
    status: ReportStatus
    org_unit_id: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    download_count: int = 0
    error_message: Optional[str] = None
    generated_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"use_enum_values": True}


class ReportHistoryResponse(BaseModel):
    """Response for listing report request history."""
    total: int
    items: List[ReportRequestResponse]
