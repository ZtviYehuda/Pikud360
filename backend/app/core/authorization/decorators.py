import uuid
import logging
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

from app.core.authorization.scopes import ScopeType, resolve_access_scope
from app.core.authorization.policies import check_authorization
from app.core.authorization.exceptions import AccessDeniedError
from app.modules.security.repositories import AuditLogRepository

logger = logging.getLogger("pikud360.core.authorization.decorators")

audit_repo = AuditLogRepository()

def require_permission(permission: str, scope: ScopeType = ScopeType.ORGANIZATION_UNIT):
    """
    Flask route decorator guarding against missing permissions or incorrect scope contexts.
    Automatically captures tenant RLS details, performs closure hierarchy tree checking,
    and logs UNAUTHORIZED_ACCESS audits on denial.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # 1. Verify JWT presence
            verify_jwt_in_request()
            
            user_id = get_jwt_identity()
            claims = get_jwt()
            tenant_id = claims.get("tenant_id")

            if not tenant_id:
                raise AccessDeniedError("Missing tenant context in credentials.")

            # 2. Resolve complete AuthorizationContext (with inherited subtrees closure)
            ctx = resolve_access_scope(user_id, tenant_id)

            # Try to safely read parameters from JSON body if present
            json_data = {}
            try:
                if request.is_json:
                    json_data = request.get_json() or {}
            except Exception:
                pass

            # 3. Dynamic route mapping parameter extraction
            # Attempts to load unit constraints from view path parameters, querystrings, or JSON payloads
            resource_unit_id = (
                kwargs.get("unit_id") or 
                kwargs.get("org_unit_id") or 
                request.view_args.get("unit_id") or 
                request.view_args.get("org_unit_id") or 
                request.args.get("org_unit_id") or
                json_data.get("org_unit_id") or
                json_data.get("unit_id")
            )
            
            resource_owner_id = (
                kwargs.get("user_id") or 
                request.view_args.get("user_id") or 
                request.args.get("user_id") or
                json_data.get("user_id")
            )


            # 4. Check policy permission matches
            allowed = check_authorization(
                ctx=ctx,
                required_perm=permission,
                resource_unit_id=resource_unit_id,
                resource_owner_id=resource_owner_id,
                required_scope=scope
            )

            if not allowed:
                # Log UNAUTHORIZED_ACCESS audit log event
                try:
                    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr) or "127.0.0.1"
                    user_agent = request.headers.get("User-Agent", "")
                    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
                    
                    audit_repo.create({
                        "id": str(uuid.uuid4()),
                        "tenant_id": tenant_id,
                        "user_id": user_id,
                        "session_id": None,
                        "request_id": request_id,
                        "event_type": "UNAUTHORIZED_ACCESS",
                        "action": "API_DENIAL",
                        "table_name": None,
                        "record_id": None,
                        "old_values": None,
                        "new_values": {
                            "permission": permission,
                            "scope": scope.value if hasattr(scope, "value") else str(scope),
                            "path": request.path,
                            "method": request.method
                        },
                        "ip_address": ip_address,
                        "user_agent": user_agent,
                        "severity": "WARNING"
                    })
                except Exception as e:
                    logger.error(f"Failed to record UNAUTHORIZED_ACCESS audit log: {e}", exc_info=True)

                raise AccessDeniedError(f"Access Denied: Lacks {permission} permission.")

            return fn(*args, **kwargs)
        return wrapper
    return decorator
