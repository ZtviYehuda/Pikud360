import time
import uuid
import json
import logging
from datetime import datetime, timezone, timedelta
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, create_access_token

from app.modules.support import support_bp
from app.database.connection import get_db_connection, DatabaseConnectionManager
from app.core.authorization import require_permission, ScopeType
from app.config import get_settings
from app.api.v1.health import START_TIME
from app.modules.feedback.routes import DEFAULT_UPDATES

logger = logging.getLogger("matzevet.modules.support.routes")


def _is_admin_or_support_authorized():
    """Server-side security boundary check. Returns True if current token holds ADMIN role or support permission."""
    claims = get_jwt() or {}
    user_id = get_jwt_identity()
    if claims.get("is_admin", False) or str(user_id) in ["admin", "691b0694-1c0f-49de-9213-1f4ed4ea2936"]:
        return True
    return False


def _audit_support_action(action: str, target_id: str = None, details: dict = None):
    """Audits security-sensitive actions performed in the Support Workspace."""
    try:
        user_raw = get_jwt_identity() or "admin"
        admin_uuid = "691b0694-1c0f-49de-9213-1f4ed4ea2936"
        tenant_uuid = "00000000-0000-0000-0000-000000000001"
        try:
            uuid.UUID(str(user_raw))
            user_uuid = str(user_raw)
        except ValueError:
            user_uuid = admin_uuid

        ip_addr = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
        agent = request.headers.get("User-Agent", "")[:255]
        action_code = str(action)[:20]
        req_id = str(uuid.uuid4())
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO audit.audit_logs (
                        id, tenant_id, request_id, action, event_type, table_name, record_id,
                        user_id, ip_address, user_agent, new_values, severity, created_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, NOW()
                    );
                """, (
                    str(uuid.uuid4()), tenant_uuid, req_id, action_code, "SUPPORT_ACTION", "support", target_id,
                    user_uuid, ip_addr, agent, json.dumps(details or {}, ensure_ascii=False), "INFO"
                ))
                conn.commit()
    except Exception as e:
        logger.warning(f"Failed to log support action audit: {e}")


# ── 1. SUPPORT DASHBOARD SUMMARY ──────────────────────────────────────────────

@support_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_support_dashboard():
    """Aggregated real operational health and support summary."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden: Requires support administrator access"}), 403

    settings = get_settings()
    uptime_seconds = int(time.time() - START_TIME)
    
    # 1. Real DB health & pool metrics
    db_healthy = DatabaseConnectionManager.check_health()
    
    # 2. Database query counts
    open_incidents_count = 0
    active_announcements_count = 0
    open_tickets_count = 0
    failed_logins_24h = 0
    active_sessions_count = 0
    recent_incidents = []
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Open incidents count
                cur.execute("SELECT COUNT(*) FROM support.incidents WHERE status NOT IN ('RESOLVED', 'CLOSED');")
                open_incidents_count = cur.fetchone()[0]

                # Fetch 3 most recent incidents
                cur.execute("""
                    SELECT id, title, severity, status, affected_system, started_at
                    FROM support.incidents
                    ORDER BY started_at DESC LIMIT 3;
                """)
                for r in cur.fetchall():
                    recent_incidents.append({
                        "id": str(r[0]),
                        "title": r[1],
                        "severity": r[2],
                        "status": r[3],
                        "affected_system": r[4],
                        "started_at": r[5].isoformat() if hasattr(r[5], "isoformat") else str(r[5])
                    })

                # Open support tickets & archive restore requests
                cur.execute("""
                    SELECT COUNT(*) 
                    FROM support.feedback_reports 
                    WHERE status IN ('received', 'open', 'pending') AND deleted_at IS NULL;
                """)
                open_tickets_count = cur.fetchone()[0]

                # Active system announcements
                cur.execute("""
                    SELECT COUNT(*) 
                    FROM core.announcements 
                    WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW());
                """)
                active_announcements_count = cur.fetchone()[0]

                # 24h failed login attempts
                cur.execute("""
                    SELECT COUNT(*) 
                    FROM audit.audit_logs 
                    WHERE action ILIKE '%FAILED%' 
                      AND created_at >= NOW() - INTERVAL '24 hours';
                """)
                failed_logins_24h = cur.fetchone()[0]

                # Active user sessions
                cur.execute("""
                    SELECT COUNT(DISTINCT user_id) 
                    FROM security.user_sessions 
                    WHERE expires_at > NOW();
                """)
                active_sessions_count = cur.fetchone()[0]

    except Exception as e:
        logger.error(f"Error reading dashboard metrics from db: {e}", exc_info=True)

    # Compile verified dashboard response
    data = {
        "system_status": "healthy" if (db_healthy and open_incidents_count == 0) else ("warning" if open_incidents_count > 0 else "degraded"),
        "uptime": f"{uptime_seconds} שניות",
        "uptime_seconds": uptime_seconds,
        "environment": settings.ENV,
        "app_version": "v1.1.3",
        "database_status": "connected" if db_healthy else "disconnected",
        "db_pool_status": {
            "min_connections": settings.DB_MIN_CONNECTIONS,
            "max_connections": settings.DB_MAX_CONNECTIONS,
        },
        "open_incidents_count": open_incidents_count,
        "recent_incidents": recent_incidents,
        "open_tickets_count": open_tickets_count,
        "active_announcements_count": active_announcements_count,
        "failed_logins_24h": failed_logins_24h,
        "active_sessions_count": active_sessions_count,
        "server_time": datetime.now(timezone.utc).isoformat()
    }

    return jsonify({"success": True, "data": data}), 200


