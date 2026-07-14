from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class EmployeeTransfer:
    id: str
    tenant_id: str
    employee_id: str
    from_unit_id: str
    to_unit_id: str
    requested_by: str
    approved_by: Optional[str]
    reason: Optional[str]
    status: str
    requested_at: datetime
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
