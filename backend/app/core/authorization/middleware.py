import logging
from flask import g, request
from flask_jwt_extended import get_jwt_identity, get_jwt

from app.core.authorization.scopes import resolve_access_scope

logger = logging.getLogger("pikud360.core.authorization.middleware")

def init_authorization_middleware(app):
    """
    Hook to bind active authorization context globally to Flask request execution lifecycle
    if needed by templates or downstream logic.
    """
    @app.before_request
    def bind_authorization_context():
        g.auth_context = None
        # Checks if JWT is active on the request thread
        try:
            # Avoid throwing error if request doesn't have token
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            claims = get_jwt()
            if user_id and claims and "tenant_id" in claims:
                g.auth_context = resolve_access_scope(user_id, claims["tenant_id"])
        except Exception:
            pass
