"""
Analytics module repository for alert rules.
"""
from typing import List, Optional
from app.database.connection import get_db_connection
from app.modules.analytics.models import AlertRule


class AlertRepository:
    """Handles raw DML operations for alert rules validation."""

    def load_alert_rules(self, tenant_id: str, unit_id: Optional[str] = None) -> List[AlertRule]:
        """Fetch configured alert rules from workforce.alert_rules."""
        query = """
            SELECT id, tenant_id, org_unit_id, name, metric_name, operator, threshold_value, evaluation_period, severity, is_active
            FROM workforce.alert_rules
            WHERE tenant_id = %s AND is_active = TRUE
        """
        params = [tenant_id]
        if unit_id:
            query += " AND (org_unit_id IS NULL OR org_unit_id = %s)"
            params.append(unit_id)
            
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, tuple(params))
                    return [
                        AlertRule(
                            id=row[0],
                            tenant_id=row[1],
                            org_unit_id=row[2],
                            name=row[3],
                            metric_name=row[4],
                            operator=row[5],
                            threshold_value=float(row[6]),
                            evaluation_period=row[7],
                            severity=row[8],
                            is_active=row[9]
                        )
                        for row in cur.fetchall()
                    ]
        except Exception:
            return []

    def create_or_keep_alert(self, tenant_id: str, unit_id: str, alert_type: str, severity: str, message: str) -> None:
        """Insert a new alert if it does not already exist as active."""
        check_query = """
            SELECT id FROM core.alerts 
            WHERE organization_unit_id = %s AND alert_type = %s AND status = 'ACTIVE';
        """
        insert_query = """
            INSERT INTO core.alerts (tenant_id, organization_unit_id, alert_type, severity, message, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'ACTIVE', CURRENT_TIMESTAMP);
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(check_query, (unit_id, alert_type))
                if not cur.fetchone():
                    cur.execute(insert_query, (tenant_id, unit_id, alert_type, severity, message))

    def resolve_alert(self, unit_id: str, alert_type: str) -> None:
        """Mark any active alerts of the specified type as resolved."""
        query = """
            UPDATE core.alerts 
            SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP 
            WHERE organization_unit_id = %s AND alert_type = %s AND status = 'ACTIVE';
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (unit_id, alert_type))
