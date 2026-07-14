"""
Analytics module domain models for dashboard snapshots, alert rules, reports, and calculations.
These are plain dataclasses for inter-layer data transfer without ORM dependency.
"""
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict
from datetime import datetime, date


@dataclass
class DashboardSnapshot:
    """Represents a pre-aggregated daily snapshot of organization unit status counts."""
    id: str
    tenant_id: str
    org_unit_id: str
    snapshot_date: date
    snapshot_hour: int
    total_employees: int = 0
    assigned_employees: int = 0
    unassigned_employees: int = 0
    available_count: int = 0
    sick_count: int = 0
    vacation_count: int = 0
    training_count: int = 0
    mission_count: int = 0
    reinforcement_count: int = 0
    other_count: int = 0
    readiness_percentage: float = 100.00
    status_distribution: dict = None
    updated_at: Optional[datetime] = None


@dataclass
class AlertRule:
    """Represents a rule used to evaluate automated operational alerts."""
    id: str
    tenant_id: str
    name: str
    metric_name: str
    operator: str
    threshold_value: float
    evaluation_period: str
    severity: str = "WARNING"
    is_active: bool = True
    org_unit_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class GeneratedReport:
    """Represents metadata for a generated CSV, PDF, or JSON report job."""
    id: str
    tenant_id: str
    name: str
    report_type: str
    format: str
    generated_by: str
    parameters_json: dict = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    download_count: int = 0
    status: str = "PENDING"
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


@dataclass
class AlertEvaluationResult:
    """Represents the results of evaluating an alert rule condition."""
    rule_name: str
    metric: str
    current_value: float
    threshold: float
    operator: str
    severity: str
    organization_unit: str
    is_triggered: bool


@dataclass
class PersonnelSummary:
    """Represents aggregated manpower statistics for an organization unit."""
    total_personnel: int
    assigned: float
    unassigned: float
    available: float
    unavailable: float


@dataclass
class StatusDistributionItem:
    """Represents a single status category count and percentage."""
    status: str
    count: int
    percentage: float


@dataclass
class TrendPoint:
    """Represents a single point-in-time trend statistics record."""
    date: date
    total_personnel: int
    assigned: int
    unassigned: int
    available: int
    unavailable: int
    readiness_percentage: float
    status_distribution: Dict[str, int]


class TrendPeriod(str, Enum):
    """Strongly typed periods for timeline trends mapping."""
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
