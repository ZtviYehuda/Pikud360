from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime, date, time

class WorkforceSettingsUpdateRequest(BaseModel):
    enable_shift_division: Optional[bool] = None
    shift_model: Optional[str] = None

class WorkforceSettingsResponse(BaseModel):
    id: str
    org_unit_id: str
    enable_shift_division: bool
    shift_model: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DailyPlanCreateRequest(BaseModel):
    org_unit_id: str = Field(..., description="Organization Unit UUID")
    plan_date: str = Field(..., description="Plan date in YYYY-MM-DD format")
    notes: Optional[str] = None

    @field_validator("plan_date")
    @classmethod
    def validate_plan_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Plan date must be in YYYY-MM-DD format")
        return v

class DailyPlanResponse(BaseModel):
    id: str
    org_unit_id: str
    plan_date: date
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AssignmentCreateRequest(BaseModel):
    employee_id: str = Field(..., description="Employee UUID")
    main_status_id: str = Field(..., description="Main status UUID")
    office_sub_status_id: Optional[str] = None
    shift_definition_id: Optional[str] = None
    notes: Optional[str] = None

class AssignmentUpdateRequest(BaseModel):
    main_status_id: Optional[str] = None
    office_sub_status_id: Optional[str] = None
    shift_definition_id: Optional[str] = None
    notes: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: str
    plan_id: str
    employee_id: str
    main_status_id: str
    office_sub_status_id: Optional[str] = None
    shift_definition_id: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DailyWorkforceSummaryResponse(BaseModel):
    date: date
    total: int
    statuses: Dict[str, int]
    shifts: Optional[Dict[str, int]] = None
