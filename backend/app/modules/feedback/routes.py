import os
import uuid
import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename

from app.database.connection import get_db_connection

logger = logging.getLogger("matzevet.modules.feedback.routes")

feedback_bp = Blueprint("feedback", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "screenshots")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif", "svg"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _ensure_tables_schema():
    """Ensures screenshot_url and context_page exist on support.feedback_reports."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    ALTER TABLE support.feedback_reports 
                    ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
                    ADD COLUMN IF NOT EXISTS context_page VARCHAR(255);
                """)
                conn.commit()
    except Exception as e:
        logger.error(f"Error ensuring feedback_reports schema: {e}")


# Run schema check once on import
_ensure_tables_schema()


def _resolve_user_id(raw_id):
    """Resolves raw identifier (e.g. '1', 'admin', uuid) to a valid UUID in security.users."""
    default_admin_id = "691b0694-1c0f-49de-9213-1f4ed4ea2936"
    if not raw_id:
        return default_admin_id
    try:
        uuid.UUID(str(raw_id))
        return str(raw_id)
    except (ValueError, TypeError):
        pass

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM security.users 
                    WHERE username = %s OR id::text = %s
                    LIMIT 1;
                """, (str(raw_id), str(raw_id)))
                row = cur.fetchone()
                if row:
                    return str(row[0])
    except Exception as e:
        logger.error(f"Error resolving user id {raw_id}: {e}")
    return default_admin_id


# ── Screenshot Upload & Static Serving ──────────────────────────────────────

@feedback_bp.route("/feedback/upload-screenshot", methods=["POST"])
@feedback_bp.route("/upload-screenshot", methods=["POST"])
def upload_screenshot():
    """Uploads an image screenshot and returns a permanent accessible URL."""
    try:
        file = request.files.get("screenshot") or request.files.get("file")
        if not file or not file.filename:
            return jsonify({"error": "No file uploaded"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed"}), 400

        ext = file.filename.rsplit(".", 1)[1].lower()
        unique_name = f"screenshot_{uuid.uuid4().hex[:12]}.{ext}"
        save_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(save_path)

        file_url = f"/api/static/uploads/screenshots/{unique_name}"
        return jsonify({
            "success": True,
            "screenshot_url": file_url,
            "filename": unique_name
        }), 200
    except Exception as e:
        logger.error(f"Error uploading screenshot: {e}", exc_info=True)
        return jsonify({"error": f"Failed to upload screenshot: {str(e)}"}), 500


@feedback_bp.route("/static/uploads/screenshots/<path:filename>", methods=["GET"])
def serve_screenshot(filename):
    """Serves uploaded screenshot files directly."""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ── Feedback Reports (Tickets) Endpoints ─────────────────────────────────────

@feedback_bp.route("/feedback", methods=["POST"])
@jwt_required(optional=True)
def create_feedback():
    """Creates a new feedback report / support ticket."""
    try:
        raw_user_id = get_jwt_identity() or "admin"
        user_uuid = _resolve_user_id(raw_user_id)
        data = request.get_json() or {}

        category = data.get("category") or "improvement"
        description = (data.get("description") or "").strip()
        screenshot_url = data.get("screenshot_url")
        context_page = data.get("context_page") or "feedback_page"
        title = data.get("title") or (description[:60] if description else "פנייה למערכת")

        if not description:
            return jsonify({"error": "Description is required"}), 400

        ticket_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO support.feedback_reports (
                        id, user_id, category, title, description,
                        priority, status, created_at, updated_at,
                        created_by, updated_by, screenshot_url, context_page
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s
                    )
                    RETURNING id, user_id, category, title, description, priority, status, created_at, screenshot_url;
                """, (
                    ticket_id, user_uuid, category, title, description,
                    "medium", "received", now, now,
                    user_uuid, user_uuid, screenshot_url, context_page
                ))
                row = cur.fetchone()

                # Also insert into support.attachments if screenshot exists
                if screenshot_url:
                    cur.execute("""
                        INSERT INTO support.attachments (
                            id, entity_type, entity_id, file_name, storage_path,
                            mime_type, file_size, checksum_sha256, created_at, created_by
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s
                        )
                    """, (
                        str(uuid.uuid4()), "feedback", ticket_id, "screenshot", screenshot_url,
                        "image/png", 0, "", now, user_uuid
                    ))

                # Also create an automated acknowledgment notification in core.chat_messages / core.notifications
                try:
                    cur.execute("""
                        INSERT INTO core.chat_messages (
                            tenant_id, sender_id, sender_first, sender_last,
                            recipient_id, title, description, created_at
                        ) VALUES (
                            %s, %s, %s, %s,
                            %s, %s, %s, NOW()
                        )
                    """, (
                        "00000000-0000-0000-0000-000000000001",
                        "admin", "צוות", "התמיכה",
                        str(raw_user_id), "פנייתך התקבלה במערכת",
                        f"תודה על המשוב בנושא: '{title}'. הפנייה נקלטה ותטופל בהקדם."
                    ))
                except Exception as notif_err:
                    logger.warning(f"Could not create ack chat notification: {notif_err}")

                conn.commit()

        return jsonify({
            "success": True,
            "message": "הפנייה נשלחה בהצלחה",
            "data": {
                "id": row[0],
                "user_id": str(row[1]),
                "category": row[2],
                "title": row[3],
                "description": row[4],
                "priority": row[5],
                "status": row[6],
                "created_at": row[7].isoformat() if hasattr(row[7], "isoformat") else str(row[7]),
                "screenshot_url": row[8]
            }
        }), 201
    except Exception as e:
        logger.error(f"Error creating feedback report: {e}", exc_info=True)
        return jsonify({"error": f"Failed to submit feedback: {str(e)}"}), 500


