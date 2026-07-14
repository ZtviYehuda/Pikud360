from dataclasses import dataclass
from datetime import datetime, date, time
from typing import Optional

@dataclass
class OrganizationWorkforceSettings:
    id: str
    org_unit_id: str
    enable_shift_division: bool = False
    shift_model: str = "NONE" # NONE, FOUR_SHIFTS, CUSTOM
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class ShiftDefinition:
    id: str
    org_unit_id: str
    name: str
    start_time: time
    end_time: time
    display_order: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None

@dataclass
class DailyWorkforcePlan:
    id: str
    org_unit_id: str
    plan_date: date
    created_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

@dataclass
class EmployeeDailyAssignment:
    id: str
    plan_id: str
    employee_id: str
    main_status_id: str
    office_sub_status_id: Optional[str] = None
    shift_definition_id: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