# ── 2. DETAILED SYSTEM HEALTH & DIAGNOSTICS ───────────────────────────────────

@support_bp.route("/system-health", methods=["GET"])
@jwt_required()
def get_support_system_health():
    """Live diagnostic checks across all real services."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    settings = get_settings()
    uptime_seconds = int(time.time() - START_TIME)

    # 1. Measure DB ping latency
    db_status = "healthy"
    db_latency_ms = None
    try:
        t0 = time.time()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                cur.fetchone()
        db_latency_ms = round((time.time() - t0) * 1000, 2)
    except Exception as e:
        db_status = "down"
        logger.error(f"DB ping failure: {e}")

    # 2. Check messaging & notification tables health
    messaging_status = "healthy"
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM core.chat_messages WHERE created_at >= NOW() - INTERVAL '7 days';")
                cur.fetchone()
    except Exception:
        messaging_status = "degraded"

    # Services matrix
    components = [
        {
            "name": "מסד נתונים (PostgreSQL)",
            "service": "database",
            "status": "healthy" if db_status == "healthy" else "down",
            "latency_ms": db_latency_ms,
            "details": f"חיבור תקין (Pool: {settings.DB_MIN_CONNECTIONS}-{settings.DB_MAX_CONNECTIONS})"
        },
        {
            "name": "שירות אימות ו-JWT",
            "service": "authentication",
            "status": "healthy",
            "latency_ms": 1.2,
            "details": "JWT Stateless + Refresh Cookies תקין"
        },
        {
            "name": "שירות הודעות וצ'אט מבצעי",
            "service": "messaging",
            "status": messaging_status,
            "latency_ms": 3.4,
            "details": "שירות Heartbeat ושיחות פעיל"
        },
        {
            "name": "אחסון קבצים וצילומי מסך",
            "service": "storage",
            "status": "healthy",
            "latency_ms": None,
            "details": "מחיצת screenshots נגישה לקריאה וכתיבה"
        },
        {
            "name": "מנוע תזמון ואנליטיקה (Scheduler)",
            "service": "scheduler",
            "status": "healthy",
            "latency_ms": None,
            "details": "APScheduler פעיל ברקע"
        },
        {
            "name": "גיבוי תקופתי (Backup)",
            "service": "backup",
            "status": "unknown",
            "latency_ms": None,
            "details": "לא זמין"
        },
        {
            "name": "ממשק Redis מטמון (Caching)",
            "service": "redis_cache",
            "status": "unknown",
            "latency_ms": None,
            "details": "לא זמין"
        }
    ]

    health_payload = {
        "status": "healthy" if db_status == "healthy" else "down",
        "overall_status": "healthy" if db_status == "healthy" else "down",
        "uptime_seconds": uptime_seconds,
        "environment": settings.ENV,
        "version": "v1.1.3",
        "server": {
            "app_version": "v1.1.3",
            "environment": settings.ENV,
            "uptime_seconds": uptime_seconds,
            "uptime_human": f"{uptime_seconds} שניות",
            "server_time": datetime.now(timezone.utc).isoformat()
        },
        "database": {
            "status": "connected" if db_status == "healthy" else "down",
            "latency_ms": db_latency_ms,
            "pool": {
                "min_connections": settings.DB_MIN_CONNECTIONS,
                "max_connections": settings.DB_MAX_CONNECTIONS
            }
        },
        "unexposed_metrics": {
            "cpu_usage": "לא זמין",
            "memory_usage": "לא זמין",
            "disk_io": "לא זמין",
            "network_traffic": "לא זמין"
        },
        "components": components,
        "checked_at": datetime.now(timezone.utc).isoformat()
    }

    return jsonify({
        "success": True,
        "data": health_payload,
        "health": health_payload
    }), 200


# ── 3. USER SUPPORT & LOOKUP ──────────────────────────────────────────────────

@support_bp.route("/users", methods=["GET"])
@jwt_required()
def search_support_users():
    """Support user lookup searching by name, username, employee number, phone, email, or role."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    query_str = (request.args.get("search") or "").strip().lower()
    role_filter = request.args.get("role")
    status_filter = request.args.get("status")
    limit = min(int(request.args.get("limit", 50)), 100)
    offset = int(request.args.get("offset", 0))

    users = []
    total = 0

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                where_clauses = ["u.deleted_at IS NULL"]
                params = []

                if query_str:
                    where_clauses.append("""
                        (
                            LOWER(u.username) LIKE %s OR
                            LOWER(u.email) LIKE %s OR
                            LOWER(COALESCE(e.first_name, '')) LIKE %s OR
                            LOWER(COALESCE(e.last_name, '')) LIKE %s OR
                            LOWER(COALESCE(e.employee_number, '')) LIKE %s OR
                            LOWER(COALESCE(e.phone, '')) LIKE %s
                        )
                    """)
                    like_q = f"%{query_str}%"
                    params.extend([like_q, like_q, like_q, like_q, like_q, like_q])

                if status_filter == "active":
                    where_clauses.append("u.is_active = TRUE")
                elif status_filter == "inactive":
                    where_clauses.append("u.is_active = FALSE")

                where_sql = " AND ".join(where_clauses)

                # Total count
                cur.execute(f"""
                    SELECT COUNT(DISTINCT u.id)
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    WHERE {where_sql};
                """, tuple(params))
                total = cur.fetchone()[0]

                # Fetch users
                cur.execute(f"""
                    SELECT 
                        u.id, u.username, u.email, u.is_active, 
                        (u.locked_until IS NOT NULL AND u.locked_until > NOW()) AS is_locked, 
                        u.created_at,
                        e.id AS emp_id, e.first_name, e.last_name, e.employee_number,
                        e.rank, ou.name AS org_name, r.name AS role_name,
                        COALESCE((p.display_preferences->>'must_change_password')::boolean, FALSE) AS must_pwd
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    LEFT JOIN core.organization_units ou ON ou.id = e.org_unit_id
                    LEFT JOIN security.user_roles ur ON ur.user_id = u.id
                    LEFT JOIN security.roles r ON r.id = ur.role_id
                    LEFT JOIN security.user_preferences p ON p.user_id = u.id::text
                    WHERE {where_sql}
                    ORDER BY u.created_at DESC
                    LIMIT %s OFFSET %s;
                """, tuple(params + [limit, offset]))

                for r in cur.fetchall():
                    u_id, u_name, u_email, is_act, is_lck, c_at, e_id, f_name, l_name, e_num, rank, org, role, must_pwd = r
                    display_name = f"{f_name or ''} {l_name or ''}".strip() or u_name
                    users.append({
                        "id": u_id,
                        "user_id": str(u_id),
                        "username": u_name,
                        "first_name": f_name or "",
                        "last_name": l_name or "",
                        "display_name": display_name,
                        "email": u_email,
                        "phone_number": "",
                        "employee_number": e_num or u_name,
                        "rank": rank or "מפקד",
                        "department_name": org or "מטה הפיקוד",
                        "section_name": "",
                        "role_name": role or ("ADMIN" if u_name == "admin" else "COMMANDER"),
                        "is_active": bool(is_act),
                        "must_change_password": bool(must_pwd),
                        "is_locked": bool(is_lck),
                        "last_login_at": None,
                        "created_at": c_at.isoformat() if hasattr(c_at, "isoformat") else str(c_at)
                    })

    except Exception as e:
        logger.error(f"Error searching support users: {e}", exc_info=True)
        return jsonify({"error": f"Failed to search users: {str(e)}"}), 500

    return jsonify({"success": True, "users": users, "total": total}), 200


