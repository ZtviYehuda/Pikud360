import logging
from flask import Flask
from flask_cors import CORS
from app.config import get_settings
from app.core import configure_logging, register_error_handlers
from app.database import DatabaseConnectionManager
from app.middleware import register_request_logging
from app.api.v1 import health_bp
from app.modules.security.auth import jwt
from app.modules.security.routes import security_bp

logger = logging.getLogger("pikud360.app")

def create_app() -> Flask:
    """Application factory for Flask configuration."""
    # 1. Initialize logging
    configure_logging()
    
    # 2. Instantiate Flask App
    app = Flask(__name__)
    
    # 3. Load settings
    settings = get_settings()
    app.config.from_object(settings)
    
    # Configure JWT Secret Keys dynamically
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    
    # 4. Enable Cross-Origin Resource Sharing (CORS)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # 5. Initialize JWT Manager
    jwt.init_app(app)
    
    # 6. Initialize database pool
    try:
        # Avoid database connection check failure blocking app startup in development/docker environments
        DatabaseConnectionManager.initialize()
    except Exception as e:
        logger.error(f"Could not initialize database on startup: {e}. App will start, but db-dependent features will fail.")
        
    # 7. Register request logging middleware
    register_request_logging(app)
    
    # 8. Register tenant context middleware
    from app.middleware.tenant_context import init_tenant_context_middleware
    init_tenant_context_middleware(app)

    # 9. Register authorization global context middleware
    from app.core.authorization import init_authorization_middleware
    init_authorization_middleware(app)


    
    # 8. Register global JSON error handlers
    register_error_handlers(app)
    
    # 9. Register health/status blueprint directly on root as requested:
    # (GET /health, GET /version, GET /status, GET /api)
    app.register_blueprint(health_bp, url_prefix="")
    
    # 6. Register blueprints
    from app.modules.security.routes import security_bp
    app.register_blueprint(security_bp, url_prefix="/api/auth")

    from app.modules.workforce.routes import workforce_bp
    app.register_blueprint(workforce_bp, url_prefix="/api/workforce")

    from app.modules.organization.routes import org_bp
    app.register_blueprint(org_bp, url_prefix="/api/organization")

    from app.modules.workforce_schedule.routes import scheduling_bp
    app.register_blueprint(scheduling_bp, url_prefix="/api/scheduling")

    from app.modules.intelligence import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    from app.modules.transfers.routes import transfers_bp
    app.register_blueprint(transfers_bp, url_prefix="/api")

    from app.modules.notifications.routes import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix="/api")

    from app.modules.admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")







    
    logger.info(f"Flask Application Factory initialized for environment: {settings.ENV}")
    
    return app
