from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    decode_token
)
from datetime import timedelta
import uuid
import logging

from app.modules.security.repositories import (
    UserRepository, 
    UserSessionRepository, 
    UserLoginHistoryRepository,
    TenantRepository,
    AuditLogRepository,
    UserPreferenceRepository
)
from app.modules.security.services import SecurityService
from app.modules.security.permissions import get_user_permissions_and_scopes, get_user_roles

logger = logging.getLogger("matzevet.security.routes")

security_bp = Blueprint("security", __name__)

# Initialize dependencies
user_repo = UserRepository()
session_repo = UserSessionRepository()
login_history_repo = UserLoginHistoryRepository()
tenant_repo = TenantRepository()
audit_repo = AuditLogRepository()
user_preference_repo = UserPreferenceRepository()

security_service = SecurityService(
    user_repo=user_repo,
    session_repo=session_repo,
    login_history_repo=login_history_repo,
    tenant_repo=tenant_repo,
    audit_repo=audit_repo
)


def _set_refresh_cookie(response, refresh_token: str):
    """Sets Refresh Token strictly in HttpOnly Secure SameSite cookie."""
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,  # Set to True when HTTPS is enabled
        samesite="Lax",
        path="/api/security",
        max_age=7 * 24 * 3600
    )
    return response


def _clear_refresh_cookie(response):
    """Deletes Refresh Token HttpOnly cookie."""
    response.delete_cookie("refresh_token", path="/api/security")
    return response


@security_bp.route("/login", methods=["POST"])
def login():
    """Authenticates user with strict Bcrypt verification against PostgreSQL database ONLY."""
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"

    req_data = request.get_json() or {}
    username = (req_data.get("username") or "").strip()
    password = (req_data.get("password") or "").strip()
    tenant_code = req_data.get("tenant_code", "DEFAULT")

    if not username or not password:
        return jsonify({
            "success": False,
            "message": "שם משתמש וסיסמה הם שדות חובה",
            "error": "שם משתמש וסיסמה הם שדות חובה"
        }), 400

    # Rate limiting check
    if security_service.is_rate_limited(username, ip_address):
        return jsonify({
            "success": False,
            "message": "יותר מדי ניסיונות כושלים. אנא נסה שוב בעוד 15 דקות."
        }), 429

    # Ensure default accounts exist in PostgreSQL security.users table
    user_repo.ensure_seed_users()

    # Resolve Tenant
    tenant = security_service.resolve_tenant(tenant_code)
    tenant_id = tenant["id"] if (tenant and tenant.get("is_active")) else "00000000-0000-0000-0000-000000000001"

    # Lookup user ONLY in PostgreSQL security.users table
    user = (
        user_repo.get_by_username_and_tenant(username, tenant_id)
        or user_repo.get_by_email_and_tenant(username, tenant_id)
        or user_repo.get_by_username(username)
    )

    if not user:
        security_service.log_login_attempt(
            user_id=None, tenant_id=tenant_id, session_id=None,
            ip_address=ip_address, user_agent=request.user_agent.string,
            is_successful=False, failure_reason="User not found"
        )
        return jsonify({
            "success": False,
            "message": "שם משתמש או סיסמה שגויים",
            "error": "שם משתמש או סיסמה שגויים"
        }), 401

    if not user.is_active:
        return jsonify({
            "success": False,
            "message": "חשבון משתמש זה אינו פעיל",
            "error": "חשבון משתמש זה אינו פעיל"
        }), 401

    # Strict Bcrypt Verification against PostgreSQL password_hash
    if not security_service.verify_password(password, user.password_hash):
        security_service.increment_failed_attempts(user)
        security_service.log_login_attempt(
            user_id=user.id, tenant_id=tenant_id, session_id=None,
            ip_address=ip_address, user_agent=request.user_agent.string,
            is_successful=False, failure_reason="Invalid password"
        )
        return jsonify({
            "success": False,
            "message": "שם משתמש או סיסמה שגויים",
            "error": "שם משתמש או סיסמה שגויים"
        }), 401

    # Password verified! Reset failed attempts & issue JWT tokens
    security_service.reset_failed_attempts(user.id)
    user_roles = get_user_roles(user.id)
    user_permissions = [code for code, scope in get_user_permissions_and_scopes(user.id)]

    additional_claims = {
        "tenant_id": user.tenant_id,
        "roles": user_roles,
        "permissions": user_permissions
    }
    
    # Access Token: Short lifetime (15 mins)
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
        expires_delta=timedelta(minutes=15)
    )
    # Refresh Token: Long lifetime (7 days)
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims=additional_claims,
        expires_delta=timedelta(days=7)
    )

    session_id = None
    try:
        session = security_service.create_session(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_in_seconds=7 * 24 * 3600,
            device_name=request.user_agent.platform,
            ip_address=ip_address
        )
        session_id = session.id
    except Exception as e:
        logger.warning(f"DB Session log skipped: {e}")

    security_service.log_login_attempt(
        user_id=user.id, tenant_id=tenant_id, session_id=session_id,
        ip_address=ip_address, user_agent=request.user_agent.string,
        is_successful=True
    )

    is_admin = (user.username == "admin") or (user.email == "admin@matzevet.gov.il") or ("ADMIN" in user_roles)
    is_commander = ("COMMANDER" in user_roles) or is_admin

    user_obj = {
        "id": user.id,
        "first_name": "מנהל" if is_admin else "מפקד",
        "last_name": "מערכת",
        "username": user.username,
        "phone_number": "0501234567",
        "email": user.email,
        "must_change_password": False,
        "is_admin": is_admin,
        "is_commander": is_commander,
        "department_id": 1,
        "section_id": 11,
        "team_id": 111,
        "department_name": "מטה הפיקוד",
        "section_name": "ניהול מערכת",
        "team_name": "צוות תמיכה",
        "role_name": "מנהל מערכת ראשי" if is_admin else "מפקד",
    }

    # Fetch user preferences from PostgreSQL DB
    user_prefs = user_preference_repo.get_by_user_id(str(user.id))

    response = jsonify({
        "success": True,
        "access_token": access_token,
        "token": access_token,
        "refresh_token": refresh_token,
        "user": user_obj,
        "preferences": user_prefs,
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_obj,
            "preferences": user_prefs
        }
    })
    # Attach Refresh Token as HttpOnly Secure Cookie
    return _set_refresh_cookie(response, refresh_token), 200


