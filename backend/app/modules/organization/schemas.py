from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OrganizationUnitCreateRequest(BaseModel):
    type_id: str = Field(..., description="Organization Unit Type UUID")
    name: str = Field(..., min_length=1, max_length=150)
    code: str = Field(..., min_length=1, max_length=50)
    parent_id: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = 0

class OrganizationUnitUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class OrganizationMoveRequest(BaseModel):
    parent_id: Optional[str] = None

class CommanderAssignRequest(BaseModel):
    commander_id: str = Field(..., description="Employee UUID of the commander being assigned")

class OrganizationUnitResponse(BaseModel):
    id: str
    tenant_id: str
    type_id: str
    name: str
    code: str
    parent_id: Optional[str] = None
    description: Optional[str] = None
    sort_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
