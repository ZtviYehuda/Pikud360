from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime, date, time

class ScheduleSettingsUpdateRequest(BaseModel):
    scheduling_mode: str
    unassigned_threshold: Optional[float] = None
    sick_threshold: Optional[float] = None
    shortage_threshold: Optional[float] = None

class ScheduleSettingsResponse(BaseModel):
    id: str
    tenant_id: str
    organization_unit_id: str
    scheduling_mode: str
    unassigned_threshold: float = 10.0
    sick_threshold: float = 5.0
    shortage_threshold: float = 70.0
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShiftTypeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            try:
                datetime.strptime(v, "%H:%M:%S")
            except ValueError:
                raise ValueError("Time must be in HH:MM or HH:MM:SS format")
        return v

class ShiftTypeResponse(BaseModel):
    id: str
    tenant_id: str
    organization_unit_id: str
    name: str
    start_time: str
    end_time: str
    active: bool
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def convert_time_to_str(cls, v) -> str:
        if isinstance(v, time):
            return v.strftime("%H:%M:%S")
        return str(v)

class ScheduleStatusCreateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = None
    sort_order: Optional[int] = 0

class ScheduleStatusUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class ScheduleStatusResponse(BaseModel):
    id: str
    tenant_id: str
    code: str
    name: str
    category: str
    color: Optional[str] = None
    is_active: bool
    sort_order: int
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ScheduleCreateRequest(BaseModel):
    employee_id: str = Field(..., description="Employee UUID")
    organization_unit_id: str = Field(..., description="Organization Unit UUID")
    schedule_date: str = Field(..., description="Schedule date in YYYY-MM-DD format")
    status_id: str = Field(..., description="Schedule status UUID")
    shift_type_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("schedule_date")
    @classmethod
    def validate_schedule_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Schedule date must be in YYYY-MM-DD format")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_opt_time(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            try:
                datetime.strptime(v, "%H:%M:%S")
            except ValueError:
                raise ValueError("Time must be in HH:MM or HH:MM:SS format")
        return v

class ScheduleUpdateRequest(BaseModel):
    status_id: Optional[str] = None
    shift_type_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_opt_time(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            try:
                datetime.strptime(v, "%H:%M:%S")
            except ValueError:
                raise ValueError("Time must be in HH:MM or HH:MM:SS format")
        return v


class ScheduleResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    organization_unit_id: str
    schedule_date: date
    status_id: str
    shift_type_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None
    created_by_commander_id: Optional[str] = None
    updated_by_commander_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def convert_time_to_str(cls, v) -> Optional[str]:
        if not v:
            return None
        if isinstance(v, time):
            return v.strftime("%H:%M:%S")
        return str(v)


class BulkScheduleRequest(BaseModel):
    organization_unit_id: str = Field(..., description="Organization Unit UUID")
    date: str = Field(..., description="Schedule date in YYYY-MM-DD format")
    status_id: str = Field(..., description="Schedule status UUID")
    employee_ids: List[str] = Field(..., description="List of Employee UUIDs")

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v

class DailyDashboardAggregationResponse(BaseModel):
    date: date
    total_employees: int
    statuses: Dict[str, int]
    shifts: Optional[Dict[str, int]] = None
    unassigned_count: int
