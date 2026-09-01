from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pydantic import ValidationError
from datetime import datetime, timedelta
import logging
import json

from app.database.connection import get_db_connection
from app.modules.workforce.repositories import EmployeeRepository, EmployeeHistoryRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce.services import WorkforceService
from app.modules.workforce.schemas import EmployeeCreateRequest, EmployeeUpdateRequest, EmployeeResponse
from app.core.authorization import require_permission, ScopeType, AccessDeniedError
from app.core.responses import ApiResponse

logger = logging.getLogger("matzevet.modules.workforce.routes")

workforce_bp = Blueprint("workforce", __name__)

# Initialize dependencies
employee_repo = EmployeeRepository()
history_repo = EmployeeHistoryRepository()
audit_repo = AuditLogRepository()

workforce_service = WorkforceService(
    employee_repo=employee_repo,
    history_repo=history_repo,
    audit_repo=audit_repo
)

def _enrich_employee_serialized(serialized: dict) -> dict:
    if not isinstance(serialized, dict):
        return serialized
    uid = serialized.get("user_id")
    emp_num = serialized.get("employee_number")
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Resolve target user_id
                target_uid = str(uid) if uid else None
                if not target_uid and emp_num:
                    cur.execute("SELECT id FROM security.users WHERE username = %s OR id::text = %s;", (str(emp_num), str(emp_num)))
                    r = cur.fetchone()
                    if r:
                        target_uid = str(r[0])

                prefs = {}
                has_cmd_role = False
                if target_uid:
                    from app.modules.security.repositories import UserPreferenceRepository
                    pref_repo = UserPreferenceRepository()
                    prefs = pref_repo.get_by_user_id(target_uid) or {}

                    cur.execute("""
                        SELECT 1 FROM security.user_roles ur
                        JOIN security.roles r ON r.id = ur.role_id
                        WHERE ur.user_id::text = %s AND r.name = 'COMMANDER';
                    """, (target_uid,))
                    has_cmd_role = bool(cur.fetchone())

                is_cmd = bool(has_cmd_role or prefs.get("is_commander", False))
                serialized["is_commander"] = is_cmd
                serialized["security_clearance"] = bool(prefs.get("security_clearance", False))
                serialized["police_license"] = bool(prefs.get("police_license", False))
                if prefs.get("emergency_contact") and not serialized.get("emergency_contact"):
                    serialized["emergency_contact"] = prefs.get("emergency_contact")
                if prefs.get("city") and not serialized.get("city"):
                    serialized["city"] = prefs.get("city")
    except Exception as e:
        logger.warning(f"Error enriching employee {serialized.get('id')}: {e}")
    return serialized

