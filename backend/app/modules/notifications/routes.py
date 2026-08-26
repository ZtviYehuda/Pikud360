from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging
from datetime import datetime, timezone

from app.database.connection import get_db_connection
from app.modules.notifications.repositories import NotificationRepository
from app.modules.notifications.services import NotificationService
from app.modules.notifications.schemas import NotificationResponse
from app.core.authorization import require_permission, ScopeType, AccessDeniedError
from app.core.responses import ApiResponse

logger = logging.getLogger("matzevet.modules.notifications.routes")

notifications_bp = Blueprint("notifications", __name__)

# Initialize dependencies
notif_repo = NotificationRepository()
notif_service = NotificationService(notification_repo=notif_repo)


def _get_aliases(identifier: str):
    """Resolves all database aliases (user_id, username, employee_id, and support aliases)."""
    aliases = {str(identifier).lower()}
    if str(identifier).lower() in ["1", "admin", "admin-support", "691b0694-1c0f-49de-9213-1f4ed4ea2936"]:
        aliases.update(["1", "admin", "admin-support", "691b0694-1c0f-49de-9213-1f4ed4ea2936"])
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.username, e.id, e.employee_number
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    WHERE u.id::text = %s OR u.username = %s OR e.id::text = %s OR e.employee_number = %s;
                """, (str(identifier), str(identifier), str(identifier), str(identifier)))
                for r in cur.fetchall():
                    for item in r:
                        if item:
                            aliases.add(str(item).lower())
    except Exception as e:
        logger.error(f"Error resolving aliases for {identifier}: {e}")
    return tuple(aliases)


def _get_user_info(user_id: str):
    """Helper to fetch sender's first and last name."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.username, e.first_name, e.last_name, e.id
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    WHERE u.id::text = %s OR u.username = %s;
                """, (str(user_id), str(user_id)))
                row = cur.fetchone()
                if row:
                    u_id, username, e_first, e_last, e_id = row
                    first = e_first or username or "משתמש"
                    last = e_last or ""
                    return {
                        "first_name": first,
                        "last_name": last,
                        "user_id": str(u_id),
                        "emp_id": str(e_id) if e_id else str(u_id),
                        "is_admin": (username == "admin" or str(u_id) == "691b0694-1c0f-49de-9213-1f4ed4ea2936")
                    }
    except Exception as e:
        logger.error(f"Error fetching user info for {user_id}: {e}")
    return {"first_name": "משתמש", "last_name": "", "user_id": str(user_id), "emp_id": str(user_id), "is_admin": False}


@notifications_bp.route("/notifications", methods=["GET"])
@require_permission("notifications.view", ScopeType.ORGANIZATION_UNIT)
def list_notifications():
    """Lists alerts and messages accessible within the commander's organizational hierarchy."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    status_filter = request.args.get("status")

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


@notifications_bp.route("/notifications/send", methods=["POST"])
@jwt_required(optional=True)
def send_chat_notification():
    """Endpoint for sending chat / direct / group notifications."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"
        data = request.get_json() or {}

        title = data.get("title") or "הודעה חדשה בצ'אט"
        description = data.get("description") or data.get("message") or ""
        
        recipient_id = data.get("recipient_id")
        recipient_ids = data.get("recipient_ids") or []
        if recipient_id and str(recipient_id) not in [str(r) for r in recipient_ids]:
            recipient_ids.append(recipient_id)

        if not recipient_ids or not description.strip():
            return jsonify({"error": "Missing recipients or description"}), 400

        sender_info = _get_user_info(user_id)
        sender_first = sender_info.get("first_name", "")
        sender_last = sender_info.get("last_name", "")
        effective_sender_id = sender_info.get("user_id") or str(user_id)

        created_records = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                for rec_id in recipient_ids:
                    # If sending to support team (1 / admin), normalize recipient_id
                    rec_str = str(rec_id)
                    cur.execute("""
                        INSERT INTO core.chat_messages (
                            tenant_id, sender_id, sender_first, sender_last, recipient_id, title, description, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        RETURNING id, sender_id, recipient_id, title, description, created_at, sender_first, sender_last;
                    """, (
                        str(tenant_id), str(effective_sender_id), sender_first, sender_last,
                        rec_str, title, description.strip()
                    ))
                    row = cur.fetchone()
                    if row:
                        created_records.append({
                            "id": row[0],
                            "sender_id": row[1],
                            "recipient_id": row[2],
                            "title": row[3],
                            "description": row[4],
                            "created_at": row[5].isoformat() if hasattr(row[5], "isoformat") else str(row[5]),
                            "sender_first": row[6],
                            "sender_last": row[7]
                        })
                conn.commit()

        return jsonify({"success": True, "data": created_records, "message": "ההודעה נשלחה בהצלחה"}), 200
    except Exception as e:
        logger.error(f"Error sending chat message: {e}", exc_info=True)
        return jsonify({"error": f"Failed to send notification: {str(e)}"}), 500


@notifications_bp.route("/notifications/messages/conversation/<recipient_id>", methods=["GET"])
@jwt_required(optional=True)
def get_chat_conversation(recipient_id):
    """Fetches full conversation message history between current user and specified recipient."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"

        user_aliases = _get_aliases(user_id)
        recipient_aliases = _get_aliases(recipient_id)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, sender_id, recipient_id, title, description, created_at, sender_first, sender_last
                    FROM core.chat_messages
                    WHERE (
                        (LOWER(sender_id) IN %s AND LOWER(recipient_id) IN %s)
                        OR 
                        (LOWER(sender_id) IN %s AND LOWER(recipient_id) IN %s)
                    )
                    ORDER BY created_at ASC;
                """, (user_aliases, recipient_aliases, recipient_aliases, user_aliases))
                rows = cur.fetchall()

                messages = []
                for row in rows:
                    messages.append({
                        "id": row[0],
                        "sender_id": row[1],
                        "recipient_id": row[2],
                        "title": row[3],
                        "description": row[4],
                        "created_at": row[5].isoformat() if hasattr(row[5], "isoformat") else str(row[5]),
                        "sender_first": row[6] or "",
                        "sender_last": row[7] or ""
                    })

                return jsonify(messages), 200
    except Exception as e:
        logger.error(f"Error fetching conversation for recipient {recipient_id}: {e}", exc_info=True)
        return jsonify([]), 200


@notifications_bp.route("/notifications/messages/conversation/<recipient_id>", methods=["DELETE"])
@jwt_required(optional=True)
def delete_chat_conversation(recipient_id):
    """Clears conversation history between current user and specified recipient."""
    try:
        user_id = get_jwt_identity() or "default-user"
        user_aliases = _get_aliases(user_id)
        recipient_aliases = _get_aliases(recipient_id)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM core.chat_messages
                    WHERE (
                        (LOWER(sender_id) IN %s AND LOWER(recipient_id) IN %s)
                        OR 
                        (LOWER(sender_id) IN %s AND LOWER(recipient_id) IN %s)
                    );
                """, (user_aliases, recipient_aliases, recipient_aliases, user_aliases))
                conn.commit()

        return jsonify({"success": True, "message": "Conversation history deleted"}), 200
    except Exception as e:
        logger.error(f"Error deleting conversation with {recipient_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
