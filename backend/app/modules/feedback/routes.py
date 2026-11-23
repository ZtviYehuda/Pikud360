import os
import uuid
import json
import logging
import re
from datetime import datetime, timezone, timedelta
import io
from flask import Blueprint, request, jsonify, send_from_directory, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename

from app.database.connection import get_db_connection
from app.core.cloud_storage import upload_to_gcs, download_from_gcs

logger = logging.getLogger("matzevet.modules.feedback.routes")

feedback_bp = Blueprint("feedback", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "screenshots")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif", "svg"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _ensure_tables_schema():
    """Ensures screenshot_url, context_page, archive dates and access grant tables exist."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    ALTER TABLE support.feedback_reports 
                    ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
                    ADD COLUMN IF NOT EXISTS context_page VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS start_date DATE,
                    ADD COLUMN IF NOT EXISTS end_date DATE,
                    ADD COLUMN IF NOT EXISTS access_duration VARCHAR(20),
                    ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE;

                    CREATE TABLE IF NOT EXISTS support.archive_access_grants (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id VARCHAR(100) NOT NULL,
                        ticket_id UUID,
                        start_date DATE,
                        end_date DATE,
                        duration VARCHAR(20) NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE,
                        granted_by VARCHAR(100),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                    CREATE INDEX IF NOT EXISTS idx_archive_grants_user ON support.archive_access_grants(user_id, expires_at);
                """)
                conn.commit()
    except Exception as e:
        logger.error(f"Error ensuring feedback_reports schema: {e}")


# Run schema check once on import
_ensure_tables_schema()


def _resolve_user_id(raw_id):
    """Resolves raw identifier (e.g. '1', 'admin', uuid, employee_number, employee_id) to a valid UUID in security.users."""
    default_admin_id = "691b0694-1c0f-49de-9213-1f4ed4ea2936"
    if not raw_id:
        return default_admin_id
    if str(raw_id).lower() in ["admin", "1", "admin-support"]:
        return default_admin_id

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Direct match on security.users.id
                cur.execute("SELECT id FROM security.users WHERE id::text = %s LIMIT 1;", (str(raw_id),))
                row = cur.fetchone()
                if row:
                    return str(row[0])

                # 2. Match on username
                cur.execute("SELECT id FROM security.users WHERE username = %s LIMIT 1;", (str(raw_id),))
                row = cur.fetchone()
                if row:
                    return str(row[0])

                # 3. Match via workforce.employees (by employee UUID or employee_number)
                cur.execute("""
                    SELECT u.id 
                    FROM workforce.employees e
                    JOIN security.users u ON u.id = e.user_id OR e.employee_number::text = u.username
                    WHERE e.id::text = %s OR e.employee_number = %s
                    LIMIT 1;
                """, (str(raw_id), str(raw_id)))
                row = cur.fetchone()
                if row:
                    return str(row[0])
    except Exception as e:
        logger.error(f"Error resolving user id {raw_id}: {e}")

    try:
        uuid.UUID(str(raw_id))
        return str(raw_id)
    except (ValueError, TypeError):
        pass

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
        content = file.read()

        # Save to GCS if configured
        upload_to_gcs(f"screenshots/{unique_name}", content, content_type=file.mimetype)

        # Also save locally as cache / fallback if directory is writable
        try:
            save_path = os.path.join(UPLOAD_FOLDER, unique_name)
            with open(save_path, "wb") as f:
                f.write(content)
        except Exception as local_err:
            logger.debug(f"Local screenshot cache skip: {local_err}")

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
    """Serves uploaded screenshot files directly from local cache or GCS."""
    local_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.isfile(local_path):
        return send_from_directory(UPLOAD_FOLDER, filename)

    # Check GCS if not found locally
    gcs_result = download_from_gcs(f"screenshots/{filename}")
    if gcs_result:
        content, content_type = gcs_result
        return send_file(io.BytesIO(content), mimetype=content_type, as_attachment=False)

    return jsonify({"error": "Screenshot not found"}), 404


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