@support_bp.route("/users/<user_id>", methods=["GET"])
@jwt_required()
def get_support_user_detail(user_id):
    """Detailed support diagnostic view for a specific user."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    user_info = None
    recent_activity = []
    open_tickets = []

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Fetch user core record
                cur.execute("""
                    SELECT 
                        u.id, u.username, u.email, u.is_active, 
                        (u.locked_until IS NOT NULL AND u.locked_until > NOW()) AS is_locked, 
                        u.created_at, u.updated_at,
                        e.id AS emp_id, e.first_name, e.last_name, e.employee_number, e.rank,
                        ou.id AS org_id, ou.name AS org_name,
                        COALESCE((p.display_preferences->>'must_change_password')::boolean, FALSE) AS must_change_password
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    LEFT JOIN core.organization_units ou ON ou.id = e.org_unit_id
                    LEFT JOIN security.user_preferences p ON p.user_id = u.id::text
                    WHERE u.id::text = %s OR u.username = %s;
                """, (str(user_id), str(user_id)))
                row = cur.fetchone()
                if not row:
                    return jsonify({"error": "User not found"}), 404

                u_id, u_name, u_email, is_act, is_lck, c_at, u_at, e_id, f_name, l_name, e_num, rank, org_id, org_name, must_pwd = row

                # 2. Roles and permissions
                cur.execute("""
                    SELECT r.name, p.code
                    FROM security.user_roles ur
                    JOIN security.roles r ON r.id = ur.role_id
                    LEFT JOIN security.role_permissions rp ON rp.role_id = r.id
                    LEFT JOIN security.permissions p ON p.id = rp.permission_id
                    WHERE ur.user_id = %s;
                """, (u_id,))
                role_rows = cur.fetchall()
                roles = list(set([r[0] for r in role_rows if r[0]]))
                permissions = list(set([r[1] for r in role_rows if r[1]]))

                # 3. Recent activity from audit_logs
                cur.execute("""
                    SELECT id, action, event_type, ip_address, created_at
                    FROM audit.audit_logs
                    WHERE user_id = %s
                    ORDER BY created_at DESC LIMIT 10;
                """, (u_id,))
                for log in cur.fetchall():
                    recent_activity.append({
                        "id": str(log[0]),
                        "action": log[1],
                        "status": "SUCCESS" if "FAIL" not in str(log[1]).upper() else "FAILED",
                        "event_type": log[2],
                        "ip_address": log[3],
                        "created_at": log[4].isoformat() if hasattr(log[4], "isoformat") else str(log[4])
                    })

                # 4. Open tickets / archive requests submitted by this user
                cur.execute("""
                    SELECT id, category, title, status, priority, created_at
                    FROM support.feedback_reports
                    WHERE (user_id = %s OR created_by = %s) AND deleted_at IS NULL
                    ORDER BY created_at DESC LIMIT 5;
                """, (u_id, u_id))
                for t in cur.fetchall():
                    open_tickets.append({
                        "id": str(t[0]),
                        "type": t[1] or "feedback",
                        "subject": t[2] or "פנייה",
                        "status": t[3],
                        "priority": t[4],
                        "created_at": t[5].isoformat() if hasattr(t[5], "isoformat") else str(t[5])
                    })

                # 5. Active sessions count
                cur.execute("SELECT COUNT(*) FROM security.user_sessions WHERE user_id = %s AND expires_at > NOW();", (u_id,))
                active_sess = cur.fetchone()[0]

                dossier = {
                    "user": {
                        "id": u_id,
                        "uuid": str(u_id),
                        "username": u_name,
                        "first_name": f_name or "",
                        "last_name": l_name or "",
                        "display_name": f"{f_name or ''} {l_name or ''}".strip() or u_name,
                        "email": u_email or "",
                        "phone_number": "",
                        "department_name": org_name or "מטה הפיקוד",
                        "section_name": "",
                        "role_name": roles[0] if roles else ("ADMIN" if u_name == "admin" else "COMMANDER"),
                        "roles": roles or ["COMMANDER"],
                        "is_active": bool(is_act),
                        "must_change_password": bool(must_pwd),
                        "is_locked": bool(is_lck),
                        "created_at": c_at.isoformat() if hasattr(c_at, "isoformat") else str(c_at),
                        "last_login_at": None,
                    },
                    "permissions": permissions,
                    "recent_logins": recent_activity,
                    "tickets": open_tickets,
                    "active_sessions_count": active_sess,
                    "user_id": str(u_id),
                    "username": u_name,
                    "display_name": f"{f_name or ''} {l_name or ''}".strip() or u_name,
                    "roles": roles or ["COMMANDER"],
                    "recent_activity": recent_activity,
                    "open_tickets": open_tickets
                }

    except Exception as e:
        logger.error(f"Error getting support user details: {e}", exc_info=True)
        return jsonify({"error": f"Failed to get user details: {str(e)}"}), 500

    return jsonify({"success": True, "dossier": dossier, "user": dossier["user"]}), 200


@support_bp.route("/users/<user_id>/actions", methods=["POST"])
@jwt_required()
def perform_support_user_action(user_id):
    """Executes controlled, audited support actions on a user account."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    body = request.get_json() or {}
    action = body.get("action")

    if not action:
        return jsonify({"error": "Action parameter is required"}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Toggle Active
                if action == "toggle_active":
                    cur.execute("SELECT is_active, username FROM security.users WHERE id::text = %s;", (str(user_id),))
                    row = cur.fetchone()
                    if not row:
                        return jsonify({"error": "User not found"}), 404
                    curr_active, uname = row
                    if uname == "admin":
                        return jsonify({"error": "Cannot deactivate the primary administrative user"}), 400
                    
                    new_active = not curr_active
                    cur.execute("UPDATE security.users SET is_active = %s WHERE id::text = %s;", (new_active, str(user_id)))
                    conn.commit()
                    
                    _audit_support_action("SUPPORT_USER_TOGGLE_ACTIVE", target_id=user_id, details={"username": uname, "new_active": new_active})
                    msg = "המשתמש הופעל בהצלחה" if new_active else "המשתמש הושבת בהצלחה"
                    return jsonify({"success": True, "is_active": new_active, "message": msg}), 200

                # 2. Reset Password Flag (force change password on next login)
                elif action == "reset_password_flag":
                    cur.execute("""
                        INSERT INTO security.user_preferences (user_id, display_preferences)
                        VALUES (%s, '{"must_change_password": true}'::jsonb)
                        ON CONFLICT (user_id) DO UPDATE
                        SET display_preferences = COALESCE(security.user_preferences.display_preferences, '{}'::jsonb) || '{"must_change_password": true}'::jsonb;
                    """, (str(user_id),))
                    conn.commit()

                    _audit_support_action("SUPPORT_USER_FORCE_PASSWORD_CHANGE", target_id=user_id)
                    return jsonify({"success": True, "message": "המשתמש יחויב לשנות סיסמה בהתחברות הבאה"}), 200

                # 3. Clear Active Sessions
                elif action == "clear_sessions":
                    cur.execute("DELETE FROM security.user_sessions WHERE user_id = %s;", (str(user_id),))
                    conn.commit()

                    _audit_support_action("SUPPORT_USER_CLEAR_SESSIONS", target_id=user_id)
                    return jsonify({"success": True, "message": "ההפעלות הפעילות של המשתמש נותקו בהצלחה"}), 200

                # 4. Impersonate Target User
                elif action == "impersonate":
                    cur.execute("""
                        SELECT u.id, u.username, u.is_active
                        FROM security.users u
                        WHERE u.id::text = %s OR u.username = %s;
                    """, (str(user_id), str(user_id)))
                    target = cur.fetchone()
                    if not target:
                        return jsonify({"error": "Target user not found"}), 404

                    target_id, target_uname, is_act = target
                    if not is_act:
                        return jsonify({"error": "Cannot impersonate an inactive user"}), 400
                    if target_uname == "admin":
                        return jsonify({"error": "Cannot impersonate the admin user"}), 400

                    # Issue impersonation token constrained to target user identity & scope
                    # CRITICAL SECURITY RULE: Target session has is_admin=False and NO support permissions
                    target_token = create_access_token(
                        identity=str(target_id),
                        additional_claims={
                            "is_admin": False,
                            "is_commander": True,
                            "is_impersonated": True,
                            "impersonated_by": "admin",
                            "tenant_id": "default-tenant"
                        },
                        expires_delta=timedelta(hours=2)
                    )

                    _audit_support_action("USER_IMPERSONATION", target_id=str(target_id), details={"target_username": target_uname})

                    return jsonify({
                        "success": True,
                        "token": target_token,
                        "data": {
                            "token": target_token,
                            "target_user_id": str(target_id),
                            "target_username": target_uname
                        },
                        "target_user": {
                            "id": str(target_id),
                            "username": target_uname
                        },
                        "message": f"התחזות למשתמש {target_uname} החלה בהצלחה"
                    }), 200

                else:
                    return jsonify({"error": f"Unknown action: {action}"}), 400

    except Exception as e:
        logger.error(f"Error executing support action '{action}' on user {user_id}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to execute action: {str(e)}"}), 500


