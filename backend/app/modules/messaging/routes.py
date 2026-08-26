import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.modules.messaging.services import MessagingService
from app.modules.messaging.schemas import (
    CreateDirectConversationRequest, CreateGroupConversationRequest,
    SendMessageRequest, EditMessageRequest, MarkConversationReadRequest,
    TypingSignalRequest, PresenceUpdateRequest
)

logger = logging.getLogger("matzevet.modules.messaging.routes")
messaging_bp = Blueprint("messaging", __name__)
messaging_service = MessagingService()


@messaging_bp.route("/conversations", methods=["GET"])
@jwt_required(optional=True)
def list_conversations():
    """Returns list of conversations accessible to current user with unread counts."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"

        convs = messaging_service.list_conversations(tenant_id, str(user_id))
        return jsonify([c.model_dump() for c in convs]), 200
    except Exception as e:
        logger.error(f"Error listing conversations: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/conversations/direct", methods=["POST"])
@jwt_required(optional=True)
def get_or_create_direct():
    """Gets or creates a deduplicated 1-on-1 direct conversation."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"
        data = request.get_json() or {}

        target_user_id = data.get("target_user_id")
        if not target_user_id:
            return jsonify({"error": "target_user_id is required"}), 400

        initial_message = data.get("initial_message")
        conv = messaging_service.get_or_create_direct(tenant_id, str(user_id), str(target_user_id), initial_message)
        return jsonify(conv.model_dump() if conv else {}), 200
    except Exception as e:
        logger.error(f"Error creating direct conversation: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/conversations/group", methods=["POST"])
