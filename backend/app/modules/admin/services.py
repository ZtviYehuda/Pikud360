"""
Admin module service layer coordinating business logic for administration features.
Enforces tenant isolation and delegates to repositories.
"""
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.modules.admin.models import (
    SystemSetting, BusinessRule, AutomationRule, NotificationTemplate
)
from app.modules.admin.repositories import (
    SystemSettingsRepository, BusinessRuleRepository,
    AutomationRuleRepository, NotificationTemplateRepository,
    AuditCenterRepository, SystemHealthRepository
)
from app.modules.admin.schemas import (
    BusinessRuleCreateRequest, BusinessRuleUpdateRequest,
    AutomationRuleCreateRequest, AutomationRuleUpdateRequest,
    NotificationTemplateCreateRequest, NotificationTemplateUpdateRequest,
    SystemSettingsUpdateRequest
)

logger = logging.getLogger("pikud360.modules.admin.services")


class AdminService:
    """
    Central service for all platform administration operations.
    Coordinates settings management, rule configuration, audit access, and system health.
    """

    def __init__(self):
        self._settings_repo = SystemSettingsRepository()
        self._rules_repo = BusinessRuleRepository()
        self._automation_repo = AutomationRuleRepository()
        self._templates_repo = NotificationTemplateRepository()
        self._audit_repo = AuditCenterRepository()
        self._health_repo = SystemHealthRepository()

    # ── System Settings ──────────────────────────────────────────────────────

    def get_all_settings(self) -> List[SystemSetting]:
        """Returns all global platform settings."""
        return self._settings_repo.get_all()

    def update_settings(self, request: SystemSettingsUpdateRequest) -> List[SystemSetting]:
        """Bulk-upserts system settings. Returns updated settings."""
        updated = []
        for item in request.settings:
            result = self._settings_repo.upsert(item.key, item.value)
            if result:
                updated.append(result)
        logger.info(f"Updated {len(updated)} system settings")
        return updated

    # ── Business Rules ────────────────────────────────────────────────────────

    def list_business_rules(self, tenant_id: str, active_only: bool = False) -> List[BusinessRule]:
        """Lists all business rules for the tenant."""
        return self._rules_repo.list_by_tenant(tenant_id, active_only=active_only)

    def create_business_rule(self, request: BusinessRuleCreateRequest, tenant_id: str, user_id: str) -> Optional[BusinessRule]:
        """Creates a new business rule."""
        rule = BusinessRule(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            rule_type=request.rule_type,
            name=request.name,
            description=request.description,
            organization_unit_id=request.organization_unit_id,
            condition_json=request.condition_json,
            action_json=request.action_json,
            priority=request.priority,
            is_active=request.is_active,
            created_by=user_id
        )
        created = self._rules_repo.create(rule)
        if created:
            logger.info(f"Business rule '{created.name}' created by user {user_id}")
        return created

    def update_business_rule(self, rule_id: str, request: BusinessRuleUpdateRequest, tenant_id: str, user_id: str) -> Optional[BusinessRule]:
        """Updates an existing business rule."""
        updates = request.model_dump(exclude_none=True)
        updates["updated_by"] = user_id
        return self._rules_repo.update(rule_id, tenant_id, updates)

    def deactivate_business_rule(self, rule_id: str, tenant_id: str) -> bool:
        """Deactivates (soft deletes) a business rule."""
        return self._rules_repo.deactivate(rule_id, tenant_id)

    # ── Automation Rules ──────────────────────────────────────────────────────

    def list_automation_rules(self, tenant_id: str, active_only: bool = False) -> List[AutomationRule]:
        """Lists all automation rules for the tenant."""
        return self._automation_repo.list_by_tenant(tenant_id, active_only=active_only)

    def create_automation_rule(self, request: AutomationRuleCreateRequest, tenant_id: str, user_id: str) -> Optional[AutomationRule]:
        """Creates a new automation rule."""
        rule = AutomationRule(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            name=request.name,
            description=request.description,
            trigger_event=request.trigger_event,
            condition_json=request.condition_json,
            action_type=request.action_type,
            action_config=request.action_config,
            schedule_cron=request.schedule_cron,
            is_active=request.is_active,
            created_by=user_id
        )
        created = self._automation_repo.create(rule)
        if created:
            logger.info(f"Automation rule '{created.name}' created by user {user_id}")
        return created

    def update_automation_rule(self, rule_id: str, request: AutomationRuleUpdateRequest, tenant_id: str, user_id: str) -> Optional[AutomationRule]:
        """Updates an existing automation rule."""
        updates = request.model_dump(exclude_none=True)
        return self._automation_repo.update(rule_id, tenant_id, updates)

    def deactivate_automation_rule(self, rule_id: str, tenant_id: str) -> bool:
        """Deactivates an automation rule."""
        return self._automation_repo.deactivate(rule_id, tenant_id)

    # ── Notification Templates ─────────────────────────────────────────────────

    def list_notification_templates(self, tenant_id: str, active_only: bool = False) -> List[NotificationTemplate]:
        """Lists all notification templates for the tenant."""
        return self._templates_repo.list_by_tenant(tenant_id, active_only=active_only)

    def create_notification_template(self, request: NotificationTemplateCreateRequest, tenant_id: str, user_id: str) -> Optional[NotificationTemplate]:
        """Creates a new notification template."""
        template = NotificationTemplate(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            name=request.name,
            notification_type=request.notification_type,
            channel=request.channel,
            subject=request.subject,
            body_template=request.body_template,
            variables_json=request.variables_json,
            is_active=request.is_active,
            is_default=request.is_default,
            created_by=user_id
        )
        created = self._templates_repo.create(template)
        if created:
            logger.info(f"Notification template '{created.name}' created by user {user_id}")
        return created

    def update_notification_template(self, template_id: str, request: NotificationTemplateUpdateRequest, tenant_id: str, user_id: str) -> Optional[NotificationTemplate]:
        """Updates an existing notification template."""
        updates = request.model_dump(exclude_none=True)
        return self._templates_repo.update(template_id, tenant_id, updates)

    # ── Audit Center ──────────────────────────────────────────────────────────

    def get_audit_logs(self, tenant_id: str, **filters) -> Dict[str, Any]:
        """Returns paginated audit log entries with optional filters."""
        return self._audit_repo.list_paginated(tenant_id=tenant_id, **filters)

    # ── System Health ─────────────────────────────────────────────────────────

    def get_system_health(self, tenant_id: str) -> dict:
        """Aggregates system health metrics from all subsystems."""
        db_status = self._health_repo.check_db_health()
        audit_volume = self._audit_repo.get_volume_24h(tenant_id)
        recent_errors = self._audit_repo.get_recent_error_count(tenant_id)
        active_sessions = self._health_repo.get_active_session_count(tenant_id)

        return {
            "database": db_status,
            "api": "healthy",
            "audit_volume_24h": audit_volume,
            "active_sessions": active_sessions,
            "recent_errors": recent_errors,
            "checked_at": datetime.utcnow().isoformat()
        }


# Module-level singleton
admin_service = AdminService()
