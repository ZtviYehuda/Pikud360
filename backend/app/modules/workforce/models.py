from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional

@dataclass
class Employee:
    id: str
    tenant_id: str
    org_unit_id: str
    employee_number: str
    first_name: str
    last_name: str
    birthdate: str  # Decrypted string value (e.g. YYYY-MM-DD)
    rank: str
    position: str
    service_type: str
    user_id: Optional[str] = None
    commander_id: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[str] = None
    status: str = "ACTIVE"
    phone_blind_index: Optional[str] = None
    email_blind_index: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

@dataclass
class EmployeeHistory:
    id: str
    employee_id: str
    change_type: str  # e.g. EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_TRANSFERRED, EMPLOYEE_DELETED
    snapshot_json: dict = field(default_factory=dict)
    org_unit_id: Optional[str] = None
    commander_id: Optional[str] = None
    rank: Optional[str] = None
    position: Optional[str] = None
    service_type: Optional[str] = None
    status: Optional[str] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    change_reason: Optional[str] = None
    recorded_by: Optional[str] = None
    created_at: Optional[datetime] = None
