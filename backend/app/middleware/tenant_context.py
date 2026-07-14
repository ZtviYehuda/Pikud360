import logging
from flask import g, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt
import uuid

logger = logging.getLogger("pikud360.middleware.tenant_context")

def init_tenant_context_middleware(app):
    """Hooks into before_request to resolve and bind the tenant context."""
    
    @app.before_request
    def resolve_tenant_context():
        # Initialize tenant context
        g.current_tenant_id = None
        
        # Avoid verifying JWT on routes that are explicitly excluded (like health or login)
        # However, calling verify_jwt_in_request(optional=True) is safe as it won't crash on missing tokens
        try:
            # check if JWT is provided
            verify_jwt_in_request(optional=True)
            claims = get_jwt()
            if claims and "tenant_id" in claims:
                g.current_tenant_id = claims["tenant_id"]
                logger.debug(f"Resolved tenant_id={g.current_tenant_id} from JWT claims.")
        except Exception as e:
            # Token could be invalid or expired, which is handled downstream in routes/guards
            logger.debug(f"JWT context resolution skipped/failed: {e}")

        # Support fallback override for Service Accounts / API Keys via headers
        if not g.current_tenant_id:
            x_tenant = request.headers.get("X-Tenant-ID")
            if x_tenant:
                try:
                    # Validate UUID format
                    uuid.UUID(x_tenant)
                    g.current_tenant_id = x_tenant
                    logger.debug(f"Resolved tenant_id={g.current_tenant_id} from X-Tenant-ID header.")
                except ValueError:
                    logger.warning(f"Invalid X-Tenant-ID header UUID format received: {x_tenant}")
