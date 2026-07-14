from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TransferCreateRequest(BaseModel):
    employee_id: str = Field(..., description="UUID of the employee to transfer")
    to_unit_id: str = Field(..., description="UUID of target organization unit")
    reason: Optional[str] = Field(None, description="Detailed explanation of the transfer")

class TransferResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    from_unit_id: str
    to_unit_id: str
    requested_by: str
    approved_by: Optional[str] = None
    reason: Optional[str] = None
    status: str
    requested_at: datetime
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