@feedback_bp.route("/archive/restore-request", methods=["POST"])
@feedback_bp.route("/api/archive/restore-request", methods=["POST"])
@jwt_required(optional=True)
def create_archive_restore_request():
    """Handles requests to restore/view archived data (older than 3 months)."""
    try:
        raw_user_id = get_jwt_identity() or "admin"
        user_uuid = _resolve_user_id(raw_user_id)
        data = request.get_json() or {}

        start_date = data.get("start_date") or ""
        end_date = data.get("end_date") or start_date
        reason = (data.get("reason") or "").strip()

        if not reason:
            return jsonify({"error": "Reason is required"}), 400

        ticket_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        title = f"בקשת שחזור מהארכיון: {start_date}"
        description = f"בקשת שחזור נתוני ארכיון (מעל 3 חודשים).\nתאריך מבוקש: {start_date} - {end_date}\nסיבת הבקשה: {reason}"

        parsed_start = start_date if start_date else None
        parsed_end = end_date if end_date else parsed_start

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO support.feedback_reports (
                        id, user_id, category, title, description,
                        priority, status, created_at, updated_at,
                        created_by, updated_by, context_page,
                        start_date, end_date
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s
                    )
                    RETURNING id;
                """, (
                    ticket_id, user_uuid, "archive_restore", title, description,
                    "high", "received", now, now,
                    user_uuid, user_uuid, "archive",
                    parsed_start, parsed_end
                ))
                conn.commit()

        return jsonify({"success": True, "ticket_id": ticket_id, "message": "Archive restore request submitted successfully"}), 201
    except Exception as e:
        logger.error(f"Error creating archive restore request: {e}", exc_info=True)
        return jsonify({"error": f"Failed to submit restore request: {str(e)}"}), 500



@feedback_bp.route("/feedback/my", methods=["GET"])
@jwt_required(optional=True)
def get_my_feedback():
    """Returns tickets submitted by the current user or targeted ticket."""
    try:
        raw_user_id = get_jwt_identity() or "admin"
        claims = get_jwt() or {}
        is_impersonated = bool(claims.get("is_impersonated"))
        impersonated_by = claims.get("impersonated_by", "admin")
        is_admin = bool(claims.get("is_admin")) or str(raw_user_id).lower() in ["admin", "1", "691b0694-1c0f-49de-9213-1f4ed4ea2936"]

        target_ticket_id = request.args.get("ticket_id") or request.args.get("id")

        from app.modules.notifications.routes import _get_aliases
        user_aliases = set(_get_aliases(raw_user_id))
        user_uuid = _resolve_user_id(raw_user_id)
        if user_uuid:
            user_aliases.add(str(user_uuid).lower())

        if is_impersonated or is_admin:
            user_aliases.update(_get_aliases(impersonated_by))
            user_aliases.update(["admin", "1", "691b0694-1c0f-49de-9213-1f4ed4ea2936"])

        user_aliases_tuple = tuple(user_aliases)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        f.id, f.category, f.title, f.description, f.priority,
                        f.status, f.resolution_comment, f.created_at, f.updated_at,
                        f.screenshot_url, f.context_page,
                        f.start_date::text, f.end_date::text, f.access_duration,
                        f.access_expires_at::text
                    FROM support.feedback_reports f
                    WHERE f.deleted_at IS NULL
                      AND (
                        f.user_id::text IN %s 
                        OR f.created_by::text IN %s
                        OR (%s IS NOT NULL AND f.id::text = %s)
                      )
                    ORDER BY f.created_at DESC;
                """, (user_aliases_tuple, user_aliases_tuple, target_ticket_id, target_ticket_id))
                rows = cur.fetchall()

                # If no tickets found for impersonated user/admin, provide recent tickets fallback
                if not rows and (is_impersonated or is_admin):
                    cur.execute("""
                        SELECT 
                            f.id, f.category, f.title, f.description, f.priority,
                            f.status, f.resolution_comment, f.created_at, f.updated_at,
                            f.screenshot_url, f.context_page,
                            f.start_date::text, f.end_date::text, f.access_duration,
                            f.access_expires_at::text
                        FROM support.feedback_reports f
                        WHERE f.deleted_at IS NULL
                        ORDER BY f.created_at DESC
                        LIMIT 15;
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
                        "admin_reply": r[6] or "",
                        "created_at": r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7]),
                        "updated_at": r[8].isoformat() if hasattr(r[8], "isoformat") else str(r[8]),
                        "screenshot_url": r[9] or "",
                        "context_page": r[10] or "",
                        "start_date": r[11] or "",
                        "end_date": r[12] or "",
                        "access_duration": r[13] or "",
                        "access_expires_at": r[14] or ""
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
                        COALESCE(ou.name, 'ללא מחלקה') AS department_name,
                        f.start_date::text, f.end_date::text, f.access_duration,
                        f.access_expires_at::text,
                        f.user_id::text
                    FROM support.feedback_reports f
                    LEFT JOIN security.users u ON u.id = f.user_id
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    LEFT JOIN core.organization_units ou ON ou.id = e.org_unit_id
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
                        "admin_reply": r[6] or "",
                        "created_at": r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7]),
                        "updated_at": r[8].isoformat() if hasattr(r[8], "isoformat") else str(r[8]),
                        "screenshot_url": r[9] or "",
                        "context_page": r[10] or "",
                        "sender_name": f"{r[11]} {r[12]}".strip(),
                        "department_name": r[13] or "",
                        "start_date": r[14] or "",
                        "end_date": r[15] or "",
                        "access_duration": r[16] or "",
                        "access_expires_at": r[17] or "",
                        "user_id": r[18] or ""
                    })

                return jsonify(tickets), 200
    except Exception as e:
        logger.error(f"Error fetching all feedback: {e}", exc_info=True)
        return jsonify([]), 200


@feedback_bp.route("/feedback/admin/update/<ticket_id>", methods=["PUT"])
@feedback_bp.route("/support/tickets/<ticket_id>/reply", methods=["PUT"])
@jwt_required(optional=True)
def update_feedback_ticket(ticket_id):
    """Updates status, priority, or reply for a ticket, and grants archive access if approved."""
    try:
        raw_admin_id = get_jwt_identity() or "admin"
        data = request.get_json() or {}
        new_status = data.get("status")
        resolution_comment = (
            data.get("resolution_comment")
            or data.get("reply")
            or data.get("response")
            or data.get("admin_reply")
        )
        priority = data.get("priority")
        access_duration = data.get("access_duration") or "24h"

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Fetch current ticket info
                cur.execute("""
                    SELECT id, status, category, title, description, user_id, start_date::text, end_date::text
                    FROM support.feedback_reports
                    WHERE id = %s;
                """, (str(ticket_id),))
                curr_ticket = cur.fetchone()
                if not curr_ticket:
                    return jsonify({"error": "Ticket not found"}), 404

                t_id, _, t_category, t_title, t_desc, t_user_id, t_start_date, t_end_date = curr_ticket

                is_archive = (
                    t_category == "archive_restore"
                    or "שחזור" in (t_title or "")
                    or "שחזור" in (t_desc or "")
                    or "ארכיון" in (t_title or "")
                )

                now = datetime.now(timezone.utc)
                expires_at = None

                if new_status == "approved" and is_archive:
                    if access_duration == "24h":
                        expires_at = now + timedelta(hours=24)
                    elif access_duration == "7d":
                        expires_at = now + timedelta(days=7)
                    elif access_duration == "30d":
                        expires_at = now + timedelta(days=30)
                    else:  # permanent
                        expires_at = now + timedelta(days=36500)

                    # Determine start/end date
                    grant_start = t_start_date
                    grant_end = t_end_date or grant_start
                    if not grant_start:
                        m = re.findall(r"\b(\d{4}-\d{2}-\d{2})\b", (t_title or "") + " " + (t_desc or ""))
                        if m:
                            grant_start = m[0]
                            grant_end = m[-1]

                    from app.modules.notifications.routes import _get_aliases
                    user_aliases = set(_get_aliases(t_user_id))
                    if t_user_id:
                        user_aliases.add(str(t_user_id).lower())

                    # Insert grant for user and all aliases
                    for alias in user_aliases:
                        cur.execute("""
                            INSERT INTO support.archive_access_grants (
                                user_id, ticket_id, start_date, end_date, duration, expires_at, granted_by, created_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
                        """, (
                            str(alias), str(t_id), grant_start, grant_end,
                            access_duration, expires_at, str(raw_admin_id)
                        ))

                # Update the ticket
                cur.execute("""
                    UPDATE support.feedback_reports
                    SET 
                        status = COALESCE(%s, status),
                        resolution_comment = COALESCE(%s, resolution_comment),
                        priority = COALESCE(%s, priority),
                        access_duration = CASE WHEN %s::text IS NOT NULL THEN %s ELSE access_duration END,
                        access_expires_at = CASE WHEN %s::timestamptz IS NOT NULL THEN %s ELSE access_expires_at END,
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING id, status, resolution_comment, user_id, title;
                """, (
                    new_status, resolution_comment, priority,
                    access_duration if (new_status == "approved" and is_archive) else None,
                    access_duration if (new_status == "approved" and is_archive) else None,
                    expires_at, expires_at,
                    str(ticket_id)
                ))
                row = cur.fetchone()

                # If there is a reply and a recipient user, also dispatch a chat message from support
                if resolution_comment and t_user_id and str(t_user_id) != "691b0694-1c0f-49de-9213-1f4ed4ea2936":
                    try:
                        if new_status == "approved":
                            chat_title = f"בקשתך אושרה: {t_title or 'שחזור ארכיון'}"
                        elif new_status == "rejected":
                            chat_title = f"בקשתך נדחתה: {t_title or 'פנייה'}"
                        elif new_status in ("done", "resolved"):
                            chat_title = f"פנייתך טופלה: {t_title or 'פניית תמיכה'}"
                        else:
                            chat_title = f"מענה לפנייה: {t_title or 'פניית תמיכה'}"

                        cur.execute("""
                            INSERT INTO core.chat_messages (
                                tenant_id, sender_id, sender_first, sender_last, recipient_id, title, description, created_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
                        """, (
                            "default-tenant", "691b0694-1c0f-49de-9213-1f4ed4ea2936", "צוות", "תמיכה",
                            str(t_user_id), chat_title, str(resolution_comment).strip()
                        ))
                    except Exception as err:
                        logger.warning(f"Could not mirror ticket reply into chat_messages: {err}")

                conn.commit()

        return jsonify({"success": True, "message": "Ticket updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error updating ticket {ticket_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@feedback_bp.route("/archive/user-access", methods=["GET"])
@feedback_bp.route("/api/archive/user-access", methods=["GET"])
@jwt_required(optional=True)
def get_user_archive_access():
    """Returns active archive access grants for the authenticated user."""
    try:
        raw_user_id = get_jwt_identity() or "admin"
        claims = get_jwt() or {}
        is_admin = bool(claims.get("is_admin")) or str(raw_user_id).lower() in ["admin", "1", "691b0694-1c0f-49de-9213-1f4ed4ea2936"]

        if is_admin:
            return jsonify({
                "is_admin": True,
                "has_access": True,
                "grants": [{
                    "all_dates": True,
                    "duration": "permanent",
                    "is_valid": True,
                    "expires_at": None
                }]
            }), 200

        from app.modules.notifications.routes import _get_aliases
        user_aliases = set(_get_aliases(raw_user_id))
        user_uuid = _resolve_user_id(raw_user_id)
        if user_uuid:
            user_aliases.add(str(user_uuid).lower())
        user_aliases_tuple = tuple(user_aliases)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, start_date::text, end_date::text, duration, expires_at::text, created_at::text
                    FROM support.archive_access_grants
                    WHERE user_id IN %s AND (expires_at IS NULL OR expires_at > NOW())
                    ORDER BY created_at DESC;
                """, (user_aliases_tuple,))
                rows = cur.fetchall()

                grants = []
                for r in rows:
                    grants.append({
                        "id": str(r[0]),
                        "start_date": r[1],
                        "end_date": r[2],
                        "duration": r[3] or "24h",
                        "expires_at": r[4],
                        "is_valid": True
                    })

                return jsonify({
                    "is_admin": False,
                    "has_access": len(grants) > 0,
                    "grants": grants
                }), 200
    except Exception as e:
        logger.error(f"Error checking user archive access: {e}", exc_info=True)
        return jsonify({"is_admin": False, "has_access": False, "grants": []}), 200


# ── System Updates / Release Notes Endpoints ─────────────────────────────────

DEFAULT_UPDATES = [
    {
        "id": 1,
        "version": "v1.1.3",
        "release_date": "2026-09-14",
        "features": [
            "מרכז משוב והצעות חדש ומעוצב לדיווח מהיר על באגים והצעות ייעול ישירות מהמערכת",
            "תצוגת ימי הולדת משודרגת עם אפשרות הורדה נקייה ומסודרת של כרטיסי ברכה",
            "כפתור איפוס מהיר ומדויק של מסננים בטבלת העובדים",
            "שדרוג סרגל הדוחות ומעבר נוח בין יומי, שבועי, חודשי וטווח תאריכים",
            "שיפורי יציבות, ביצועים והתאמת עיצוב אחידה בכלל המודאלים"
        ]
    },
    {
        "id": 2,
        "version": "v1.1.2",
        "release_date": "2026-09-02",
        "features": [
            "עיצוב חדש ומודרני לטופס הגשת בקשות ניוד ושיבוץ",
            "תמיכה בהעלאת תמונות וצילומי מסך במוקד הפניות והמשוב",
            "שיפור ביצועי מערכת וסנכרון נתונים שוטף"
        ]
    },
    {
        "id": 3,
        "version": "v1.1.0",
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
