from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, List, Any
import re
from datetime import datetime

def is_valid_israeli_phone(phone: str) -> bool:
    if not phone or not phone.strip():
        return True
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    if cleaned.startswith("+972"):
        cleaned = "0" + cleaned[4:]
    elif cleaned.startswith("972"):
        cleaned = "0" + cleaned[3:]
    return bool(re.match(r"^0(5\d{8}|[23489]\d{7}|7[2346789]\d{7})$", cleaned))


class EmployeeCreateRequest(BaseModel):
    org_unit_id: Optional[str] = Field(None, description="Target organizational unit UUID string")
    employee_number: Optional[str] = Field(None)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    birthdate: Optional[str] = Field(None, description="Birth date in YYYY-MM-DD format")
    rank: Optional[str] = Field("שוטר")
    position: Optional[str] = Field("שוטר")
    service_type: Optional[str] = Field("קבע")
    user_id: Optional[str] = None
    commander_id: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    status: str = "ACTIVE"

    @model_validator(mode="before")
    @classmethod
    def alias_and_fallback_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("employee_number"):
                data["employee_number"] = str(data.get("personal_id") or data.get("username") or f"emp_{int(datetime.now().timestamp())}")
            if not data.get("birthdate"):
                data["birthdate"] = str(data.get("birth_date") or "1990-01-01")
            if not data.get("phone"):
                data["phone"] = data.get("phone_number")
            if not data.get("personal_email"):
                data["personal_email"] = data.get("email")
            if not data.get("rank"):
                data["rank"] = str(data.get("rank_id") or "שוטר")
            if not data.get("position"):
                data["position"] = "שוטר"
            if not data.get("service_type"):
                data["service_type"] = str(data.get("service_type_id") or "קבע")
        return data

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return v
        if not is_valid_israeli_phone(v):
            raise ValueError("מספר הטלפון אינו תקין לפי תקן ישראלי (לדוגמה: 0501234567)")
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
    model_config = {"extra": "ignore"}

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
    city: Optional[str] = None
    emergency_contact: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    is_commander: Optional[bool] = None
    security_clearance: Optional[bool] = None
    police_license: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def alias_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Alias is_active → status
            if "is_active" in data and not data.get("status"):
                data["status"] = "ACTIVE" if data["is_active"] else "INACTIVE"
            # Alias frontend view field names → backend column names
            if "phone_number" in data and data.get("phone_number") is not None:
                data["phone"] = data["phone_number"]
            elif not data.get("phone") and data.get("phone_number"):
                data["phone"] = data["phone_number"]
            
            if "email" in data and data.get("email") is not None:
                data["personal_email"] = data["email"]
            elif not data.get("personal_email") and data.get("email"):
                data["personal_email"] = data["email"]
            
            if "birth_date" in data and data.get("birth_date") is not None:
                data["birthdate"] = str(data["birth_date"]).split("T")[0]
            elif not data.get("birthdate") and data.get("birth_date"):
                data["birthdate"] = str(data["birth_date"]).split("T")[0]
        return data

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return v
        if not is_valid_israeli_phone(v):
            raise ValueError("מספר הטלפון אינו תקין לפי תקן ישראלי (לדוגמה: 0501234567)")
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




class OrgUnitInfo(BaseModel):
    id: str
    name: str
    code: str

class CommandResponsibilities(BaseModel):
    scope_level: str
    subordinate_units_count: int
    employees_under_responsibility_count: int

class EmployeeOrganizationInfo(BaseModel):
    organization_path: List[str]
    current_unit: OrgUnitInfo
    direct_commander: Optional[str] = None
    position: str
    rank: str
    status: str
    availability: str
    command_responsibilities: Optional[CommandResponsibilities] = None

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
    phone_number: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None
    city: Optional[str] = None
    emergency_contact: Optional[str] = None
    status: str
    is_active: bool = True
    is_commander: bool = False
    security_clearance: bool = False
    police_license: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    organization_info: Optional[EmployeeOrganizationInfo] = None

    @model_validator(mode="before")
    @classmethod
    def set_is_active_and_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            status = data.get("status", "")
            if status:
                data["is_active"] = (status == "ACTIVE")
            data["phone_number"] = data.get("phone_number") or data.get("phone")
            data["email"] = data.get("email") or data.get("personal_email")
            data["birth_date"] = data.get("birth_date") or data.get("birthdate")
        elif hasattr(data, "status"):
            st = getattr(data, "status", "")
            if st:
                setattr(data, "is_active", st == "ACTIVE")
            p = getattr(data, "phone", None)
            e = getattr(data, "personal_email", None)
            b = getattr(data, "birthdate", None)
            setattr(data, "phone_number", getattr(data, "phone_number", None) or p)
            setattr(data, "email", getattr(data, "email", None) or e)
            setattr(data, "birth_date", getattr(data, "birth_date", None) or b)
        return data

    class Config:
        from_attributes = True
