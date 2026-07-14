"""
Analytics module Pydantic schemas for request validation and response serialization.
Supports clear separation between Request and Response DTOs.
"""
from typing import Optional, Dict, List
from datetime import datetime, date
from pydantic import BaseModel, Field


# ============================================================================
# REQUEST DTOs
# ============================================================================

class AnalyticsFilterRequest(BaseModel):
    """Common request query parameters filter validation DTO."""
    unit_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    period: Optional[str] = None  # daily, weekly, monthly


class SnapshotGenerateRequest(BaseModel):
    """Request payload parameters for triggering point-in-time snapshot builds."""
    unit_id: str
    snapshot_date: date = Field(default_factory=date.today)
    snapshot_hour: int = Field(default=12, ge=0, le=23)


# ============================================================================
# RESPONSE DTOs
# ============================================================================

class DistributionItem(BaseModel):
    """Represents a single category count and percentage."""
    status: str
    count: int
    percentage: float


class DistributionResponse(BaseModel):
    """Response containing status categories distribution list."""
    distribution: List[DistributionItem]


class ChildUnitSummary(BaseModel):
    """Manpower stats summary for a child unit."""
    unit_id: str
    unit_name: str
    total_personnel: int
    assigned: float
    unassigned: float
    status_distribution: List[DistributionItem]


class SummaryResponse(BaseModel):
    """Response containing detailed operational dashboard summary KPIs."""
    total_personnel: int
    assigned: float
    unassigned: float
    available: float
    unavailable: float
    assigned_percentage: float
    availability_percentage: float
    absence_percentage: float
    unassigned_percentage: float
    active_shift_count: int
    organization_units: List[ChildUnitSummary]
    child_units: List[ChildUnitSummary]
    status_distribution: List[DistributionItem]
    alerts_count: int


class TrendDataPoint(BaseModel):
    """Historical timeline statistical record."""
    date: date
    total_personnel: int
    assigned: int
    unassigned: int
    available: int
    unavailable: int
    readiness_percentage: float
    status_distribution: Dict[str, int]


class TrendResponse(BaseModel):
    """Response containing historical trend timeline statistics."""
    period: str
    unit_id: str
    start_date: date
    end_date: date
    data: List[TrendDataPoint]


class AlertResponse(BaseModel):
    """Response representing detailed evaluated alert status objects."""
    rule_name: str
    metric: str
    current_value: float
    threshold: float
    operator: str
    severity: str
    organization_unit: str
    is_triggered: bool


class SnapshotGenerateResponse(BaseModel):
    """Response containing telemetry summary metrics for a generated snapshot job."""
    success: bool
    generated_at: datetime
    duration_ms: int
    records_processed: int
    unit_id: str
    snapshot_date: date


# ============================================================================
# SCHEDULER DTOs
# ============================================================================

class JobStatusResponseItem(BaseModel):
    """Telemetry metadata for background scheduler monitoring dashboard."""
    job_name: str
    enabled: bool
    running: bool
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    average_duration_ms: int
    last_duration_ms: int
    records_processed: int
    error_count: int


class JobRunResponse(BaseModel):
    """Response containing telemetry summary metrics for a manually executed job."""
    job_name: str
    success: bool
    duration_ms: int
    records_processed: int
    error_message: Optional[str] = None
