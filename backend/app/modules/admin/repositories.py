"""
Admin module repositories handling CRUD for system settings, business rules,
automation rules, notification templates, and read-only access to audit logs.
"""
import json
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database.connection import get_db_connection
from app.modules.admin.models import (
    SystemSetting, BusinessRule, AutomationRule,
    NotificationTemplate, AuditLogEntry
)

logger = logging.getLogger("pikud360.modules.admin.repositories")


class SystemSettingsRepository:
    """Repository managing key/value system settings in core.system_settings."""

    def get_all(self) -> List[SystemSetting]:
        query = """
            SELECT key, value, description, updated_at
            FROM core.system_settings
            ORDER BY key;
        """
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    rows = cur.fetchall()
                    for row in rows:
                        results.append(SystemSetting(
                            key=row[0],
                            value=row[1],
                            description=row[2],
                            updated_at=row[3]
                        ))
        except Exception as e:
            logger.error(f"Error fetching system settings: {e}", exc_info=True)
        return results

    def upsert(self, key: str, value: str) -> Optional[SystemSetting]:
        query = """
            INSERT INTO core.system_settings (key, value, updated_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE
                SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
            RETURNING key, value, description, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (key, value))
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return SystemSetting(
                            key=row[0], value=row[1],
                            description=row[2], updated_at=row[3]
                        )
        except Exception as e:
            logger.error(f"Error upserting setting {key}: {e}", exc_info=True)
        return None


class BusinessRuleRepository:
    """Repository managing CRUD for core.business_rules."""

    def _row_to_entity(self, row) -> BusinessRule:
        return BusinessRule(
            id=str(row[0]),
            tenant_id=str(row[1]),
            organization_unit_id=str(row[2]) if row[2] else None,
            rule_type=row[3],
            name=row[4],
            description=row[5],
            condition_json=row[6] if isinstance(row[6], dict) else json.loads(row[6] or "{}"),
            action_json=row[7] if isinstance(row[7], dict) else json.loads(row[7] or "{}"),
            is_active=row[8],
            priority=row[9],
            created_by=str(row[10]) if row[10] else None,
            created_at=row[11],
            updated_at=row[12]
        )

    def list_by_tenant(self, tenant_id: str, active_only: bool = False) -> List[BusinessRule]:
        query = """
            SELECT id, tenant_id, organization_unit_id, rule_type, name, description,
                   condition_json, action_json, is_active, priority, created_by, created_at, updated_at
            FROM core.business_rules
            WHERE tenant_id = %s
        """
        params = [tenant_id]
        if active_only:
            query += " AND is_active = TRUE"
        query += " ORDER BY priority ASC, created_at DESC;"
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    for row in cur.fetchall():
                        results.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error listing business rules: {e}", exc_info=True)
        return results

    def create(self, rule: BusinessRule) -> Optional[BusinessRule]:
        query = """
            INSERT INTO core.business_rules
                (id, tenant_id, organization_unit_id, rule_type, name, description,
                 condition_json, action_json, is_active, priority, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, tenant_id, organization_unit_id, rule_type, name, description,
                      condition_json, action_json, is_active, priority, created_by, created_at, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (
                        rule.id, rule.tenant_id, rule.organization_unit_id,
                        rule.rule_type, rule.name, rule.description,
                        json.dumps(rule.condition_json), json.dumps(rule.action_json),
                        rule.is_active, rule.priority, rule.created_by
                    ))
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error creating business rule: {e}", exc_info=True)
        return None

    def update(self, rule_id: str, tenant_id: str, updates: dict) -> Optional[BusinessRule]:
        allowed = {"name", "description", "condition_json", "action_json", "is_active", "priority"}
        fields = {k: v for k, v in updates.items() if k in allowed and v is not None}
        if not fields:
            return None

        set_clauses = []
        params = []
        for k, v in fields.items():
            if k in ("condition_json", "action_json"):
                set_clauses.append(f"{k} = %s")
                params.append(json.dumps(v))
            else:
                set_clauses.append(f"{k} = %s")
                params.append(v)

        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([rule_id, tenant_id])

        query = f"""
            UPDATE core.business_rules
            SET {', '.join(set_clauses)}
            WHERE id = %s AND tenant_id = %s
            RETURNING id, tenant_id, organization_unit_id, rule_type, name, description,
                      condition_json, action_json, is_active, priority, created_by, created_at, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error updating business rule {rule_id}: {e}", exc_info=True)
        return None

    def deactivate(self, rule_id: str, tenant_id: str) -> bool:
        query = """
            UPDATE core.business_rules
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND tenant_id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (rule_id, tenant_id))
                    conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Error deactivating business rule {rule_id}: {e}", exc_info=True)
        return False


