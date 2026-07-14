import logging
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db_connection
from app.modules.notifications.models import Notification

logger = logging.getLogger("pikud360.modules.notifications.repositories")

class NotificationRepository:
    """Repository mapping operations for core.notifications table."""

    def _row_to_entity(self, row) -> Notification:
        return Notification(
            id=row[0],
            tenant_id=row[1],
            organization_unit_id=row[2],
            user_id=row[3],
            notification_type=row[4],
            severity=row[5],
            message=row[6],
            status=row[7],
            created_at=row[8],
            read_at=row[9]
        )

    def get_by_id(self, notification_id: str) -> Optional[Notification]:
        query = """
            SELECT id, tenant_id, organization_unit_id, user_id, notification_type, severity, message, status, created_at, read_at
            FROM core.notifications
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (notification_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching notification {notification_id}: {e}", exc_info=True)
        return None

    def create(self, notification: Notification) -> Notification:
        query = """
            INSERT INTO core.notifications (
                id, tenant_id, organization_unit_id, user_id, notification_type, severity, message, status, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, tenant_id, organization_unit_id, user_id, notification_type, severity, message, status, created_at, read_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        notification.id, notification.tenant_id, notification.organization_unit_id,
                        notification.user_id, notification.notification_type, notification.severity,
                        notification.message, notification.status, notification.created_at
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to create notification.")

    def mark_as_read(self, notification_id: str, read_at: datetime) -> bool:
        query = """
            UPDATE core.notifications
            SET status = 'READ', read_at = %s
            WHERE id = %s AND status = 'UNREAD';
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (read_at, notification_id))
                    conn.commit()
                    return cur.rowcount > 0
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as read: {e}", exc_info=True)
        return False

    def mark_all_read(self, tenant_id: str, user_id: str, unit_ids: List[str], read_at: datetime) -> bool:
        # Check permissions target or specific filters
        query = """
            UPDATE core.notifications
            SET status = 'READ', read_at = %s
            WHERE tenant_id = %s 
              AND status = 'UNREAD'
              AND (user_id = %s OR organization_unit_id = ANY(%s) OR (user_id IS NULL AND organization_unit_id IS NULL));
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (read_at, tenant_id, user_id, unit_ids))
                    conn.commit()
                    return cur.rowcount > 0
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}", exc_info=True)
        return False

    def list_by_scope(
        self,
        tenant_id: str,
        user_id: str,
        unit_ids: List[str],
        status_filter: Optional[str] = None
    ) -> List[Notification]:
        query = """
            SELECT id, tenant_id, organization_unit_id, user_id, notification_type, severity, message, status, created_at, read_at
            FROM core.notifications
            WHERE tenant_id = %s
              AND (user_id = %s OR organization_unit_id = ANY(%s) OR (user_id IS NULL AND organization_unit_id IS NULL))
        """
        params = [tenant_id, user_id, unit_ids]

        if status_filter:
            query += " AND status = %s"
            params.append(status_filter)

        query += " ORDER BY created_at DESC;"

        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    for r in rows:
                        results.append(self._row_to_entity(r))
        except Exception as e:
            logger.error(f"Error listing notifications by scope: {e}", exc_info=True)
        return results
