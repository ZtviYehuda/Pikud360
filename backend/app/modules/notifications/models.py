from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Notification:
    id: str
    tenant_id: str
    organization_unit_id: Optional[str]
    user_id: Optional[str]
    notification_type: str
    severity: str
    message: str
    status: str  # UNREAD, READ
    created_at: datetime
    read_at: Optional[datetime] = None
