from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
import re
from datetime import datetime

class EmployeeCreateRequest(BaseModel):
    org_unit_id: str = Field(..., description="Target organizational unit UUID string")
    employee_number: str = Field(..., min_length=2, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birthdate: str = Field(..., description="Birth date in YYYY-MM-DD format")
    rank: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=150)
    service_type: str = Field(..., min_length=1, max_length=100)
    user_id: Optional[str] = None
    commander_id: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    status: str = "ACTIVE"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        # Allows digits, optional leading plus, and dashes
        pattern = r"^\+?[0-9\-\s]{7,20}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must contain between 7 and 20 digits, optionally starting with a +")
        return v

    @field_validator("personal_email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        pattern = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Birth date must be in YYYY-MM-DD format")
        return v


class EmployeeUpdateRequest(BaseModel):
    org_unit_id: Optional[str] = None
    employee_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birthdate: Optional[str] = None
    rank: Optional[str] = None
    position: Optional[str] = None
    service_type: Optional[str] = None
    user_id: Optional[str] = None
    commander_id: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    status: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        pattern = r"^\+?[0-9\-\s]{7,20}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must contain between 7 and 20 digits, optionally starting with a +")
        return v

    @field_validator("personal_email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        pattern = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Birth date must be in YYYY-MM-DD format")
        return v


class EmployeeResponse(BaseModel):
    id: str
    org_unit_id: str
    employee_number: str
    first_name: str
    last_name: str
    birthdate: str
    rank: str
    position: str
    service_type: str
    user_id: Optional[str] = None
    commander_id: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
