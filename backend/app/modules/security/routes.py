from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from pydantic import ValidationError
from datetime import timedelta
import uuid
import logging

from app.modules.security.repositories import (
    UserRepository, 
    UserSessionRepository, 
    UserLoginHistoryRepository,
    TenantRepository,
    AuditLogRepository
)
from app.modules.security.services import SecurityService
from app.modules.security.schemas import LoginRequest, TokenResponse
from app.modules.security.permissions import get_user_permissions_and_scopes, get_user_roles

logger = logging.getLogger("pikud360.security.routes")

security_bp = Blueprint("security", __name__)

# Initialize dependencies
user_repo = UserRepository()
session_repo = UserSessionRepository()
login_history_repo = UserLoginHistoryRepository()
tenant_repo = TenantRepository()
audit_repo = AuditLogRepository()

security_service = SecurityService(
    user_repo=user_repo,
    session_repo=session_repo,
    login_history_repo=login_history_repo,
    tenant_repo=tenant_repo,
    audit_repo=audit_repo
)

@security_bp.route("/login", methods=["POST"])
def login():
    """Authenticates user, checks locks, rate limits, issues tokens, and writes audit/history logs."""
    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
    user_agent = request.headers.get("User-Agent", "")
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

    try:
        req_data = request.get_json() or {}
        login_req = LoginRequest(**req_data)
    except ValidationError as e:
        # Log payload failure
        security_service.log_login_attempt(
            user_id=None,
            tenant_id=None,
            session_id=None,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=False,
            failure_reason="Invalid payload structure"
        )
        return jsonify({
            "success": False,
            "message": "Validation failed",
            "errors": e.errors()
        }), 400

    # 1. Login Rate Limiting check (max 10 failed attempts within 15 minutes)
    if security_service.is_rate_limited(login_req.username, ip_address):
        security_service.log_login_attempt(
            user_id=None,
            tenant_id=None,
            session_id=None,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=False,
            failure_reason="Rate limit exceeded"
        )
        return jsonify({
            "success": False,
            "message": "Too many failed login attempts. Please try again in 15 minutes."
        }), 429

    # 2. Resolve Tenant by code
    tenant = security_service.resolve_tenant(login_req.tenant_code)
    if not tenant or not tenant.get("is_active"):
        security_service.log_login_attempt(
            user_id=None,
            tenant_id=tenant.get("id") if tenant else None,
            session_id=None,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=False,
            failure_reason="Invalid or deactivated tenant code"
        )
        return jsonify({
            "success": False,
            "message": "Invalid tenant code"
        }), 401

    tenant_id = tenant["id"]

    # 3. Authenticate User (includes lock checks)
    user, error_msg = security_service.authenticate_user(login_req.username, login_req.password, tenant_id)
    
    if not user:
        # Try to locate user ID to log failed attempt on specific user
        matched_user = user_repo.get_by_username_and_tenant(login_req.username, tenant_id)
        user_id = matched_user.id if matched_user else None
        
        # If user exists but passwords mismatch, increment failures count
        if matched_user and error_msg == "Invalid username or password":
            security_service.increment_failed_attempts(matched_user)
            
        security_service.log_login_attempt(
            user_id=user_id,
            tenant_id=tenant_id,
            session_id=None,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=False,
            failure_reason=error_msg
        )
        
        # Write to audit logs on authentication failure
        security_service.create_audit_log(
            tenant_id=tenant_id,
            user_id=user_id,
            session_id=None,
            request_id=request_id,
            event_type="LOGIN_FAILURE",
            action="LOGIN",
            table_name="security.users",
            record_id=user_id or "00000000-0000-0000-0000-000000000000",
            new_values={"username": login_req.username, "failure_reason": error_msg},
            ip_address=ip_address,
            user_agent=user_agent,
            severity="WARNING"
        )
        
        return jsonify({
            "success": False,
            "message": error_msg
        }), 401

    # Reset failed attempts count on successful authentication
    security_service.reset_failed_attempts(user.id)

    # 4. Fetch roles and permissions lists
    user_roles = get_user_roles(user.id)
    user_permissions = [code for code, scope in get_user_permissions_and_scopes(user.id)]

    # 5. Issue access and refresh tokens including claims
    additional_claims = {
        "tenant_id": user.tenant_id,
        "roles": user_roles,
        "permissions": user_permissions
    }
    
    access_token = create_access_token(
        identity=user.id,
        additional_claims=additional_claims,
        expires_delta=timedelta(minutes=15)
    )
    refresh_token = create_refresh_token(
        identity=user.id,
        additional_claims=additional_claims,
        expires_delta=timedelta(days=7)
    )

    # 6. Record session in database
    try:
        session = security_service.create_session(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_in_seconds=7 * 24 * 3600, # 7 days
            device_name=None,
            ip_address=ip_address
        )
    except Exception as e:
        logger.error(f"Failed to record session: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "message": "Server error creating session"
        }), 500

    # 7. Log successful login
    security_service.log_login_attempt(
        user_id=user.id,
        tenant_id=user.tenant_id,
        session_id=session.id,
        ip_address=ip_address,
        user_agent=user_agent,
        is_successful=True
    )

    # 8. Record audit log
    security_service.create_audit_log(
        tenant_id=user.tenant_id,
        user_id=user.id,
        session_id=session.id,
        request_id=request_id,
        event_type="LOGIN_SUCCESS",
        action="LOGIN",
        table_name="security.users",
        record_id=user.id,
        new_values={"username": user.username},
        ip_address=ip_address,
        user_agent=user_agent,
        severity="INFO"
    )

    token_data = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

    return jsonify({
        "success": True,
        "data": token_data.model_dump()
    }), 200


