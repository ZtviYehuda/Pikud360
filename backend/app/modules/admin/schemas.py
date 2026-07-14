"""
Admin module Pydantic schemas for request validation and response serialization.
"""
from typing import Optional, Any, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field


# ─── System Settings ────────────────────────────────────────────────────────

class SettingUpdateItem(BaseModel):
    key: str
    value: str

class SystemSettingsUpdateRequest(BaseModel):
    settings: List[SettingUpdateItem]

class SystemSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Business Rules ─────────────────────────────────────────────────────────

class BusinessRuleCreateRequest(BaseModel):
    rule_type: str
    name: str
    description: Optional[str] = None
    organization_unit_id: Optional[str] = None
    condition_json: Dict[str, Any] = Field(default_factory=dict)
    action_json: Dict[str, Any] = Field(default_factory=dict)
    priority: int = 100
    is_active: bool = True

class BusinessRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition_json: Optional[Dict[str, Any]] = None
    action_json: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class BusinessRuleResponse(BaseModel):
    id: str
    tenant_id: str
    rule_type: str
    name: str
    description: Optional[str] = None
    organization_unit_id: Optional[str] = None
    condition_json: dict
    action_json: dict
    priority: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Automation Rules ────────────────────────────────────────────────────────

class AutomationRuleCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_event: str
    condition_json: Dict[str, Any] = Field(default_factory=dict)
    action_type: str
    action_config: Dict[str, Any] = Field(default_factory=dict)
    schedule_cron: Optional[str] = None
    is_active: bool = True

class AutomationRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition_json: Optional[Dict[str, Any]] = None
    action_type: Optional[str] = None
    action_config: Optional[Dict[str, Any]] = None
    schedule_cron: Optional[str] = None
    is_active: Optional[bool] = None

class AutomationRuleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    trigger_event: str
    condition_json: dict
    action_type: str
    action_config: dict
    schedule_cron: Optional[str] = None
    is_active: bool
    last_triggered_at: Optional[datetime] = None
    trigger_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Notification Templates ──────────────────────────────────────────────────

class NotificationTemplateCreateRequest(BaseModel):
    name: str
    notification_type: str
    channel: str = "IN_APP"
    subject: Optional[str] = None
    body_template: str
    variables_json: List[str] = Field(default_factory=list)
    is_active: bool = True
    is_default: bool = False

class NotificationTemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_template: Optional[str] = None
    variables_json: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class NotificationTemplateResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    notification_type: str
    channel: str
    subject: Optional[str] = None
    body_template: str
    variables_json: list
    is_active: bool
    is_default: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Audit Log ───────────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: Optional[str] = None
    event_type: str
    action: str
    table_name: str
    record_id: str
    severity: str
    ip_address: str
    created_at: datetime
    new_values: Optional[dict] = None

    class Config:
        from_attributes = True


# ─── System Health ────────────────────────────────────────────────────────────

class SystemHealthResponse(BaseModel):
    database: str           # "healthy" / "degraded" / "unavailable"
    api: str
    audit_volume_24h: int
    active_sessions: int
    recent_errors: int
    checked_at: datetime
