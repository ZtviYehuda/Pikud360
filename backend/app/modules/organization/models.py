from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class OrganizationUnit:
    id: str
    tenant_id: str
    type_id: str
    name: str
    code: str
    parent_id: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

@dataclass
class OrganizationUnitCommander:
    id: str
    org_unit_id: str
    commander_id: str
    assigned_at: Optional[datetime] = None
    is_active: bool = True