class AutomationRuleRepository:
    """Repository managing CRUD for core.automation_rules."""

    def _row_to_entity(self, row) -> AutomationRule:
        return AutomationRule(
            id=str(row[0]),
            tenant_id=str(row[1]),
            name=row[2],
            description=row[3],
            trigger_event=row[4],
            condition_json=row[5] if isinstance(row[5], dict) else json.loads(row[5] or "{}"),
            action_type=row[6],
            action_config=row[7] if isinstance(row[7], dict) else json.loads(row[7] or "{}"),
            schedule_cron=row[8],
            is_active=row[9],
            last_triggered_at=row[10],
            trigger_count=row[11] or 0,
            created_by=str(row[12]) if row[12] else None,
            created_at=row[13],
            updated_at=row[14]
        )

    def list_by_tenant(self, tenant_id: str, active_only: bool = False) -> List[AutomationRule]:
        query = """
            SELECT id, tenant_id, name, description, trigger_event, condition_json,
                   action_type, action_config, schedule_cron, is_active,
                   last_triggered_at, trigger_count, created_by, created_at, updated_at
            FROM core.automation_rules
            WHERE tenant_id = %s
        """
        params = [tenant_id]
        if active_only:
            query += " AND is_active = TRUE"
        query += " ORDER BY created_at DESC;"
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    for row in cur.fetchall():
                        results.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error listing automation rules: {e}", exc_info=True)
        return results

    def create(self, rule: AutomationRule) -> Optional[AutomationRule]:
        query = """
            INSERT INTO core.automation_rules
                (id, tenant_id, name, description, trigger_event, condition_json,
                 action_type, action_config, schedule_cron, is_active, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, tenant_id, name, description, trigger_event, condition_json,
                      action_type, action_config, schedule_cron, is_active,
                      last_triggered_at, trigger_count, created_by, created_at, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (
                        rule.id, rule.tenant_id, rule.name, rule.description,
                        rule.trigger_event, json.dumps(rule.condition_json),
                        rule.action_type, json.dumps(rule.action_config),
                        rule.schedule_cron, rule.is_active, rule.created_by
                    ))
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error creating automation rule: {e}", exc_info=True)
        return None

    def update(self, rule_id: str, tenant_id: str, updates: dict) -> Optional[AutomationRule]:
        allowed = {"name", "description", "condition_json", "action_type", "action_config", "schedule_cron", "is_active"}
        fields = {k: v for k, v in updates.items() if k in allowed and v is not None}
        if not fields:
            return None

        set_clauses = []
        params = []
        for k, v in fields.items():
            if k in ("condition_json", "action_config"):
                set_clauses.append(f"{k} = %s")
                params.append(json.dumps(v))
            else:
                set_clauses.append(f"{k} = %s")
                params.append(v)

        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([rule_id, tenant_id])

        query = f"""
            UPDATE core.automation_rules
            SET {', '.join(set_clauses)}
            WHERE id = %s AND tenant_id = %s
            RETURNING id, tenant_id, name, description, trigger_event, condition_json,
                      action_type, action_config, schedule_cron, is_active,
                      last_triggered_at, trigger_count, created_by, created_at, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error updating automation rule {rule_id}: {e}", exc_info=True)
        return None

    def deactivate(self, rule_id: str, tenant_id: str) -> bool:
        query = """
            UPDATE core.automation_rules
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND tenant_id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (rule_id, tenant_id))
                    conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Error deactivating automation rule {rule_id}: {e}", exc_info=True)
        return False


class NotificationTemplateRepository:
    """Repository managing CRUD for core.notification_templates."""

    def _row_to_entity(self, row) -> NotificationTemplate:
        return NotificationTemplate(
            id=str(row[0]),
            tenant_id=str(row[1]),
            name=row[2],
            notification_type=row[3],
            channel=row[4],
            subject=row[5],
            body_template=row[6],
            variables_json=row[7] if isinstance(row[7], list) else json.loads(row[7] or "[]"),
            is_active=row[8],
            is_default=row[9],
            created_by=str(row[10]) if row[10] else None,
            created_at=row[11],
            updated_at=row[12]
        )

    def list_by_tenant(self, tenant_id: str, active_only: bool = False) -> List[NotificationTemplate]:
        query = """
            SELECT id, tenant_id, name, notification_type, channel, subject,
                   body_template, variables_json, is_active, is_default,
                   created_by, created_at, updated_at
            FROM core.notification_templates
            WHERE tenant_id = %s
        """
        params = [tenant_id]
        if active_only:
            query += " AND is_active = TRUE"
        query += " ORDER BY notification_type, channel;"
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    for row in cur.fetchall():
                        results.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error listing notification templates: {e}", exc_info=True)
        return results

    def create(self, template: NotificationTemplate) -> Optional[NotificationTemplate]:
        query = """
            INSERT INTO core.notification_templates
                (id, tenant_id, name, notification_type, channel, subject,
                 body_template, variables_json, is_active, is_default, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, tenant_id, name, notification_type, channel, subject,
                      body_template, variables_json, is_active, is_default,
                      created_by, created_at, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (
                        template.id, template.tenant_id, template.name,
                        template.notification_type, template.channel,
                        template.subject, template.body_template,
                        json.dumps(template.variables_json),
                        template.is_active, template.is_default, template.created_by
                    ))
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error creating notification template: {e}", exc_info=True)
        return None

    def update(self, template_id: str, tenant_id: str, updates: dict) -> Optional[NotificationTemplate]:
        allowed = {"name", "subject", "body_template", "variables_json", "is_active", "is_default"}
        fields = {k: v for k, v in updates.items() if k in allowed and v is not None}
        if not fields:
            return None

        set_clauses = []
        params = []
        for k, v in fields.items():
            if k == "variables_json":
                set_clauses.append(f"{k} = %s")
                params.append(json.dumps(v))
            else:
                set_clauses.append(f"{k} = %s")
                params.append(v)

        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([template_id, tenant_id])

        query = f"""
            UPDATE core.notification_templates
            SET {', '.join(set_clauses)}
            WHERE id = %s AND tenant_id = %s
            RETURNING id, tenant_id, name, notification_type, channel, subject,
                      body_template, variables_json, is_active, is_default,
                      created_by, created_at, updated_at;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error updating notification template {template_id}: {e}", exc_info=True)
        return None


class AuditCenterRepository:
    """Read-only repository for admin-facing audit log access (audit.audit_logs)."""

    def list_paginated(
        self,
        tenant_id: str,
        page: int = 1,
        page_size: int = 50,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        user_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        conditions = ["tenant_id = %s"]
        params: List[Any] = [tenant_id]

        if event_type:
            conditions.append("event_type = %s")
            params.append(event_type)
        if severity:
            conditions.append("severity = %s")
            params.append(severity)
        if user_id:
            conditions.append("user_id = %s")
            params.append(user_id)
        if date_from:
            conditions.append("created_at >= %s")
            params.append(date_from)
        if date_to:
            conditions.append("created_at <= %s")
            params.append(date_to)

        where_clause = " AND ".join(conditions)
        offset = (page - 1) * page_size

        count_query = f"SELECT COUNT(*) FROM audit.audit_logs WHERE {where_clause};"
        data_query = f"""
            SELECT id, tenant_id, user_id, event_type, action, table_name, record_id,
                   severity, ip_address, created_at, new_values
            FROM audit.audit_logs
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s;
        """
        result = {"entries": [], "total": 0, "page": page, "page_size": page_size}
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(count_query, params)
                    count_row = cur.fetchone()
                    result["total"] = count_row[0] if count_row else 0

                    cur.execute(data_query, params + [page_size, offset])
                    for row in cur.fetchall():
                        result["entries"].append({
                            "id": str(row[0]),
                            "tenant_id": str(row[1]),
                            "user_id": str(row[2]) if row[2] else None,
                            "event_type": row[3],
                            "action": row[4],
                            "table_name": row[5],
                            "record_id": str(row[6]) if row[6] else None,
                            "severity": row[7],
                            "ip_address": row[8],
                            "created_at": row[9].isoformat() if row[9] else None,
                            "new_values": row[10] if isinstance(row[10], dict) else None
                        })
        except Exception as e:
            logger.error(f"Error fetching audit logs: {e}", exc_info=True)
        return result

    def get_volume_24h(self, tenant_id: str) -> int:
        query = """
            SELECT COUNT(*) FROM audit.audit_logs
            WHERE tenant_id = %s AND created_at >= NOW() - INTERVAL '24 hours';
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error fetching audit volume: {e}", exc_info=True)
            return 0

    def get_recent_error_count(self, tenant_id: str) -> int:
        query = """
            SELECT COUNT(*) FROM audit.audit_logs
            WHERE tenant_id = %s AND severity IN ('ERROR', 'CRITICAL')
            AND created_at >= NOW() - INTERVAL '1 hour';
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error fetching recent error count: {e}", exc_info=True)
            return 0


class SystemHealthRepository:
    """Repository providing system-wide health metrics for the admin health dashboard."""

    def get_active_session_count(self, tenant_id: str) -> int:
        query = """
            SELECT COUNT(*) FROM security.user_sessions s
            JOIN security.users u ON s.user_id = u.id
            WHERE u.tenant_id = %s AND s.revoked_at IS NULL AND s.expires_at > NOW();
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error fetching active session count: {e}", exc_info=True)
            return 0

    def check_db_health(self) -> str:
        try:
            from app.database.connection import DatabaseConnectionManager
            if DatabaseConnectionManager.check_health():
                return "healthy"
            return "degraded"
        except Exception:
            return "unavailable"