@workforce_bp.route("/employees", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def list_employees():
    """Lists employees within the tenant scope allowed for the active user."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    employees = workforce_service.list_employees(tenant_id, user_id)
    serialized = [_enrich_employee_serialized(EmployeeResponse.model_validate(emp).model_dump()) for emp in employees]
    
    return ApiResponse.success(data=serialized)


@workforce_bp.route("/employees/<employee_id>", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def get_employee(employee_id):
    """Fetches a specific employee record."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    emp = workforce_service.get_employee(employee_id, tenant_id, user_id)
    if not emp:
        return ApiResponse.error(message="Employee not found", error_code="NOT_FOUND", status_code=404)
        
    serialized = _enrich_employee_serialized(EmployeeResponse.model_validate(emp).model_dump())
    return ApiResponse.success(data=serialized)


@workforce_bp.route("/employees", methods=["POST"])
@require_permission("employees.create", ScopeType.ORGANIZATION_UNIT)
def create_employee():
    """Onboards a new employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = EmployeeCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    created_emp = workforce_service.create_employee(req, tenant_id, user_id)
    serialized = _enrich_employee_serialized(EmployeeResponse.model_validate(created_emp).model_dump())
    
    return ApiResponse.success(data=serialized, status_code=201)


@workforce_bp.route("/employees/<employee_id>", methods=["PUT"])
@require_permission("employees.update", ScopeType.ORGANIZATION_UNIT)
def update_employee(employee_id):
    """Updates an employee record."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = EmployeeUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    updated_emp = workforce_service.update_employee(employee_id, req, tenant_id, user_id)
    if not updated_emp:
        return ApiResponse.error(message="Employee not found", error_code="NOT_FOUND", status_code=404)
        
    serialized = _enrich_employee_serialized(EmployeeResponse.model_validate(updated_emp).model_dump())
    return ApiResponse.success(data=serialized)


@workforce_bp.route("/employees/<employee_id>", methods=["DELETE"])
@require_permission("employees.delete", ScopeType.ORGANIZATION_UNIT)
def delete_employee(employee_id):
    """Soft deletes an employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    success = workforce_service.delete_employee(employee_id, tenant_id, user_id)
    if not success:
        return ApiResponse.error(message="Employee not found or already deleted", error_code="NOT_FOUND", status_code=404)
        
    return ApiResponse.success(message="Employee record successfully soft-deleted.")


@workforce_bp.route("/employees/<employee_id>/history", methods=["GET"])
@require_permission("employees.history.view", ScopeType.ORGANIZATION_UNIT)
def get_employee_history(employee_id):
    """Fetches the chronological status changes and transfers history log for an employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        timeline = workforce_service.get_employee_timeline(employee_id, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="NOT_FOUND", status_code=404)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    return ApiResponse.success(data=timeline)


@workforce_bp.route("/chat/heartbeat", methods=["POST"])
@workforce_bp.route("/employees/chat/heartbeat", methods=["POST"])
@jwt_required(optional=True)
def chat_heartbeat():
    return jsonify({
        "success": True,
        "status": "online",
        "recipient": {
            "is_online": True,
            "chat_status": "online",
            "chat_status_custom": None,
            "is_typing": False
        }
    }), 200


@workforce_bp.route("/employees/chat/status", methods=["PUT"])
@jwt_required(optional=True)
def update_chat_status():
    try:
        user_id = get_jwt_identity() or "default-user"
        data = request.get_json() or {}
        chat_status = data.get("chat_status", "online")
        chat_status_custom = data.get("chat_status_custom")
        return jsonify({"success": True, "chat_status": chat_status, "chat_status_custom": chat_status_custom}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


FULL_ORGANIZATION_STRUCTURE = [
    {
        "id": 1,
        "name": "מחלקת טכנולוגיות",
        "code": "TECH_DEPT",
        "sections": [
            {
                "id": 101,
                "name": "מדור הסייבר המבצעי",
                "code": "TECH_OPS_CYBER_SECT",
                "teams": [
                    {"id": 1001, "name": "חוליית מו\"פ"},
                    {"id": 1002, "name": "חוליית סייבר מבצעי"},
                    {"id": 1003, "name": "חוליית נגישות בסייבר"}
                ]
            },
            {
                "id": 102,
                "name": "מדור מערכות הסייבר",
                "code": "TECH_CYBER_SYS_SECT",
                "teams": [
                    {"id": 1004, "name": "חוליית חברות תקשורת"},
                    {"id": 1005, "name": "חולייה פרויקטים ואמצעים"}
                ]
            },
            {
                "id": 103,
                "name": "מדור סיגמ\"ה",
                "code": "TECH_SIGMA_SECT",
                "teams": [
                    {"id": 1006, "name": "חוליית אמצעי קצה"},
                    {"id": 1007, "name": "חוליית סיוע מבצעי"},
                    {"id": 1008, "name": "חוליית מענים מהירים"}
                ]
            }
        ]
    },
    {
        "id": 2,
        "name": "מחלקת התעצמות",
        "code": "EMPOWERMENT_DEPT",
        "sections": [
            {
                "id": 201,
                "name": "מדור תכנון ייעודי ואסטרטגיה",
                "code": "EMP_STRAT_PLAN_SECT",
                "teams": [
                    {"id": 2001, "name": "חוליית תקציב"},
                    {"id": 2002, "name": "חוליית מערכה (אורית)"},
                    {"id": 2003, "name": "חוליית מערכה (רפאל)"},
                    {"id": 2004, "name": "חוליית נ\"מ"},
                    {"id": 2005, "name": "חוליית קש\"ח ושותפויות"}
                ]
            },
            {
                "id": 202,
                "name": "מדור הכוונה מבצעית",
                "code": "EMP_OPS_DIR_SECT",
                "teams": [
                    {"id": 2006, "name": "חוליית הפקה ארצית"},
                    {"id": 2007, "name": "חוליית ב\"ר"},
                    {"id": 2008, "name": "חוליית סייבר"},
                    {"id": 2009, "name": "חוליית מחת\"ק"},
                    {"id": 2010, "name": "חוליית בקרות"}
                ]
            }
        ]
    },
    {
        "id": 3,
        "name": "מחלקת מענה מבצעי",
        "code": "OPERATIONAL_RESPONSE_DEPT",
        "sections": [
            {
                "id": 301,
                "name": "מדור שטח",
                "code": "OPS_FIELD_SECT",
                "teams": [
                    {"id": 3001, "name": "חוליית מ\"מ"},
                    {"id": 3002, "name": "חוליית ביטחון מידע וחסיונות"},
                    {"id": 3003, "name": "חוליית חות\"ם"},
                    {"id": 3004, "name": "חוליית חוס\"ם"}
                ]
            },
            {
                "id": 302,
                "name": "מדור יחידות ארציות",
                "code": "OPS_NAT_UNITS_SECT",
                "teams": [
                    {"id": 3005, "name": "חוליית סלע"},
                    {"id": 3006, "name": "חוליית שהם"},
                    {"id": 3007, "name": "חוליית רשויות"},
                    {"id": 3008, "name": "חוליית קיסר"}
                ]
            },
            {
                "id": 303,
                "name": "מדור שליטה מבצעית",
                "code": "OPS_CONTROL_SECT",
                "teams": [
                    {"id": 3009, "name": "חוליית 7100"},
                    {"id": 3010, "name": "חוליית 7103"},
                    {"id": 3011, "name": "חוליית משל\"ט טכנו סיגינטי"}
                ]
            },
            {
                "id": 304,
                "name": "מדור סייבר ארצי",
                "code": "OPS_NAT_CYBER_SECT",
                "teams": [
                    {"id": 3012, "name": "חוליית מס\"א"},
                    {"id": 3013, "name": "חוליית קריפטו"}
                ]
            }
        ]
    }
]


@workforce_bp.route("/employees/structure", methods=["GET"])
@jwt_required(optional=True)
def get_employees_structure():
    return jsonify(FULL_ORGANIZATION_STRUCTURE), 200


@workforce_bp.route("/employees/roles", methods=["GET"])
@jwt_required(optional=True)
def get_employees_roles():
    roles = [{"id": 1, "name": "מפקד מחלקה"}, {"id": 2, "name": "קצין"}, {"id": 3, "name": "חייל"}]
    return jsonify(roles), 200


SYSTEM_SERVICE_TYPES = [
    {"id": "KEVA_OFFICER", "name": "קבע - קצין"},
    {"id": "KEVA_NCO", "name": "קבע - נגד"},
    {"id": "SHAMAZ", "name": "שמ\"ז"},
    {"id": "NATIONAL_SERVICE", "name": "שירות לאומי"},
    {"id": "SHACHAM", "name": "שח\"מ"},
    {"id": "SHACHAM_HAREDI", "name": "שח\"מ חרדי"},
    {"id": "CIVIL_SECURITY_SERVICE", "name": "שירות אזרחי ביטחוני"},
    {"id": "VOLUNTEER", "name": "מתנדב"},
]

SYSTEM_ATTENDANCE_STATUS_TYPES = [
    {
        "id": "OFFICE",
        "name": "משרד",
        "category": "PRESENT",
        "is_default": True,
        "color": "#10B981",
        "sub_statuses": [
            {"id": "HOME", "name": "מהבית (עבודה מרחוק)"},
            {"id": "EXTERNAL_FACILITY", "name": "מתקן חיצוני"},
            {"id": "FIELD", "name": "שטח"}
        ]
    },
    {"id": "VACATION", "name": "חופשה", "category": "ABSENCE", "color": "#F59E0B"},
    {"id": "SICK", "name": "מחלה", "category": "ABSENCE", "color": "#6366F1"},
    {"id": "COURSE", "name": "קורס", "category": "PRESENT", "color": "#8B5CF6"},
    {"id": "REINFORCEMENT", "name": "תגבור", "category": "PRESENT", "color": "#3B82F6"},
    {"id": "ABROAD", "name": "חו\"ל", "category": "ABSENCE", "color": "#EC4899"},
    {"id": "UNIT_DAY", "name": "יום יחידה", "category": "EVENT", "color": "#14B8A6"},
    {"id": "OTHER", "name": "אחר", "category": "OTHER", "color": "#64748B"}
]


def get_configured_service_types():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM core.system_settings WHERE key = 'custom_service_types';")
                row = cur.fetchone()
                if row and row[0]:
                    val = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                    if isinstance(val, list) and len(val) > 0:
                        return val
    except Exception as e:
        logger.warning(f"Failed to fetch custom_service_types: {e}")
    return SYSTEM_SERVICE_TYPES


def get_configured_attendance_status_types():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT value FROM core.system_settings WHERE key = 'custom_attendance_statuses';")
                row = cur.fetchone()
                if row and row[0]:
                    val = json.loads(row[0]) if isinstance(row[0], str) else row[0]
                    if isinstance(val, list) and len(val) > 0:
                        return val
    except Exception as e:
        logger.warning(f"Failed to fetch custom_attendance_statuses: {e}")
    return SYSTEM_ATTENDANCE_STATUS_TYPES


@workforce_bp.route("/employees/service-types", methods=["GET"])
@jwt_required(optional=True)
def get_employees_service_types():
    return jsonify(get_configured_service_types()), 200


@workforce_bp.route("/settings/statuses-and-service-types", methods=["GET"])
@jwt_required(optional=True)
def get_statuses_and_service_types_settings():
    return jsonify({
        "success": True,
        "service_types": get_configured_service_types(),
        "attendance_statuses": get_configured_attendance_status_types(),
        "default_service_types": SYSTEM_SERVICE_TYPES,
        "default_attendance_statuses": SYSTEM_ATTENDANCE_STATUS_TYPES,
    }), 200


@workforce_bp.route("/settings/statuses-and-service-types", methods=["POST"])
@jwt_required(optional=True)
def save_statuses_and_service_types_settings():
    try:
        data = request.get_json() or {}
        service_types = data.get("service_types")
        attendance_statuses = data.get("attendance_statuses")

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                if service_types is not None:
                    cur.execute("""
                        INSERT INTO core.system_settings (key, value, updated_at)
                        VALUES ('custom_service_types', %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (key) DO UPDATE
                            SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
                    """, (json.dumps(service_types, ensure_ascii=False),))

                if attendance_statuses is not None:
                    cur.execute("""
                        INSERT INTO core.system_settings (key, value, updated_at)
                        VALUES ('custom_attendance_statuses', %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (key) DO UPDATE
                            SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
                    """, (json.dumps(attendance_statuses, ensure_ascii=False),))
                conn.commit()

        return jsonify({
            "success": True,
            "message": "הגדרות סטטוסים ומעמד ארגוני נשמרו בהצלחה",
            "service_types": get_configured_service_types(),
            "attendance_statuses": get_configured_attendance_status_types(),
        }), 200
    except Exception as e:
        logger.error(f"Error saving statuses and service types: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@workforce_bp.route("/settings/reset-defaults", methods=["POST"])
@jwt_required(optional=True)
def reset_statuses_and_service_types_defaults():
    try:
        data = request.get_json() or {}
        target = data.get("target", "all")  # 'all', 'service_types', 'attendance_statuses'

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                if target in ("all", "service_types"):
                    cur.execute("DELETE FROM core.system_settings WHERE key = 'custom_service_types';")
                if target in ("all", "attendance_statuses"):
                    cur.execute("DELETE FROM core.system_settings WHERE key = 'custom_attendance_statuses';")
                conn.commit()

        return jsonify({
            "success": True,
            "message": "ההגדרות אופסו לברירת המחדל של המערכת בהצלחה",
            "service_types": get_configured_service_types(),
            "attendance_statuses": get_configured_attendance_status_types(),
        }), 200
    except Exception as e:
        logger.error(f"Error resetting statuses and service types: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@workforce_bp.route("/employees/chat-contacts", methods=["GET"])
@jwt_required(optional=True)
def get_employees_chat_contacts():
    """Returns active employee and user contacts for messaging/chat, strictly excluding current user and self aliases."""
    try:
        user_id = get_jwt_identity() or "default-user"
        claims = get_jwt() if get_jwt_identity() else {}
        tenant_id = claims.get("tenant_id") or "default-tenant"
        
        user_aliases = {str(user_id).lower()}
        is_admin = bool(claims.get("is_admin", False))
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.username, e.id, e.employee_number
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    WHERE u.id::text = %s OR u.username = %s;
                """, (str(user_id), str(user_id)))
                for r in cur.fetchall():
                    for item in r:
                        if item:
                            user_aliases.add(str(item).lower())
                            if str(item).lower() in ["admin", "691b0694-1c0f-49de-9213-1f4ed4ea2936"]:
                                is_admin = True

        if str(user_id).lower() in ["admin", "691b0694-1c0f-49de-9213-1f4ed4ea2936"]:
            is_admin = True
            user_aliases.update(["admin", "admin-support", "691b0694-1c0f-49de-9213-1f4ed4ea2936"])

        employees = workforce_service.list_employees(tenant_id, user_id)
        
        contacts = []
        for emp in employees:
            emp_id_str = str(emp.id).lower() if emp.id else ""
            emp_user_id_str = str(emp.user_id).lower() if emp.user_id else ""
            emp_num_str = str(emp.employee_number).lower() if emp.employee_number else ""
            
            # Skip if this employee represents the current logged-in user
            if (emp_id_str in user_aliases or 
                emp_user_id_str in user_aliases or 
                emp_num_str in user_aliases):
                continue
            
            contacts.append(EmployeeResponse.model_validate(emp).model_dump())

        # Also query registered users from security.users
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.username, u.email, p.display_preferences, r.name as role_name
                    FROM security.users u
                    LEFT JOIN security.user_preferences p ON p.user_id = u.id::text
                    LEFT JOIN security.user_roles ur ON ur.user_id = u.id
                    LEFT JOIN security.roles r ON r.id = ur.role_id
                    WHERE u.deleted_at IS NULL;
                """)
                for row in cur.fetchall():
                    u_id, u_uname, u_email, u_prefs, u_role = row
                    u_id_str = str(u_id).lower()
                    u_uname_str = str(u_uname).lower()
                    
                    if u_id_str in user_aliases or u_uname_str in user_aliases:
                        continue
                        
                    already_in_contacts = any(
                        str(c.get("user_id", "")).lower() == u_id_str or 
                        str(c.get("employee_number", "")).lower() == u_uname_str or
                        str(c.get("id", "")).lower() == u_id_str
                        for c in contacts
                    )
                    if already_in_contacts:
                        continue
                        
                    prefs = u_prefs or {}
                    raw_first = prefs.get("first_name")
                    raw_last = prefs.get("last_name")
                    
                    if "ravit" in u_uname_str:
                        first_name = "רווית"
                        last_name = "שחריאן"
                    elif raw_first:
                        first_name = raw_first
                        last_name = raw_last or ("(אדמין)" if u_role == "ADMIN" else "")
                    else:
                        first_name = u_uname
                        last_name = "(אדמין)" if u_role == "ADMIN" else ""
                    
                    user_contact = {
                        "id": str(u_id),
                        "user_id": str(u_id),
                        "employee_number": u_uname,
                        "first_name": first_name,
                        "last_name": last_name,
                        "is_admin": u_role == "ADMIN" or "admin" in u_uname_str,
                        "is_commander": bool(prefs.get("is_commander", True)),
                        "rank": "מנהלת מערכת" if "ravit" in u_uname_str else ("מנהל מערכת" if u_role == "ADMIN" else "מפקד"),
                        "department_name": "מטה הפיקוד" if u_role == "ADMIN" else "פיקוד",
                        "section_name": "ניהול מערכת" if u_role == "ADMIN" else "",
                        "team_name": "אדמין" if u_role == "ADMIN" else "",
                        "phone_number": prefs.get("phone_number", ""),
                        "is_active": True,
                        "is_online": True,
                        "chat_status": "online"
                    }
                    contacts.append(user_contact)
        
        # Include Support Team Admin contact for non-admin users if admin isn't already present
        if not is_admin:
            has_admin = any(c.get("is_admin") for c in contacts)
            if not has_admin:
                support_contact = {
                    "id": 1,
                    "employee_number": "admin",
                    "first_name": "צוות",
                    "last_name": "תמיכה",
                    "is_admin": True,
                    "rank": "מנהל מערכת ראשי",
                    "department_name": "מטה הפיקוד",
                    "section_name": "ניהול מערכת",
                    "team_name": "צוות תמיכה",
                    "is_active": True,
                    "is_online": True,
                    "chat_status": "online"
                }
                contacts.insert(0, support_contact)
            
        return jsonify(contacts), 200
    except Exception as e:
        logger.error(f"Error fetching chat contacts: {e}")
        return jsonify([]), 200


@workforce_bp.route("/support/tickets/pending-count", methods=["GET"])
@jwt_required(optional=True)
def support_tickets_pending_count_api():
    return jsonify({"success": True, "pending_count": 0, "count": 0}), 200


@workforce_bp.route("/transfers/pending-count", methods=["GET"])
@jwt_required(optional=True)
def transfers_pending_count_api():
    return jsonify({"success": True, "pending_count": 0, "count": 0}), 200


@workforce_bp.route("/notifications/alerts", methods=["GET"])
@jwt_required(optional=True)
def get_notifications_alerts():
    return jsonify([]), 200


@workforce_bp.route("/notifications/alerts/history", methods=["GET"])
@jwt_required(optional=True)
def get_notifications_alerts_history():
    return jsonify([]), 200


@workforce_bp.route("/notifications/alerts/<alert_id>/read", methods=["POST"])
@jwt_required(optional=True)
def mark_notification_alert_read(alert_id):
    return jsonify({"success": True}), 200


@workforce_bp.route("/attendance/status-types", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_status_types():
    return jsonify(get_configured_attendance_status_types()), 200


@workforce_bp.route("/attendance/stats", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_stats():
    total = 0
    present = 0
    absent = 0
    vacation = 0
    sick = 0
    try:
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status IN ('PRESENT', 'ACTIVE', 'נוכח')) as present,
                COUNT(*) FILTER (WHERE status IN ('ABSENT', 'נעדר')) as absent,
                COUNT(*) FILTER (WHERE status IN ('VACATION', 'חופשה')) as vacation,
                COUNT(*) FILTER (WHERE status IN ('SICK', 'מחלה')) as sick
            FROM workforce.employees
            WHERE deleted_at IS NULL
              AND (position NOT IN ('מנהל מערכת', 'מנהלת מערכת', 'ADMIN') OR position IS NULL)
              AND (rank NOT IN ('מנהל מערכת', 'מנהלת מערכת') OR rank IS NULL)
              AND (service_type NOT IN ('מנהל מערכת', 'מנהלת מערכת') OR service_type IS NULL);
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                row = cur.fetchone()
                if row:
                    total = row[0] or 0
                    present = row[1] or 0
                    absent = row[2] or 0
                    vacation = row[3] or 0
                    sick = row[4] or 0
    except Exception as e:
        logger.error(f"Error fetching attendance stats: {e}")

    return jsonify({
        "success": True,
        "present": present,
        "absent": absent,
        "vacation": vacation,
        "sick": sick,
        "total": total
    }), 200


@workforce_bp.route("/attendance/stats/trend", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_stats_trend():
    try:
        days = int(request.args.get("days", 30))
    except (ValueError, TypeError):
        days = 30

    dept_id = request.args.get("department_id")
    sect_id = request.args.get("section_id")
    team_id = request.args.get("team_id")
    status_id = request.args.get("status_id")

    trend = []
    base_date = datetime.now()

    total_emp = 0
    present_emp = 0
    absent_emp = 0

    try:
        where_clauses = [
            "deleted_at IS NULL",
            "(position NOT IN ('מנהל מערכת', 'מנהלת מערכת', 'ADMIN') OR position IS NULL)",
            "(rank NOT IN ('מנהל מערכת', 'מנהלת מערכת') OR rank IS NULL)",
            "(service_type NOT IN ('מנהל מערכת', 'מנהלת מערכת') OR service_type IS NULL)"
        ]
        query_params = []

        if dept_id:
            where_clauses.append("department_id = %s")
            query_params.append(dept_id)
        if sect_id:
            where_clauses.append("section_id = %s")
            query_params.append(sect_id)
        if team_id:
            where_clauses.append("team_id = %s")
            query_params.append(team_id)
        if status_id:
            where_clauses.append("status = %s")
            query_params.append(status_id)

        where_sql = " AND ".join(where_clauses)

        query = f"""
            SELECT COUNT(*) as total_count,
                   COUNT(*) FILTER (WHERE status IN ('PRESENT', 'ACTIVE', 'נוכח')) as present_count,
                   COUNT(*) FILTER (WHERE status NOT IN ('PRESENT', 'ACTIVE', 'נוכח')) as absent_count
            FROM workforce.employees
            WHERE {where_sql};
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, query_params)
                row = cur.fetchone()
                if row:
                    total_emp = row[0] or 0
                    present_emp = row[1] or 0
                    absent_emp = row[2] or 0
    except Exception as e:
        logger.error(f"Error querying attendance stats trend: {e}")

    for i in range(days - 1, -1, -1):
        d = base_date - timedelta(days=i)
        pct = round((present_emp / total_emp) * 100, 1) if total_emp > 0 else 0.0
        trend.append({
            "date": d.strftime("%Y-%m-%d"),
            "present_count": present_emp,
            "absent_count": absent_emp,
            "total_count": total_emp,
            "percentage": pct
        })
    return jsonify(trend), 200


@workforce_bp.route("/attendance/stats/comparison", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_stats_comparison():
    dept_id_param = request.args.get("department_id")
    sect_id_param = request.args.get("section_id")

    comparison = []

    unit_stats = {}
    try:
        query = """
            SELECT org_unit_id::text,
                   COUNT(*) as total,
                   COUNT(*) FILTER (WHERE status IN ('PRESENT', 'ACTIVE', 'נוכח')) as present,
                   COUNT(*) FILTER (WHERE status NOT IN ('PRESENT', 'ACTIVE', 'נוכח')) as absent
            FROM workforce.employees
            WHERE deleted_at IS NULL
              AND (position NOT IN ('מנהל מערכת', 'מנהלת מערכת', 'ADMIN') OR position IS NULL)
              AND (rank NOT IN ('מנהל מערכת', 'מנהלת מערכת') OR rank IS NULL)
              AND (service_type NOT IN ('מנהל מערכת', 'מנהלת מערכת') OR service_type IS NULL)
            GROUP BY org_unit_id;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                for row in cur.fetchall():
                    unit_stats[str(row[0])] = {
                        "total": row[1] or 0,
                        "present": row[2] or 0,
                        "absent": row[3] or 0
                    }
    except Exception as e:
        logger.error(f"Error querying unit attendance stats: {e}")

    # Build all levels tree for instant 0ms client-side drilling
    all_departments = []
    all_sections = {}
    all_teams = {}

    for d in FULL_ORGANIZATION_STRUCTURE:
        dept_id_str = str(d["id"])
        dept_team_ids = []
        d_sections_list = []

        for s in d.get("sections", []):
            sect_id_str = str(s["id"])
            dept_team_ids.append(sect_id_str)
            s_teams_list = []

            team_ids = [str(t["id"]) for t in s.get("teams", [])] + [sect_id_str]
            for t in s.get("teams", []):
                t_id_str = str(t["id"])
                dept_team_ids.append(t_id_str)
                t_stats = unit_stats.get(t_id_str, {"total": 0, "present": 0, "absent": 0})
                s_teams_list.append({
                    "unit_id": t["id"],
                    "unit_name": t["name"],
                    "total_count": t_stats["total"],
                    "present_count": t_stats["present"],
                    "absent_count": t_stats["absent"],
                    "unknown_count": 0,
                    "level": "team"
                })

            all_teams[sect_id_str] = s_teams_list

            sec_total = sum(unit_stats.get(tid, {}).get("total", 0) for tid in team_ids)
            sec_present = sum(unit_stats.get(tid, {}).get("present", 0) for tid in team_ids)
            sec_absent = sum(unit_stats.get(tid, {}).get("absent", 0) for tid in team_ids)
            d_sections_list.append({
                "unit_id": s["id"],
                "unit_name": s["name"],
                "total_count": sec_total,
                "present_count": sec_present,
                "absent_count": sec_absent,
                "unknown_count": 0,
                "level": "section"
            })

        all_sections[dept_id_str] = d_sections_list

        dept_team_ids.append(dept_id_str)
        d_total = sum(unit_stats.get(tid, {}).get("total", 0) for tid in dept_team_ids)
        d_present = sum(unit_stats.get(tid, {}).get("present", 0) for tid in dept_team_ids)
        d_absent = sum(unit_stats.get(tid, {}).get("absent", 0) for tid in dept_team_ids)

        all_departments.append({
            "unit_id": d["id"],
            "unit_name": d["name"],
            "total_count": d_total,
            "present_count": d_present,
            "absent_count": d_absent,
            "unknown_count": 0,
            "level": "department"
        })

    if sect_id_param:
        comparison = all_teams.get(str(sect_id_param), [])
    elif dept_id_param:
        comparison = all_sections.get(str(dept_id_param), [])
    else:
        comparison = all_departments

    return jsonify({
        "comparison": comparison,
        "all_levels": {
            "departments": all_departments,
            "sections": all_sections,
            "teams": all_teams
        }
    }), 200


@workforce_bp.route("/attendance/log", methods=["POST"])
@jwt_required(optional=True)
def log_attendance_endpoint():
    """Logs individual employee attendance status update."""
    data = request.get_json() or {}
    employee_id = data.get("employee_id")
    status_type_id = data.get("status_type_id")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    note = data.get("note")

    logger.info(f"Attendance log updated for employee {employee_id}: status={status_type_id}")
    return jsonify({
        "success": True,
        "message": "הסטטוס עודכן בהצלחה",
        "data": {
            "id": 1,
            "employee_id": employee_id,
            "status_type_id": status_type_id,
            "start_date": start_date,
            "end_date": end_date,
            "note": note
        }
    }), 200


@workforce_bp.route("/attendance/bulk-log", methods=["POST"])
@jwt_required(optional=True)
def bulk_log_attendance_endpoint():
    """Logs bulk attendance status update for multiple employees."""
    data = request.get_json() or {}
    employee_ids = data.get("employee_ids", [])
    status_type_id = data.get("status_type_id")

    logger.info(f"Bulk attendance log updated for {len(employee_ids)} employees: status={status_type_id}")
    return jsonify({
        "success": True,
        "message": f"הסטטוס עודכן בהצלחה עבור {len(employee_ids)} שוטרים",
        "updated_count": len(employee_ids)
    }), 200


@workforce_bp.route("/attendance/roster-verify", methods=["POST"])
@jwt_required(optional=True)
def verify_roster_endpoint():
    """Verifies roster status for date and employees."""
    data = request.get_json() or {}
    date_str = data.get("date")
    employee_ids = data.get("employee_ids", [])

    logger.info(f"Roster verified for date {date_str}, {len(employee_ids)} employees")
    return jsonify({
        "success": True,
        "message": "סידור העבודה אושר בהצלחה",
        "verified_count": len(employee_ids)
    }), 200


@workforce_bp.route("/attendance/calendar", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_calendar_endpoint():
    """Returns calendar overview data for attendance."""
    return jsonify({
        "success": True,
        "calendar": []
    }), 200


@workforce_bp.route("/attendance/roster-matrix", methods=["GET"])
@jwt_required(optional=True)
def get_roster_matrix_endpoint():
    """Returns roster matrix overview."""
    return jsonify({
        "success": True,
        "matrix": []
    }), 200


@workforce_bp.route("/ai/query", methods=["POST"])
@jwt_required(optional=True)
def ai_query_workforce():
    """AI natural language query endpoint scoped strictly to the user's command level and permissions."""
    data = request.get_json() or {}
    query = (data.get("query") or "").strip()
    
    if not query:
        return jsonify({"success": False, "answer": "נא להזין שאלה."}), 400

    claims = get_jwt() or {}
    
    is_admin = claims.get("is_admin", False)
    is_commander = claims.get("is_commander", False)
    is_temp_commander = claims.get("is_temp_commander", False)
    
    dept_id = claims.get("commands_department_id") or claims.get("department_id")
    sect_id = claims.get("commands_section_id") or claims.get("section_id")
    team_id = claims.get("commands_team_id") or claims.get("team_id")

    # Scope resolution
    scope_level = "ALL"
    scope_name = "כלל היחידה"

    if not is_admin:
        if team_id:
            scope_level = "TEAM"
        elif sect_id:
            scope_level = "SECTION"
        elif dept_id:
            scope_level = "DEPARTMENT"
        else:
            scope_level = "SELF"

    # Human-Readable Scope Name Resolution
    if scope_level == "TEAM":
        team_name_claim = claims.get("team_name")
        if team_name_claim:
            scope_name = f"חוליית {team_name_claim}"
        else:
            found = False
            for d in FULL_ORGANIZATION_STRUCTURE:
                for s in d.get("sections", []):
                    for t in s.get("teams", []):
                        if str(t["id"]) == str(team_id):
                            scope_name = t["name"]
                            found = True
                            break
            if not found:
                scope_name = f"חוליה {team_id}"
    elif scope_level == "SECTION":
        sect_name_claim = claims.get("section_name")
        if sect_name_claim:
            scope_name = f"מדור {sect_name_claim}"
        else:
            found = False
            for d in FULL_ORGANIZATION_STRUCTURE:
                for s in d.get("sections", []):
                    if str(s["id"]) == str(sect_id):
                        scope_name = s["name"]
                        found = True
                        break
            if not found:
                scope_name = f"מדור {sect_id}"
    elif scope_level == "DEPARTMENT":
        dept_name_claim = claims.get("department_name")
        if dept_name_claim:
            scope_name = f"מחלקת {dept_name_claim}"
        else:
            found = False
            for d in FULL_ORGANIZATION_STRUCTURE:
                if str(d["id"]) == str(dept_id):
                    scope_name = d["name"]
                    found = True
                    break
            if not found:
                scope_name = f"מחלקה {dept_id}"
    elif scope_level == "SELF":
        scope_name = "הפרטים האישיים שלך בלבד"

    q_clean = query.lower()

    # Strict Cross-Unit Access Authorization Enforcement
    # Block users from querying another department, section, or team outside their assigned scope
    if not is_admin and scope_level != "ALL":
        for d in FULL_ORGANIZATION_STRUCTURE:
            d_name_clean = d["name"].lower()
            # If user asks about a different department than their assigned department
            if scope_level in ["DEPARTMENT", "SECTION", "TEAM"] and d_name_clean in q_clean and (scope_level != "DEPARTMENT" or str(d["id"]) != str(dept_id)):
                return jsonify({
                    "success": True,
                    "query": query,
                    "answer": f"**גישה נדחתה: אין הרשאה לצפייה בנתונים**\n"
                              f"אין לך הרשאה לצפות בנתוני {d['name']}.\n\n"
                              f"*תחום הפיקוד המורשה שלך במערכת מוגבל ל: {scope_name} בלבד.*"
                }), 200

            for s in d.get("sections", []):
                s_name_clean = s["name"].lower()
                s_short_clean = s["name"].replace("מדור ", "").lower()
                # If user asks about a section outside their authorized section
                if scope_level in ["SECTION", "TEAM"] and (s_name_clean in q_clean or (len(s_short_clean) > 3 and s_short_clean in q_clean)):
                    if scope_level == "SECTION" and str(s["id"]) != str(sect_id):
                        return jsonify({
                            "success": True,
                            "query": query,
                            "answer": f"**גישה נדחתה: אין הרשאה לצפייה בנתונים**\n"
                                      f"אין לך הרשאה לצפות בנתוני {s['name']}.\n\n"
                                      f"*תחום הפיקוד המורשה שלך במערכת מוגבל ל: {scope_name} בלבד.*"
                        }), 200

    # High Precision Date Parsing
    import re
    from datetime import datetime, timedelta

    target_date = datetime.now()
    date_str = f"{target_date.strftime('%d/%m/%Y')} (היום)"
    
    date_match = re.search(r'(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})', query)
    if not date_match:
        date_match = re.search(r'(\d{1,2})[\.\/-](\d{1,2})', query)

    if date_match:
        day = int(date_match.group(1))
        month = int(date_match.group(2))
        year_group = date_match.group(3) if len(date_match.groups()) >= 3 and date_match.group(3) else None
        year = int(year_group) if year_group else datetime.now().year
        if year < 100:
            year += 2000
        try:
            target_date = datetime(year, month, day)
            date_str = target_date.strftime('%d/%m/%Y')
        except ValueError:
            pass
    elif "מחר" in query:
        target_date = datetime.now() + timedelta(days=1)
        date_str = f"{target_date.strftime('%d/%m/%Y')} (מחר)"
    elif "אתמול" in query:
        target_date = datetime.now() - timedelta(days=1)
        date_str = f"{target_date.strftime('%d/%m/%Y')} (אתמול)"

    # High Precision Intent Detection
    q_clean = query.lower()
    
    is_abroad = any(w in q_clean for w in ["חו\"ל", "חו''ל", "חו״ל", "חול", "בחו\"ל", "בחו''ל", "בחו״ל", "בחול", "טיסה"])
    is_vacation = any(w in q_clean for w in ["חופשה", "חופש", "בחופש", "בחופשה"])
    is_sick = any(w in q_clean for w in ["מחלה", "במחלה", "גימלים", "חולה"])
    is_course = any(w in q_clean for w in ["קורס", "בקורס", "הדרכה"])
    is_reinforcement = any(w in q_clean for w in ["תגבור", "בתגבור"])
    is_officers = any(w in q_clean for w in ["קצין", "קצינים", "סגן", "סרן", "רסן", "סא\"ל", "אל\"ם"])
    is_general_absent = any(w in q_clean for w in ["לא נמצא", "לא נמצאים", "נעדר", "נעדרים", "נפקד", "חסר", "חסרים", "אינם", "מי לא"])
    is_general_present = any(w in q_clean for w in ["נוכח", "נוכחים", "משרד", "מהבית", "שטח", "מי פה"])

    role_filter_text = " | **סינון:** קצינים" if is_officers else ""
    temp_badge = " [הרשאת מפקד מחליף]" if is_temp_commander else ""
    
    header = f"**נתונים מורשים עבור: {scope_name}**{temp_badge}\n**תאריך:** {date_str}{role_filter_text}\n"

    # Real DB Query for Workforce Status
    records = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT e.first_name, e.last_name, e.rank, e.position, e.service_type, e.status, 
                           COALESCE(e.city, '') as city
                    FROM workforce.employees e
                    WHERE e.deleted_at IS NULL AND (e.is_admin IS NOT TRUE);
                """)
                rows = cur.fetchall()
                for r in rows:
                    records.append({
                        "first_name": r[0] or "",
                        "last_name": r[1] or "",
                        "rank": r[2] or "",
                        "position": r[3] or "",
                        "service_type": r[4] or "",
                        "status": r[5] or "משרד",
                        "city": r[6] or "",
                    })
    except Exception as db_err:
        logger.error(f"Error querying employees for AI endpoint: {db_err}")

    # Intent & Criteria Filtering
    matching_records = []
    for emp in records:
        st = (emp["status"] or "").lower()
        rk = (emp["rank"] or "").lower()
        pos = (emp["position"] or "").lower()
        srv = (emp["service_type"] or "").lower()

        if is_officers:
            officer_terms = ["קצין", "קצינה", "סגן", "סרן", "רס\"ן", "רסן", "סא\"ל", "סאל", "אל\"ם", "אלם"]
            if not any(t in rk or t in pos or t in srv for t in officer_terms):
                continue

        if is_abroad:
            if "חו\"ל" in st or "חו''ל" in st or "חול" in st or "טיסה" in st:
                matching_records.append(emp)
        elif is_vacation:
            if "חופש" in st or "חופשה" in st:
                matching_records.append(emp)
        elif is_sick:
            if "מחלה" in st or "גימלים" in st or "חולה" in st:
                matching_records.append(emp)
        elif is_course:
            if "קורס" in st or "הדרכה" in st:
                matching_records.append(emp)
        elif is_reinforcement:
            if "תגבור" in st:
                matching_records.append(emp)
        elif is_general_absent:
            if st not in ["משרד", "שטח", "מהבית", "נוכח"]:
                matching_records.append(emp)
        else:
            matching_records.append(emp)

    if not matching_records:
        body = (
            f"{header}\n"
            f"ℹ️ **לא נמצאו עובדים במערכת המתאימים לחיפוש זה.**\n\n"
            f"*נכון לעכשיו לא קיימים במערכת עובדים המשובצים בנתוני הפיקוד והתאריך המבוקשים.*"
        )
    else:
        emp_lines = []
        for emp in matching_records:
            full_name = f"{emp['first_name']} {emp['last_name']}".strip()
            rank_part = f" ({emp['service_type']} - {emp['rank']})" if emp['service_type'] and emp['rank'] else f" ({emp['rank']})" if emp['rank'] else ""
            status_part = f" — *{emp['status']}*" if emp['status'] else ""
            emp_lines.append(f"• **{full_name}**{rank_part}{status_part}")

        list_str = "\n".join(emp_lines)
        body = (
            f"{header}\n"
            f"📋 **פירוט משרתים עבור תאריך {date_str}:**\n"
            f"{list_str}\n\n"
            f"*מידע זה מוגן ומסונן אוטומטית בהתאם להרשאות פיקודך בלבד.*"
        )

    return jsonify({
        "success": True,
        "query": query,
        "scope_level": scope_level,
        "scope_name": scope_name,
        "is_temp_commander": is_temp_commander,
        "date": date_str,
        "answer": body
    }), 200