@security_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Rotates refresh tokens and issues new access tokens (RTR)."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    roles = claims.get("roles", [])
    permissions = claims.get("permissions", [])
    
    auth_header = request.headers.get("Authorization", "")
    refresh_token = ""
    if auth_header.startswith("Bearer "):
        refresh_token = auth_header.split(" ")[1]

    if not refresh_token:
        return jsonify({
            "success": False,
            "message": "Missing refresh token string"
        }), 400

    # 1. Verify active session token hash in DB
    session = security_service.verify_refresh_token(refresh_token)
    if not session:
        return jsonify({
            "success": False,
            "message": "Session is invalid or has been revoked"
        }), 401

    # 2. Invalidate/Revoke the old session token (RTR)
    security_service.revoke_session(refresh_token)

    # 3. Issue new access token and fresh rotated refresh token
    additional_claims = {
        "tenant_id": tenant_id,
        "roles": roles,
        "permissions": permissions
    }
    
    new_access_token = create_access_token(
        identity=user_id,
        additional_claims=additional_claims,
        expires_delta=timedelta(minutes=15)
    )
    new_refresh_token = create_refresh_token(
        identity=user_id,
        additional_claims=additional_claims,
        expires_delta=timedelta(days=7)
    )

    # 4. Save new rotated refresh session in DB
    try:
        security_service.create_session(
            user_id=user_id,
            refresh_token=new_refresh_token,
            expires_in_seconds=7 * 24 * 3600,
            device_name=session.device_name,
            ip_address=session.ip_address
        )
    except Exception as e:
        logger.error(f"Failed to rotate refresh session: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "message": "Server error rotating refresh session"
        }), 500

    return jsonify({
        "success": True,
        "data": {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "Bearer"
        }
    }), 200


@security_bp.route("/logout", methods=["POST"])
@jwt_required(refresh=True)
def logout():
    """Logs out user by revoking the active session in database."""
    auth_header = request.headers.get("Authorization", "")
    refresh_token = ""
    if auth_header.startswith("Bearer "):
        refresh_token = auth_header.split(" ")[1]

    if refresh_token:
        security_service.revoke_session(refresh_token)

    return jsonify({
        "success": True,
        "message": "Session successfully revoked"
    }), 200
