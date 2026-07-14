from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging

from app.modules.notifications.repositories import NotificationRepository
from app.modules.notifications.services import NotificationService
from app.modules.notifications.schemas import NotificationResponse
from app.core.authorization import require_permission, ScopeType, AccessDeniedError
from app.core.responses import ApiResponse

logger = logging.getLogger("pikud360.modules.notifications.routes")

notifications_bp = Blueprint("notifications", __name__)

# Initialize dependencies
notif_repo = NotificationRepository()
notif_service = NotificationService(notification_repo=notif_repo)

@notifications_bp.route("/notifications", methods=["GET"])
@require_permission("notifications.view", ScopeType.ORGANIZATION_UNIT)
def list_notifications():
    """Lists alerts and messages accessible within the commander's organizational hierarchy."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    status_filter = request.args.get("status")  # E.g. 'UNREAD' or 'READ'

    results = notif_service.list_notifications(tenant_id, user_id, status_filter)
    serialized = [NotificationResponse.model_validate(n).model_dump() for n in results]
    
    return ApiResponse.success(data=serialized)

@notifications_bp.route("/notifications/<notification_id>/read", methods=["PUT"])
@require_permission("notifications.manage", ScopeType.ORGANIZATION_UNIT)
def mark_read(notification_id):
    """Marks a specific operational alert as read."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        success = notif_service.mark_read(notification_id, tenant_id, user_id)
        if not success:
            return ApiResponse.error(message="Notification not found or already read.", error_code="NOT_FOUND", status_code=404)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)

    return ApiResponse.success(message="Notification marked as read successfully.")

@notifications_bp.route("/notifications/read-all", methods=["PUT"])
@require_permission("notifications.manage", ScopeType.ORGANIZATION_UNIT)
def mark_all_read():
    """Marks all scoped alerts as read for the current session user."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    notif_service.mark_all_read(tenant_id, user_id)
    return ApiResponse.success(message="All scoped notifications marked as read.")