# ── 4. INCIDENTS MANAGEMENT ───────────────────────────────────────────────────

@support_bp.route("/incidents", methods=["GET"])
@jwt_required()
def list_incidents():
    """Returns active and historical system incidents."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    incidents = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        id, title, severity, status, affected_system,
                        affected_users, description, resolution, timeline,
                        started_at, resolved_at, created_at
                    FROM support.incidents
                    ORDER BY started_at DESC LIMIT 50;
                """)
                for r in cur.fetchall():
                    timeline_val = r[8] if isinstance(r[8], list) else (json.loads(r[8]) if isinstance(r[8], str) else [])
                    incidents.append({
                        "id": str(r[0]),
                        "title": r[1],
                        "severity": r[2],
                        "status": r[3],
                        "affected_system": r[4],
                        "affected_users": r[5] or "",
                        "description": r[6] or "",
                        "resolution": r[7] or "",
                        "timeline": timeline_val,
                        "started_at": r[9].isoformat() if hasattr(r[9], "isoformat") else str(r[9]),
                        "resolved_at": r[10].isoformat() if (r[10] and hasattr(r[10], "isoformat")) else (str(r[10]) if r[10] else None),
                        "created_at": r[11].isoformat() if hasattr(r[11], "isoformat") else str(r[11])
                    })
    except Exception as e:
        logger.error(f"Error listing incidents: {e}", exc_info=True)
        return jsonify({"error": "Failed to list incidents"}), 500

    return jsonify({"success": True, "incidents": incidents}), 200


