"""
Analytics module domain models for dashboard snapshots, alert rules, and generated reports.
These are plain dataclasses for inter-layer data transfer without ORM dependency.
"""
from dataclasses import dataclass
from typing import Optional
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
