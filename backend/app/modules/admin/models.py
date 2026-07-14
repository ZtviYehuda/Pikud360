"""
Admin module domain models for business rules, automation, and notification templates.
These are plain dataclasses for inter-layer data transfer without ORM dependency.
"""
from dataclasses import dataclass, field
from typing import Optional, Any
from datetime import datetime


@dataclass
class SystemSetting:
    """Represents a single key/value system-wide configuration entry."""
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None


@dataclass
class BusinessRule:
    """Represents a configurable business rule with condition and action definitions."""
    id: str
    tenant_id: str
    rule_type: str
    name: str
    condition_json: dict
    action_json: dict
    is_active: bool = True
    priority: int = 100
    description: Optional[str] = None
    organization_unit_id: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class AutomationRule:
    """Represents a configurable automation trigger that fires on events or schedules."""
    id: str
    tenant_id: str
    name: str
    trigger_event: str
    condition_json: dict
    action_type: str
    action_config: dict
    is_active: bool = True
    description: Optional[str] = None
    schedule_cron: Optional[str] = None
    last_triggered_at: Optional[datetime] = None
    trigger_count: int = 0
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class NotificationTemplate:
    """Represents an editable message template for notification dispatch."""
    id: str
    tenant_id: str
    name: str
    notification_type: str
    channel: str
    body_template: str
    variables_json: list
    is_active: bool = True
    is_default: bool = False
    subject: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class AuditLogEntry:
    """Represents a single audit event record from audit.audit_logs."""
    id: str
    tenant_id: str
    event_type: str
    action: str
    table_name: str
    record_id: str
    severity: str
    ip_address: str
    user_agent: str
    created_at: datetime
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