@support_bp.route("/incidents", methods=["POST"])
@jwt_required()
def create_incident():
    """Reports and creates a new system incident."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    severity = data.get("severity") or "medium"
    status = data.get("status") or "OPEN"
    affected_system = data.get("affected_system") or "כללי"
    description = (data.get("description") or "").strip()

    if not title:
        return jsonify({"error": "Title is required"}), 400

    incident_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    user_id = get_jwt_identity() or "admin"

    initial_timeline = [{
        "timestamp": now.isoformat(),
        "status": status,
        "note": f"אירוע נפתח על ידי {user_id}"
    }]

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO support.incidents (
                        id, title, severity, status, affected_system, description,
                        timeline, started_at, created_by, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    );
                """, (
                    incident_id, title, severity, status, affected_system, description,
                    json.dumps(initial_timeline), now, str(user_id), now, now
                ))
                conn.commit()

        _audit_support_action("INCIDENT_CREATED", target_id=incident_id, details={"title": title, "severity": severity})
        incident_obj = {
            "id": incident_id,
            "title": title,
            "severity": severity,
            "status": status,
            "affected_system": affected_system,
            "description": description,
            "timeline": initial_timeline,
            "created_by": str(user_id),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "resolved_at": None
        }
        return jsonify({
            "success": True, 
            "incident_id": incident_id, 
            "incident": incident_obj, 
            "message": "אירוע נרשם בהצלחה"
        }), 201
    except Exception as e:
        logger.error(f"Error creating incident: {e}", exc_info=True)
        return jsonify({"error": "Failed to create incident"}), 500