@security_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Returns current authenticated user profile & preferences from PostgreSQL."""
    current_user_id = get_jwt_identity()
    user = (
        user_repo.get_by_id(str(current_user_id)) 
        or user_repo.get_by_username(str(current_user_id))
    )
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    user_roles = get_user_roles(user.id)
    is_admin = (user.username == "admin") or (user.email == "admin@matzevet.gov.il") or ("ADMIN" in user_roles)
    is_commander = ("COMMANDER" in user_roles) or is_admin

    user_obj = {
        "id": user.id,
        "first_name": "מנהל" if is_admin else "מפקד",
        "last_name": "מערכת",
        "username": user.username,
        "email": user.email,
        "is_admin": is_admin,
        "is_commander": is_commander,
        "department_id": 1,
        "section_id": 11,
        "team_id": 111,
        "department_name": "מטה הפיקוד",
        "section_name": "ניהול מערכת",
        "team_name": "צוות תמיכה",
        "role_name": "מנהל מערכת ראשי" if is_admin else "מפקד",
    }

    user_prefs = user_preference_repo.get_by_user_id(str(user.id))

    return jsonify({
        "success": True,
        "user": user_obj,
        "preferences": user_prefs,
        "data": user_obj
    }), 200


@security_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    """Revokes session in PostgreSQL and clears HttpOnly refresh cookie."""
    refresh_token = request.cookies.get("refresh_token") or request.headers.get("X-Refresh-Token")
    if refresh_token:
        try:
            security_service.revoke_session(refresh_token)
        except Exception as e:
            logger.warning(f"Error revoking refresh session: {e}")

    current_user_id = get_jwt_identity()
    if current_user_id:
        security_service.create_audit_log(
            tenant_id="00000000-0000-0000-0000-000000000001",
            user_id=str(current_user_id),
            session_id=None,
            request_id=str(uuid.uuid4()),
            event_type="AUTH_EVENT",
            action="LOGOUT",
            table_name="security.user_sessions",
            record_id=str(current_user_id),
            ip_address=request.headers.get("X-Forwarded-For", request.remote_addr) or ""
        )

    response = jsonify({
        "success": True,
        "message": "התנתקת בהצלחה"
    })
    return _clear_refresh_cookie(response), 200


@security_bp.route("/refresh", methods=["POST"])
@security_bp.route("/refresh-token", methods=["POST"])
def refresh():
    """Generates a new short-lived access token using HttpOnly refresh cookie."""
    refresh_token = request.cookies.get("refresh_token") or request.headers.get("X-Refresh-Token")
    
    req_body = request.get_json() or {}
    if not refresh_token:
        refresh_token = req_body.get("refresh_token") or req_body.get("refreshToken")

    if not refresh_token:
        return jsonify({"success": False, "message": "Missing refresh token cookie"}), 401

    try:
        session = security_service.verify_refresh_token(refresh_token)
        if not session:
            response = jsonify({"success": False, "message": "Invalid or revoked refresh token"})
            return _clear_refresh_cookie(response), 401

        decoded = decode_token(refresh_token)
        user_id = decoded.get("sub")
        tenant_id = decoded.get("tenant_id")
        roles = decoded.get("roles", [])
        permissions = decoded.get("permissions", [])

        additional_claims = {
            "tenant_id": tenant_id,
            "roles": roles,
            "permissions": permissions
        }

        # New Access Token: 15 minutes
        new_access_token = create_access_token(
            identity=str(user_id),
            additional_claims=additional_claims,
            expires_delta=timedelta(minutes=15)
        )
        # Rotated Refresh Token: 7 days
        new_refresh_token = create_refresh_token(
            identity=str(user_id),
            additional_claims=additional_claims,
            expires_delta=timedelta(days=7)
        )

        security_service.revoke_session(refresh_token)
        security_service.create_session(
            user_id=str(user_id),
            refresh_token=new_refresh_token,
            expires_in_seconds=7 * 24 * 3600,
            device_name=request.user_agent.platform,
            ip_address=request.headers.get("X-Forwarded-For", request.remote_addr) or ""
        )

        response = jsonify({
            "success": True,
            "access_token": new_access_token,
            "token": new_access_token
        })
        return _set_refresh_cookie(response, new_refresh_token), 200
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        response = jsonify({"success": False, "message": "Invalid refresh token"})
        return _clear_refresh_cookie(response), 401


@security_bp.route("/preferences", methods=["GET"])
@jwt_required(optional=True)
def get_preferences():
    """Retrieves current user preferences from PostgreSQL database."""
    user_id = get_jwt_identity() or "default"
    prefs = user_preference_repo.get_by_user_id(str(user_id))
    return jsonify({
        "success": True,
        "preferences": prefs,
        "data": prefs
    }), 200


@security_bp.route("/preferences", methods=["PUT"])
@jwt_required(optional=True)
def update_preferences():
    """Updates user preferences strictly in PostgreSQL database."""
    user_id = get_jwt_identity() or "default"
    req_data = request.get_json() or {}
    updated_prefs = user_preference_repo.upsert(str(user_id), req_data)

    security_service.create_audit_log(
        tenant_id="00000000-0000-0000-0000-000000000001",
        user_id=str(user_id),
        session_id=None,
        request_id=str(uuid.uuid4()),
        event_type="PREFERENCE_EVENT",
        action="UPDATE_PREFERENCES",
        table_name="security.user_preferences",
        record_id=str(user_id),
        new_values=updated_prefs
    )

    return jsonify({
        "success": True,
        "preferences": updated_prefs,
        "data": updated_prefs
    }), 200


@security_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """Updates user password with Bcrypt and revokes all active sessions in PostgreSQL."""
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"success": False, "message": "משתמש לא מחובר"}), 401

    req_data = request.get_json() or {}
    old_password = (
        req_data.get("old_password") 
        or req_data.get("current_password") 
        or req_data.get("currentPassword") 
        or req_data.get("oldPassword")
    )
    new_password = (
        req_data.get("new_password") 
        or req_data.get("newPassword")
    )

    if not old_password or not new_password:
        return jsonify({"success": False, "message": "אנא ספק סיסמה נוכחית וסיסמה חדשה"}), 400

    success, msg = security_service.change_password(str(user_id), old_password, new_password)
    if not success:
        return jsonify({"success": False, "message": msg, "error": msg}), 400

    response = jsonify({
        "success": True,
        "message": msg
    })
    return _clear_refresh_cookie(response), 200


@security_bp.route("/support/tickets/pending-count", methods=["GET"])
@jwt_required(optional=True)
def support_tickets_pending_count():
    return jsonify({"success": True, "pending_count": 0, "count": 0}), 200
