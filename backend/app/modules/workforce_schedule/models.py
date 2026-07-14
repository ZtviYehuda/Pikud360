from dataclasses import dataclass
from datetime import datetime, date, time
from typing import Optional

@dataclass
class ScheduleSettings:
    id: str
    tenant_id: str
    organization_unit_id: str
    scheduling_mode: str = "DIRECT_STATUS"  # DIRECT_STATUS, SHIFT_BASED
    unassigned_threshold: float = 10.0
    sick_threshold: float = 5.0
    shortage_threshold: float = 70.0
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class ShiftType:
    id: str
    tenant_id: str
    organization_unit_id: str
    name: str
    start_time: time
    end_time: time
    active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

@dataclass
class ScheduleStatus:
    id: str
    tenant_id: str
    code: str
    name: str
    category: str
    color: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class EmployeeDailySchedule:
    id: str
    tenant_id: str
    employee_id: str
    organization_unit_id: str
    schedule_date: date
    status_id: str
    shift_type_id: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    created_by_commander_id: Optional[str] = None
    updated_by_commander_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