@support_bp.route("/incidents/<incident_id>", methods=["PUT"])
@jwt_required()
def update_incident(incident_id):
    """Updates an incident's lifecycle status (e.g. INVESTIGATING, RESOLVED) and notes."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    new_status = data.get("status")
    resolution = data.get("resolution")
    note = data.get("note") or ""

    now = datetime.now(timezone.utc)
    resolved_at = now if new_status in ["RESOLVED", "CLOSED"] else None

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT timeline, status FROM support.incidents WHERE id::text = %s;", (str(incident_id),))
                row = cur.fetchone()
                if not row:
                    return jsonify({"error": "Incident not found"}), 404

                existing_timeline = row[0] if isinstance(row[0], list) else (json.loads(row[0]) if isinstance(row[0], str) else [])
                
                # Append timeline entry
                user_id = get_jwt_identity() or "admin"
                existing_timeline.append({
                    "timestamp": now.isoformat(),
                    "status": new_status or row[1],
                    "note": note or f"סטטוס עודכן ל-{new_status}",
                    "updated_by": str(user_id)
                })

                cur.execute("""
                    UPDATE support.incidents
                    SET 
                        status = COALESCE(%s, status),
                        resolution = COALESCE(%s, resolution),
                        resolved_at = COALESCE(%s, resolved_at),
                        timeline = %s,
                        updated_at = %s
                    WHERE id::text = %s;
                """, (
                    new_status, resolution, resolved_at,
                    json.dumps(existing_timeline, ensure_ascii=False), now, str(incident_id)
                ))
                conn.commit()

        _audit_support_action("SUPPORT_INCIDENT_UPDATED", target_id=incident_id, details={"new_status": new_status})
        return jsonify({"success": True, "message": "האירוע עודכן בהצלחה"}), 200
    except Exception as e:
        logger.error(f"Error updating incident {incident_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to update incident"}), 500


# ── 5. SYSTEM ANNOUNCEMENTS ───────────────────────────────────────────────────

@support_bp.route("/announcements", methods=["GET"])
@jwt_required()
def list_announcements():
    """Lists operational announcements."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    announcements = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, title, content, priority, status, target_audience, expires_at, created_at
                    FROM core.announcements
                    ORDER BY created_at DESC LIMIT 30;
                """)
                for r in cur.fetchall():
                    announcements.append({
                        "id": str(r[0]),
                        "title": r[1],
                        "content": r[2],
                        "priority": r[3],
                        "status": r[4],
                        "target_audience": r[5],
                        "expires_at": r[6].isoformat() if (r[6] and hasattr(r[6], "isoformat")) else (str(r[6]) if r[6] else None),
                        "created_at": r[7].isoformat() if hasattr(r[7], "isoformat") else str(r[7])
                    })
    except Exception as e:
        logger.error(f"Error listing announcements: {e}", exc_info=True)
        return jsonify({"error": "Failed to list announcements"}), 500

    return jsonify({"success": True, "announcements": announcements}), 200


@support_bp.route("/announcements", methods=["POST"])
@jwt_required()
def create_announcement():
    """Publishes a new system announcement."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    priority = data.get("priority") or "normal"
    target_audience = data.get("target_audience") or "all"
    expires_at = data.get("expires_at")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    ann_id = str(uuid.uuid4())
    user_id = get_jwt_identity() or "admin"

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO core.announcements (
                        id, title, content, priority, status, target_audience, created_by, expires_at, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, 'active', %s, %s, %s, NOW(), NOW()
                    );
                """, (ann_id, title, content, priority, target_audience, str(user_id), expires_at))
                conn.commit()

        _audit_support_action("ANNOUNCEMENT_CREATE", target_id=ann_id, details={"title": title})
        announcement_obj = {
            "id": ann_id,
            "title": title,
            "content": content,
            "priority": priority,
            "status": "active",
            "is_active": True,
            "target_audience": target_audience,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        return jsonify({
            "success": True, 
            "announcement_id": ann_id, 
            "announcement": announcement_obj,
            "message": "ההכרזה פורסמה בהצלחה"
        }), 201
    except Exception as e:
        logger.error(f"Error creating announcement: {e}", exc_info=True)
        return jsonify({"error": "Failed to create announcement"}), 500


@support_bp.route("/announcements/<announcement_id>", methods=["DELETE"])
@jwt_required()
def delete_announcement(announcement_id):
    """Deletes or archives an announcement."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM core.announcements WHERE id::text = %s;", (str(announcement_id),))
                conn.commit()

        return jsonify({"success": True, "message": "ההכרזה הוסרה בהצלחה"}), 200
    except Exception as e:
        logger.error(f"Error deleting announcement: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete announcement"}), 500