@feedback_bp.route("/feedback/my", methods=["GET"])
@jwt_required(optional=True)
def get_my_feedback():
    """Returns tickets submitted by the current user."""
    try:
        raw_user_id = get_jwt_identity() or "admin"
        user_uuid = _resolve_user_id(raw_user_id)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        f.id, f.category, f.title, f.description, f.priority,
                        f.status, f.resolution_comment, f.created_at, f.updated_at,
                        f.screenshot_url, f.context_page
                    FROM support.feedback_reports f
                    WHERE f.deleted_at IS NULL
                      AND (f.user_id = %s OR f.created_by = %s)
                    ORDER BY f.created_at DESC;
                """, (user_uuid, user_uuid))
                rows = cur.fetchall()

                tickets = []
                for r in rows:
                    tickets.append({
                        "id": str(r[0]),
                        "category": r[1] or "improvement",
                        "title": r[2] or "",
                        "description": r[3] or "",
                        "priority": r[4] or "medium",
                        "status": r[5] or "received",
                        "resolution_comment": r[6] or "",
                        "created_at": r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7]),
                        "updated_at": r[8].isoformat() if hasattr(r[8], "isoformat") else str(r[8]),
                        "screenshot_url": r[9] or "",
                        "context_page": r[10] or ""
                    })

                return jsonify(tickets), 200
    except Exception as e:
        logger.error(f"Error fetching my feedback: {e}", exc_info=True)
        return jsonify([]), 200


@feedback_bp.route("/feedback/admin/all", methods=["GET"])
@feedback_bp.route("/support/tickets", methods=["GET"])
@jwt_required(optional=True)
def get_all_feedback():
    """Returns all feedback tickets for administrators/commanders."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        f.id, f.category, f.title, f.description, f.priority,
                        f.status, f.resolution_comment, f.created_at, f.updated_at,
                        f.screenshot_url, f.context_page,
                        COALESCE(e.first_name, u.username, 'משתמש') AS sender_first,
                        COALESCE(e.last_name, '') AS sender_last,
                        COALESCE(ou.name, 'ללא מחלקה') AS department_name
                    FROM support.feedback_reports f
                    LEFT JOIN security.users u ON u.id = f.user_id
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    LEFT JOIN core.organization_units ou ON ou.id = e.department_id
                    WHERE f.deleted_at IS NULL
                    ORDER BY f.created_at DESC;
                """)
                rows = cur.fetchall()

                tickets = []
                for r in rows:
                    tickets.append({
                        "id": str(r[0]),
                        "category": r[1] or "improvement",
                        "title": r[2] or "",
                        "description": r[3] or "",
                        "priority": r[4] or "medium",
                        "status": r[5] or "received",
                        "resolution_comment": r[6] or "",
                        "created_at": r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7]),
                        "updated_at": r[8].isoformat() if hasattr(r[8], "isoformat") else str(r[8]),
                        "screenshot_url": r[9] or "",
                        "context_page": r[10] or "",
                        "sender_name": f"{r[11]} {r[12]}".strip(),
                        "department_name": r[13] or ""
                    })

                return jsonify(tickets), 200
    except Exception as e:
        logger.error(f"Error fetching all feedback: {e}", exc_info=True)
        return jsonify([]), 200


@feedback_bp.route("/feedback/admin/update/<ticket_id>", methods=["PUT"])
@feedback_bp.route("/support/tickets/<ticket_id>/reply", methods=["PUT"])
@jwt_required(optional=True)
def update_feedback_ticket(ticket_id):
    """Updates status, priority, or reply for a ticket."""
    try:
        data = request.get_json() or {}
        new_status = data.get("status")
        resolution_comment = data.get("resolution_comment") or data.get("reply") or data.get("response")
        priority = data.get("priority")

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE support.feedback_reports
                    SET 
                        status = COALESCE(%s, status),
                        resolution_comment = COALESCE(%s, resolution_comment),
                        priority = COALESCE(%s, priority),
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING id, status, resolution_comment;
                """, (new_status, resolution_comment, priority, str(ticket_id)))
                row = cur.fetchone()
                conn.commit()

                if not row:
                    return jsonify({"error": "Ticket not found"}), 404

        return jsonify({"success": True, "message": "Ticket updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error updating ticket {ticket_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── System Updates / Release Notes Endpoints ─────────────────────────────────

DEFAULT_UPDATES = [
    {
        "id": 1,
        "version": "v3.1.0",
        "release_date": "2026-09-02",
        "features": [
            "עיצוב חדש ומודרני לטופס הגשת בקשות ניוד ושיבוץ",
            "תמיכה בהעלאת תמונות וצילומי מסך במוקד הפניות והמשוב",
            "שיפור ביצועי מערכת וסנכרון נתונים שוטף"
        ]
    },
    {
        "id": 2,
        "version": "v3.0.0",
        "release_date": "2026-08-25",
        "features": [
            "מערכת התראות מבצעיות מתקדמת עם צ'אט פיקודי ישיר",
            "דשבורד מגמות נוכחות וניהול שיבוצים אינטראקטיבי",
            "שמירה אוטומטית של טפסים ומניעת אובדן נתונים"
        ]
    }
]


def _get_system_updates_from_db():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM core.system_settings WHERE key = 'system_updates_list';")
                row = cur.fetchone()
                if row and row[0]:
                    if isinstance(row[0], list):
                        return row[0]
                    if isinstance(row[0], str):
                        return json.loads(row[0])
    except Exception as e:
        logger.error(f"Error reading system_updates_list from db: {e}")
    return DEFAULT_UPDATES


def _save_system_updates_to_db(updates_list):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO core.system_settings (key, value, description, updated_at)
                    VALUES ('system_updates_list', %s, 'List of release notes and system changelog updates', NOW())
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
                """, (json.dumps(updates_list, ensure_ascii=False),))
                conn.commit()
    except Exception as e:
        logger.error(f"Error saving system_updates_list to db: {e}")


@feedback_bp.route("/feedback/updates", methods=["GET"])
def get_system_updates():
    """Returns release notes and system changelog."""
    updates = _get_system_updates_from_db()
    return jsonify(updates), 200


@feedback_bp.route("/feedback/updates", methods=["POST"])
@jwt_required(optional=True)
def add_system_update():
    """Adds a new system release note."""
    try:
        data = request.get_json() or {}
        version = data.get("version", "").strip()
        release_date = data.get("release_date") or datetime.now().strftime("%Y-%m-%d")
        features = data.get("features") or []

        if not version or not features:
            return jsonify({"error": "Version and features are required"}), 400

        current_updates = _get_system_updates_from_db()
        new_id = max([u.get("id", 0) for u in current_updates] + [0]) + 1
        new_entry = {
            "id": new_id,
            "version": version,
            "release_date": release_date,
            "features": [f.strip() for f in features if f and f.strip()]
        }
        current_updates.insert(0, new_entry)
        _save_system_updates_to_db(current_updates)

        return jsonify({"success": True, "data": new_entry, "message": "עדכון הגרסה נשמר בהצלחה"}), 201
    except Exception as e:
        logger.error(f"Error adding system update: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/feedback/updates/<int:update_id>", methods=["DELETE"])
@jwt_required(optional=True)
def delete_system_update(update_id):
    """Deletes a release note by ID."""
    try:
        current_updates = _get_system_updates_from_db()
        filtered = [u for u in current_updates if u.get("id") != update_id]
        _save_system_updates_to_db(filtered)
        return jsonify({"success": True, "message": "העדכון נמחק בהצלחה"}), 200
    except Exception as e:
        logger.error(f"Error deleting system update {update_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
