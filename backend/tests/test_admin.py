"""
Tests for the Admin module — covers system settings, business rules, automation rules,
notification templates, audit center, and system health endpoints.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

# ─── Fixtures ────────────────────────────────────────────────────────────────

ADMIN_JWT_IDENTITY = "user-uuid-123"
ADMIN_JWT_CLAIMS = {
    "tenant_id": "de305d54-75b4-431b-adb2-eb6b9e546013",
    "permissions": ["system.settings.view", "system.settings.manage",
                    "business_rules.view", "business_rules.manage",
                    "automation.view", "automation.manage",
                    "notification_templates.view", "notification_templates.manage",
                    "audit.view", "audit.export", "system_health.view"],
    "scope": "GLOBAL"
}

@pytest.fixture(autouse=True)
def mock_user_repository():
    from app.modules.security.models import User
    mock_user = User(
        id=ADMIN_JWT_IDENTITY,
        tenant_id="de305d54-75b4-431b-adb2-eb6b9e546013",
        username="admin_test",
        email="admin@test.com",
        password_hash="hash",
        is_active=True
    )
    with patch("app.modules.security.repositories.UserRepository.get_by_id", return_value=mock_user):
        yield

@pytest.fixture
def auth_headers(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        token = create_access_token(identity=ADMIN_JWT_IDENTITY, additional_claims=ADMIN_JWT_CLAIMS)
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def denier_auth_headers(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        # Create a token without admin privileges
        denied_claims = {
            "tenant_id": "de305d54-75b4-431b-adb2-eb6b9e546013",
            "permissions": [],
            "scope": "SELF"
        }
        token = create_access_token(identity=ADMIN_JWT_IDENTITY, additional_claims=denied_claims)
        return {"Authorization": f"Bearer {token}"}


# ─── System Settings Tests ─────────────────────────────────────────────────

class TestSystemSettings:

    def test_get_settings_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.SystemSettingsRepository.get_all") as mock_get:
            mock_get.return_value = []
            res = client.get("/api/admin/settings", headers=auth_headers)
            assert res.status_code == 200
            data = json.loads(res.data)
            assert data["success"] is True

    def test_get_settings_returns_setting_list(self, client, auth_headers, app):
        from app.modules.admin.models import SystemSetting
        mock_setting = SystemSetting(key="scheduling_mode_default", value="DIRECT_STATUS", description="Desc", updated_at=datetime(2026, 1, 1))
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.SystemSettingsRepository.get_all", return_value=[mock_setting]):
            res = client.get("/api/admin/settings", headers=auth_headers)
            assert res.status_code == 200
            data = json.loads(res.data)
            assert len(data["data"]) == 1
            assert data["data"][0]["key"] == "scheduling_mode_default"

    def test_update_settings_returns_200(self, client, auth_headers, app):
        from app.modules.admin.models import SystemSetting
        mock_setting = SystemSetting(key="scheduling_mode_default", value="SHIFT_BASED")
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.SystemSettingsRepository.upsert", return_value=mock_setting):
            payload = {"settings": [{"key": "scheduling_mode_default", "value": "SHIFT_BASED"}]}
            res = client.put("/api/admin/settings", json=payload, headers=auth_headers)
            assert res.status_code == 200
            data = json.loads(res.data)
            assert data["success"] is True

    def test_get_settings_denied_without_permission(self, client, denier_auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=False), \
             patch("app.modules.security.repositories.AuditLogRepository.create", return_value=None):
            res = client.get("/api/admin/settings", headers=denier_auth_headers)
            assert res.status_code == 403


# ─── Business Rules Tests ──────────────────────────────────────────────────

class TestBusinessRules:

    def test_list_business_rules_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.BusinessRuleRepository.list_by_tenant", return_value=[]):
            res = client.get("/api/admin/business-rules", headers=auth_headers)
            assert res.status_code == 200

    def test_create_business_rule_returns_201(self, client, auth_headers, app):
        from app.modules.admin.models import BusinessRule
        mock_rule = BusinessRule(
            id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            tenant_id="de305d54-75b4-431b-adb2-eb6b9e546013",
            rule_type="SICK_THRESHOLD", name="Test Rule",
            condition_json={"threshold": 10}, action_json={"alert": True}
        )
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.BusinessRuleRepository.create", return_value=mock_rule):
            payload = {"rule_type": "SICK_THRESHOLD", "name": "Test Rule", "condition_json": {"threshold": 10}, "action_json": {"alert": True}}
            res = client.post("/api/admin/business-rules", json=payload, headers=auth_headers)
            assert res.status_code == 201
            data = json.loads(res.data)
            assert data["data"]["name"] == "Test Rule"

    def test_deactivate_business_rule_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.BusinessRuleRepository.deactivate", return_value=True):
            res = client.delete("/api/admin/business-rules/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", headers=auth_headers)
            assert res.status_code == 200


# ─── Automation Rules Tests ────────────────────────────────────────────────

class TestAutomationRules:

    def test_list_automation_rules_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.AutomationRuleRepository.list_by_tenant", return_value=[]):
            res = client.get("/api/admin/automation", headers=auth_headers)
            assert res.status_code == 200

    def test_create_automation_rule_returns_201(self, client, auth_headers, app):
        from app.modules.admin.models import AutomationRule
        mock_rule = AutomationRule(
            id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            tenant_id="de305d54-75b4-431b-adb2-eb6b9e546013",
            name="Auto Notify", trigger_event="SICK_EXCEEDED",
            condition_json={}, action_type="NOTIFY_COMMANDER", action_config={}
        )
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.AutomationRuleRepository.create", return_value=mock_rule):
            payload = {"name": "Auto Notify", "trigger_event": "SICK_EXCEEDED", "action_type": "NOTIFY_COMMANDER"}
            res = client.post("/api/admin/automation", json=payload, headers=auth_headers)
            assert res.status_code == 201
            data = json.loads(res.data)
            assert data["data"]["trigger_event"] == "SICK_EXCEEDED"

    def test_deactivate_automation_rule_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.AutomationRuleRepository.deactivate", return_value=True):
            res = client.delete("/api/admin/automation/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", headers=auth_headers)
            assert res.status_code == 200


# ─── Notification Templates Tests ──────────────────────────────────────────

class TestNotificationTemplates:

    def test_list_templates_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.NotificationTemplateRepository.list_by_tenant", return_value=[]):
            res = client.get("/api/admin/notification-templates", headers=auth_headers)
            assert res.status_code == 200

    def test_create_template_returns_201(self, client, auth_headers, app):
        from app.modules.admin.models import NotificationTemplate
        mock_tmpl = NotificationTemplate(
            id="cccccccc-cccc-cccc-cccc-cccccccccccc",
            tenant_id="de305d54-75b4-431b-adb2-eb6b9e546013",
            name="Sick Alert", notification_type="SICK_ALERT",
            channel="IN_APP", body_template="Employee {{name}} is sick",
            variables_json=["name"]
        )
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.NotificationTemplateRepository.create", return_value=mock_tmpl):
            payload = {"name": "Sick Alert", "notification_type": "SICK_ALERT", "body_template": "Employee {{name}} is sick"}
            res = client.post("/api/admin/notification-templates", json=payload, headers=auth_headers)
            assert res.status_code == 201
            data = json.loads(res.data)
            assert data["data"]["notification_type"] == "SICK_ALERT"


# ─── Audit Center Tests ────────────────────────────────────────────────────

class TestAuditCenter:

    def test_list_audit_logs_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.AuditCenterRepository.list_paginated", return_value={"entries": [], "total": 0, "page": 1, "page_size": 25}):
            res = client.get("/api/admin/audit", headers=auth_headers)
            assert res.status_code == 200
            data = json.loads(res.data)
            assert data["success"] is True
            assert "meta" in data
            assert data["meta"]["total"] == 0

    def test_export_audit_logs_returns_csv(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.AuditCenterRepository.list_paginated", return_value={"entries": [], "total": 0, "page": 1, "page_size": 5000}):
            res = client.post("/api/admin/audit/export", json={}, headers=auth_headers)
            assert res.status_code == 200
            assert "text/csv" in res.content_type


# ─── System Health Tests ───────────────────────────────────────────────────

class TestSystemHealth:

    def test_system_health_returns_200(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.SystemHealthRepository.check_db_health", return_value="healthy"), \
             patch("app.modules.admin.repositories.AuditCenterRepository.get_volume_24h", return_value=42), \
             patch("app.modules.admin.repositories.AuditCenterRepository.get_recent_error_count", return_value=0), \
             patch("app.modules.admin.repositories.SystemHealthRepository.get_active_session_count", return_value=3):
            res = client.get("/api/admin/system-health", headers=auth_headers)
            assert res.status_code == 200
            data = json.loads(res.data)
            assert data["success"] is True
            assert data["data"]["database"] == "healthy"
            assert data["data"]["audit_volume_24h"] == 42
            assert data["data"]["active_sessions"] == 3

    def test_system_health_shows_degraded(self, client, auth_headers, app):
        with app.app_context(), \
             patch("app.core.authorization.decorators.check_authorization", return_value=True), \
             patch("app.modules.admin.repositories.SystemHealthRepository.check_db_health", return_value="degraded"), \
             patch("app.modules.admin.repositories.AuditCenterRepository.get_volume_24h", return_value=5), \
             patch("app.modules.admin.repositories.AuditCenterRepository.get_recent_error_count", return_value=2), \
             patch("app.modules.admin.repositories.SystemHealthRepository.get_active_session_count", return_value=1):
            res = client.get("/api/admin/system-health", headers=auth_headers)
            assert res.status_code == 200
            data = json.loads(res.data)
            assert data["data"]["database"] == "degraded"
            assert data["data"]["recent_errors"] == 2