@jwt_required(optional=True)
def create_group():
    """Creates a new group conversation."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"
        data = request.get_json() or {}

        title = data.get("title")
        if not title:
            return jsonify({"error": "title is required"}), 400

        description = data.get("description")
        member_user_ids = data.get("member_user_ids") or []
        initial_message = data.get("initial_message")
        avatar_url = data.get("avatar_url")

        conv = messaging_service.create_group(
            tenant_id=tenant_id,
            creator_id=str(user_id),
            title=title,
            description=description,
            member_ids=member_user_ids,
            initial_msg=initial_message,
            avatar_url=avatar_url
        )
        return jsonify(conv.model_dump() if conv else {}), 201
    except Exception as e:
        logger.error(f"Error creating group: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/conversations/<conv_id>", methods=["GET"])
@jwt_required(optional=True)
def get_conversation(conv_id):
    """Fetches full conversation details and active member presence."""
    try:
        user_id = get_jwt_identity() or "default-user"
        conv = messaging_service.repo.get_conversation_by_id(conv_id, str(user_id))
        if not conv:
            return jsonify({"error": "Conversation not found or access denied"}), 404
        return jsonify(conv.model_dump()), 200
    except Exception as e:
        logger.error(f"Error fetching conversation {conv_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/conversations/<conv_id>/messages", methods=["GET"])
@jwt_required(optional=True)
def get_conversation_messages(conv_id):
    """Fetches paginated message history for a conversation."""
    try:
        user_id = get_jwt_identity() or "default-user"
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        messages = messaging_service.get_messages(conv_id, str(user_id), limit, offset)
        return jsonify([m.model_dump() for m in messages]), 200
    except Exception as e:
        logger.error(f"Error fetching messages for conv {conv_id}: {e}", exc_info=True)
        return jsonify([]), 200


@messaging_bp.route("/conversations/<conv_id>/messages", methods=["POST"])
@jwt_required(optional=True)
def send_message(conv_id):
    """Sends a message, reply, or file attachment to a conversation."""
    try:
        user_id = get_jwt_identity() or "default-user"
        data = request.get_json() or {}
        content = data.get("content", "")
        message_type = data.get("message_type", "TEXT")
        reply_to_message_id = data.get("reply_to_message_id")
        forwarded_from_message_id = data.get("forwarded_from_message_id")
        attachments = data.get("attachments")

        if not content.strip() and not attachments:
            return jsonify({"error": "Message content or attachments required"}), 400

        msg = messaging_service.send_message(
            conv_id=conv_id,
            sender_id=str(user_id),
            content=content,
            message_type=message_type,
            reply_to_id=reply_to_message_id,
            forwarded_from_id=forwarded_from_message_id,
            attachments=attachments
        )
        return jsonify(msg.model_dump()), 201
    except Exception as e:
        logger.error(f"Error sending message in conv {conv_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/messages/<msg_id>", methods=["PUT"])
@jwt_required(optional=True)
def edit_message(msg_id):
    """Edits a previously sent message."""
    try:
        user_id = get_jwt_identity() or "default-user"
        data = request.get_json() or {}
        content = data.get("content", "")
        if not content.strip():
            return jsonify({"error": "Content required"}), 400

        edited = messaging_service.edit_message(msg_id, str(user_id), content)
        if not edited:
            return jsonify({"error": "Cannot edit message or forbidden"}), 403
        return jsonify(edited.model_dump()), 200
    except Exception as e:
        logger.error(f"Error editing message {msg_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/messages/<msg_id>", methods=["DELETE"])
@jwt_required(optional=True)
def delete_message(msg_id):
    """Soft deletes a message."""
    try:
        user_id = get_jwt_identity() or "default-user"
        success = messaging_service.delete_message(msg_id, str(user_id))
        if not success:
            return jsonify({"error": "Cannot delete message or forbidden"}), 403
        return jsonify({"success": True, "message": "Message deleted"}), 200
    except Exception as e:
        logger.error(f"Error deleting message {msg_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/conversations/<conv_id>/read", methods=["POST"])
@jwt_required(optional=True)
def mark_read(conv_id):
    """Marks conversation as read and resets unread count."""
    try:
        user_id = get_jwt_identity() or "default-user"
        data = request.get_json() or {}
        last_id = data.get("last_read_message_id")
        messaging_service.mark_read(conv_id, str(user_id), last_id)
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.error(f"Error marking read for conv {conv_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/presence", methods=["GET", "POST"])
@jwt_required(optional=True)
def handle_presence():
    """Gets or updates current user presence."""
    user_id = get_jwt_identity() or "default-user"
    if request.method == "POST":
        data = request.get_json() or {}
        status = data.get("status", "online")
        custom = data.get("custom_status")
        messaging_service.set_user_presence(str(user_id), status, custom)
        return jsonify({"success": True, "presence": messaging_service.get_user_presence(str(user_id))}), 200
    else:
        target_uid = request.args.get("user_id") or str(user_id)
        return jsonify(messaging_service.get_user_presence(target_uid)), 200


@messaging_bp.route("/typing", methods=["POST"])
@jwt_required(optional=True)
def handle_typing():
    """Sets typing state for current user."""
    try:
        user_id = get_jwt_identity() or "default-user"
        data = request.get_json() or {}
        conv_id = data.get("conversation_id")
        is_typing = bool(data.get("is_typing", False))
        if conv_id:
            messaging_service.set_typing_state(conv_id, str(user_id), is_typing)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/typing/<conv_id>", methods=["GET"])
@jwt_required(optional=True)
def get_typing(conv_id):
    """Fetches typing users in conversation."""
    user_id = get_jwt_identity() or "default-user"
    typing_users = messaging_service.get_typing_users(conv_id, exclude_user_id=str(user_id))
    return jsonify({"typing_users": typing_users, "is_typing": len(typing_users) > 0}), 200


@messaging_bp.route("/search", methods=["GET"])
@jwt_required(optional=True)
def search_messaging():
    """Full-text and entity search across conversations, messages, files, and users."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"
        q = request.args.get("q", "").strip()
        if not q:
            return jsonify({"conversations": [], "messages": [], "files": []}), 200

        results = messaging_service.search(tenant_id, str(user_id), q)
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        return jsonify({"conversations": [], "messages": [], "files": []}), 200
