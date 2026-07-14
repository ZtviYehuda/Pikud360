"""
Analytics module Pydantic schemas for request validation and response serialization.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from pydantic import BaseModel, Field


# ─── Status Distribution ──────────────────────────────────────────────────────

class StatusDistributionItem(BaseModel):
    status: str
    count: int
    percentage: float


# ─── Summary ─────────────────────────────────────────────────────────────────

class ChildUnitSummary(BaseModel):
    unit_id: str
    unit_name: str
    total_personnel: int
    assigned: float
    unassigned: float
    status_distribution: List[StatusDistributionItem]


class SummaryResponse(BaseModel):
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
    status_distribution: List[StatusDistributionItem]
    alerts_count: int


# ─── Trends ──────────────────────────────────────────────────────────────────

class TrendDataPoint(BaseModel):
    date: date
    total_personnel: int
    assigned: int
    unassigned: int
    available: int
    unavailable: int
    readiness_percentage: float
    status_distribution: Dict[str, int]


class TrendsResponse(BaseModel):
    period: str
    unit_id: str
    start_date: date
    end_date: date
    data: List[TrendDataPoint]


# ─── Alerts ──────────────────────────────────────────────────────────────────

class AlertEvaluationResult(BaseModel):
    rule_name: str
    metric: str
    current_value: float
    threshold: float
    operator: str
    severity: str
    organization_unit: str
    is_triggered: bool


# ─── Snapshots ────────────────────────────────────────────────────────────────

class SnapshotGenerateRequest(BaseModel):
    unit_id: str
    snapshot_date: date = Field(default_factory=date.today)
    snapshot_hour: int = Field(default=12, ge=0, le=23)


class SnapshotGenerateResponse(BaseModel):
    success: bool
    generated_at: datetime
    duration_ms: int
    records_processed: int
    unit_id: str
    snapshot_date: date