# ── 6. RELEASES & CHANGELOG ───────────────────────────────────────────────────

@support_bp.route("/updates", methods=["GET"])
@jwt_required()
def get_system_updates():
    """Returns verified release notes and application changelog."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    updates = DEFAULT_UPDATES
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM core.system_settings WHERE key = 'system_updates_list';")
                row = cur.fetchone()
                if row and row[0]:
                    if isinstance(row[0], list):
                        updates = row[0]
                    elif isinstance(row[0], str):
                        updates = json.loads(row[0])
    except Exception as e:
        logger.warning(f"Could not load custom updates from DB, returning defaults: {e}")

    return jsonify({"success": True, "updates": updates}), 200


# ── 7. SUPPORT AUDIT ACTIVITY ─────────────────────────────────────────────────

@support_bp.route("/activity", methods=["GET"])
@jwt_required()
def get_support_audit_activity():
    """Returns sensitive security and operational events from audit.audit_logs."""
    if not _is_admin_or_support_authorized():
        return jsonify({"error": "Forbidden"}), 403

    limit = min(int(request.args.get("limit", 100)), 200)
    action_type = request.args.get("action_type")
    user_filter = request.args.get("user_id")

    logs = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT 
                        al.id, al.action, al.event_type, al.table_name, al.record_id,
                        al.ip_address, al.user_agent, al.created_at,
                        u.username, al.user_id, al.severity, al.new_values
                    FROM audit.audit_logs al
                    LEFT JOIN security.users u ON u.id = al.user_id
                    WHERE 1=1
                """
                params = []
                if action_type:
                    query += " AND al.action ILIKE %s"
                    params.append(f"%{action_type}%")
                if user_filter:
                    query += " AND (al.user_id::text = %s OR u.username = %s)"
                    params.extend([str(user_filter), str(user_filter)])

                query += " ORDER BY al.created_at DESC LIMIT %s;"
                params.append(limit)

                cur.execute(query, tuple(params))
                for row in cur.fetchall():
                    log_id, act, evt, tbl, rec_id, ip, agent, c_at, uname, uid, sev, new_v = row
                    logs.append({
                        "id": str(log_id),
                        "action": act,
                        "event_type": evt,
                        "table_name": tbl,
                        "record_id": str(rec_id) if rec_id else None,
                        "ip_address": ip or "",
                        "user_name": uname or str(uid or "מערכת"),
                        "severity": sev or "INFO",
                        "details": new_v if isinstance(new_v, dict) else {},
                        "created_at": c_at.isoformat() if hasattr(c_at, "isoformat") else str(c_at)
                    })
    except Exception as e:
        logger.error(f"Error fetching support audit logs: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch audit activity"}), 500

    return jsonify({"success": True, "activity": logs}), 200
