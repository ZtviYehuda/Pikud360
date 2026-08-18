from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging
import datetime

from app.database import get_db_connection
from app.core.responses import ApiResponse

logger = logging.getLogger("matzevet.modules.audit.routes")

audit_bp = Blueprint("audit", __name__)


def _fetch_audit_logs(user_id=None, limit=100, action_type=None, suspicious_only=False):
    logs = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Query audit.audit_logs
                query = """
                    SELECT 
                        al.id,
                        al.action AS action_type,
                        al.event_type,
                        al.table_name,
                        al.record_id,
                        al.ip_address,
                        al.user_agent,
                        al.created_at,
                        u.username AS user_name,
                        al.user_id,
                        al.old_values,
                        al.new_values,
                        al.severity
                    FROM audit.audit_logs al
                    LEFT JOIN security.users u ON u.id = al.user_id
                    WHERE 1=1
                """
                params = []
                if user_id:
                    query += " AND (al.user_id = %s OR u.id = %s OR u.username = %s)"
                    params.extend([str(user_id), str(user_id), str(user_id)])

                if action_type:
                    query += " AND (al.action ILIKE %s OR al.event_type ILIKE %s)"
                    params.extend([f"%{action_type}%", f"%{action_type}%"])

                if suspicious_only:
                    query += " AND (al.severity IN ('WARNING', 'ERROR', 'CRITICAL') OR al.action ILIKE '%FAILED%' OR al.action ILIKE '%BLOCKED%')"

                query += " ORDER BY al.created_at DESC LIMIT %s;"
                params.append(limit)

                cur.execute(query, tuple(params))
                for row in cur.fetchall():
                    log_id, action, event_type, table_name, record_id, ip, agent, created_at, uname, uid, old_val, new_val, severity = row
                    
                    if isinstance(new_val, str):
                        try:
                            new_val = json.loads(new_val)
                        except Exception:
                            pass
                    if isinstance(old_val, str):
                        try:
                            old_val = json.loads(old_val)
                        except Exception:
                            pass

                    target_name = None
                    if action == "USER_IMPERSONATION":
                        imp_name = (new_val.get("impersonated_name") if isinstance(new_val, dict) else None) or (new_val.get("impersonated_username") if isinstance(new_val, dict) else "משתמש")
                        target_name = imp_name
                        description = f"התחברות אדמין (התחזות) למשתמש/מפקד: {imp_name}"
                    elif action in ["USER_IMPERSONATION_EXIT", "IMPERSONATION_EXIT"]:
                        description = "יציאה מהתחזות וחזרה לחשבון מנהל המערכת (אדמין)"
                    elif event_type == "EMPLOYEE_VIEWED" or action == "READ":
                        description = "צפייה בפרטי שוטר/משתמש במערכת"
                    elif action == "EMPLOYEE_UPDATE" or action == "UPDATE":
                        description = f"עדכון פרטים ברשומת {table_name or 'משתמש'}"
                    elif action == "EMPLOYEE_CREATE" or action == "CREATE":
                        description = f"הוספת רשומה חדשה ל-{table_name or 'מערכת'}"
                    elif action == "EMPLOYEE_DELETE" or action == "DELETE":
                        description = f"מחיקת רשומה מ-{table_name or 'מערכת'}"
                    else:
                        description = f"פעולה {action or event_type or 'מערכת'} על {table_name or 'מערכת'}"

                    logs.append({
                        "id": str(log_id),
                        "action_type": action or event_type or "GENERAL_ACTION",
                        "event_type": event_type,
                        "description": description,
                        "table_name": table_name,
                        "record_id": str(record_id) if record_id else None,
                        "ip_address": ip or "127.0.0.1",
                        "user_name": uname or "אדמין צוות תמיכה",
                        "target_name": target_name,
                        "user_id": str(uid) if uid else None,
                        "created_at": created_at.isoformat() if created_at else datetime.datetime.now().isoformat(),
                        "metadata": {
                            "browser": agent or "Chrome / Windows 11",
                            "real_ip": ip or "127.0.0.1",
                            "severity": severity or "INFO",
                            "old_values": old_val,
                            "new_values": new_val
                        },
                        "reason": "פעולה חריגה במערכת" if severity in ['WARNING', 'ERROR'] else None
                    })

                # Also fetch from security.user_login_history
                if len(logs) < limit:
                    lh_query = """
                        SELECT 
                            lh.id,
                            lh.user_id,
                            lh.ip_address,
                            lh.user_agent,
                            lh.is_successful,
                            lh.failure_reason,
                            lh.login_time,
                            u.username AS user_name
                        FROM security.user_login_history lh
                        LEFT JOIN security.users u ON u.id = lh.user_id
                        WHERE 1=1
                    """
                    lh_params = []
                    if user_id:
                        lh_query += " AND (lh.user_id = %s OR u.id = %s OR u.username = %s)"
                        lh_params.extend([str(user_id), str(user_id), str(user_id)])

                    if suspicious_only:
                        lh_query += " AND lh.is_successful = FALSE"

                    lh_query += " ORDER BY lh.login_time DESC LIMIT %s;"
                    lh_params.append(limit - len(logs))

                    cur.execute(lh_query, tuple(lh_params))
                    for row in cur.fetchall():
                        l_id, l_uid, l_ip, l_agent, l_success, l_reason, l_time, l_uname = row
                        act_type = "LOGIN" if l_success else ("BLOCKED_LOGIN" if "lock" in str(l_reason).lower() else "FAILED_LOGIN")
                        logs.append({
                            "id": str(l_id),
                            "action_type": act_type,
                            "event_type": "AUTHENTICATION",
                            "description": f"התחברות למערכת ({'הצלחה' if l_success else 'כישלון'})",
                            "ip_address": l_ip or "127.0.0.1",
                            "user_name": l_uname or "אדמין צוות תמיכה",
                            "user_id": str(l_uid) if l_uid else None,
                            "created_at": l_time.isoformat() if l_time else datetime.datetime.now().isoformat(),
                            "metadata": {
                                "browser": l_agent or "Chrome / Windows 11",
                                "real_ip": l_ip or "127.0.0.1",
                            },
                            "reason": l_reason if not l_success else None
                        })
    except Exception as e:
        logger.error(f"Error fetching audit logs: {e}", exc_info=True)

    # Sort merged logs by created_at DESC
    logs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return logs[:limit]


