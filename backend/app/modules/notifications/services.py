import uuid
import logging
from datetime import datetime
from typing import List, Optional

from app.modules.notifications.models import Notification
from app.modules.notifications.repositories import NotificationRepository
from app.core.authorization import resolve_access_scope, AccessDeniedError

logger = logging.getLogger("pikud360.modules.notifications.services")

class NotificationService:
    """Service class managing commander alerts and system alerts."""

    def __init__(self, notification_repo: NotificationRepository):
        self._repo = notification_repo

    def create_notification(
        self,
        tenant_id: str,
        organization_unit_id: Optional[str],
        user_id: Optional[str],
        notification_type: str,
        severity: str,
        message: str
    ) -> Notification:
        # Validate inputs
        if not message:
            raise ValueError("Notification message cannot be empty.")

        notif = Notification(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            organization_unit_id=organization_unit_id,
            user_id=user_id,
            notification_type=notification_type,
            severity=severity,
            message=message,
            status="UNREAD",
            created_at=datetime.utcnow()
        )
        return self._repo.create(notif)

    def list_notifications(
        self,
        tenant_id: str,
        user_id: str,
        status_filter: Optional[str] = None
    ) -> List[Notification]:
        # Resolve user organization units scope
        ctx = resolve_access_scope(user_id, tenant_id)
        # Global managers can view all, otherwise bound to authorized tree
        unit_ids = ctx.organization_units if ctx.scope_type != "GLOBAL" else []
        
        return self._repo.list_by_scope(
            tenant_id=tenant_id,
            user_id=user_id,
            unit_ids=unit_ids,
            status_filter=status_filter
        )

    def mark_read(
        self,
        notification_id: str,
        tenant_id: str,
        operator_user_id: str
    ) -> bool:
        notif = self._repo.get_by_id(notification_id)
        if not notif:
            raise ValueError("Notification not found.")

        if notif.tenant_id != tenant_id:
            raise AccessDeniedError("Tenant mismatch for notification.")

        # Ensure operator user is authorized to read it (addressed to user or their units)
        if notif.user_id and notif.user_id != operator_user_id:
            ctx = resolve_access_scope(operator_user_id, tenant_id)
            if ctx.scope_type != "GLOBAL" and (not notif.organization_unit_id or notif.organization_unit_id not in ctx.organization_units):
                raise AccessDeniedError("Access Denied: Lacks authority to mark notification as read.")

        return self._repo.mark_as_read(notification_id, datetime.utcnow())

    def mark_all_read(self, tenant_id: str, operator_user_id: str) -> bool:
        ctx = resolve_access_scope(operator_user_id, tenant_id)
        unit_ids = ctx.organization_units if ctx.scope_type != "GLOBAL" else []
        return self._repo.mark_all_read(tenant_id, operator_user_id, unit_ids, datetime.utcnow())
