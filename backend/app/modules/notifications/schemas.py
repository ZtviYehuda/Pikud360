from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    tenant_id: str
    organization_unit_id: Optional[str] = None
    user_id: Optional[str] = None
    notification_type: str
    severity: str
    message: str
    status: str
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True