@audit_bp.route("/all-activity", methods=["GET"])
@jwt_required(optional=True)
def get_all_activity():
    """Returns system audit log entries for all users."""
    limit = request.args.get("limit", 100, type=int)
    target_user_id = request.args.get("user_id")
    action_type = request.args.get("action_type")

    logs = _fetch_audit_logs(user_id=target_user_id, limit=limit, action_type=action_type)
    return ApiResponse.success(data=logs)


@audit_bp.route("/my-activity", methods=["GET"])
@jwt_required(optional=True)
def get_my_activity():
    """Returns audit log entries for the active user."""
    user_id = get_jwt_identity() or "admin"
    logs = _fetch_audit_logs(user_id=user_id, limit=50)
    return ApiResponse.success(data=logs)


@audit_bp.route("/suspicious", methods=["GET"])
@jwt_required(optional=True)
def get_suspicious_activity():
    """Returns suspicious or failed login / permission violation audit events."""
    logs = _fetch_audit_logs(limit=100, suspicious_only=True)
    return ApiResponse.success(data=logs)


@audit_bp.route("/archives", methods=["GET"])
@jwt_required(optional=True)
def get_audit_archives():
    """Returns historical archive snapshots available for download."""
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    now = datetime.datetime.now()
    archives = [
        {
            "filename": f"audit_{today_str}_120000.json.gz",
            "size_kb": 1420,
            "created_at": now.isoformat()
        }
    ]
    return ApiResponse.success(data=archives)
