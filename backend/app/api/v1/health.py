import time
from flask import Blueprint
from app.core.responses import ApiResponse
from app.database.connection import DatabaseConnectionManager
from app.config import get_settings

health_bp = Blueprint("health", __name__)

# Track backend start time for status uptime check
START_TIME = time.time()

@health_bp.route("/health", methods=["GET"])
def health_check():
    """System health check endpoint including database connection check."""
    db_healthy = DatabaseConnectionManager.check_health()
    status_code = 200 if db_healthy else 503
    
    status_payload = {
        "status": "healthy" if db_healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "timestamp": time.time()
    }
    
    if not db_healthy:
        return ApiResponse.error(
            message="Database connection check failed",
            error_code="DATABASE_UNAVAILABLE",
            details=status_payload,
            status_code=status_code
        )
        
    return ApiResponse.success(data=status_payload, message="System is healthy.", status_code=status_code)

@health_bp.route("/version", methods=["GET"])
def version_check():
    """Returns application version information."""
    return ApiResponse.success(
        data={
            "name": "Pikud360 Workforce Management System",
            "version": "1.0.0-beta",
            "api_version": "v1"
        },
        message="Version retrieved."
    )

@health_bp.route("/status", methods=["GET"])
def status_check():
    """Returns runtime configuration status and uptime."""
    settings = get_settings()
    uptime_seconds = time.time() - START_TIME
    
    status_data = {
        "environment": settings.ENV,
        "debug_mode": settings.DEBUG,
        "testing_mode": settings.TESTING,
        "uptime": f"{uptime_seconds:.2f}s",
        "uptime_seconds": int(uptime_seconds),
        "db_pool_status": {
            "min_connections": settings.DB_MIN_CONNECTIONS,
            "max_connections": settings.DB_MAX_CONNECTIONS
        }
    }
    return ApiResponse.success(data=status_data, message="System status retrieved.")

@health_bp.route("/api", methods=["GET"])
def api_index():
    """Lists available root endpoints and api routes."""
    return ApiResponse.success(
        data={
            "endpoints": [
                {"path": "/health", "method": "GET", "description": "System health summary"},
                {"path": "/version", "method": "GET", "description": "Application version details"},
                {"path": "/status", "method": "GET", "description": "Runtime system statistics"},
                {"path": "/api", "method": "GET", "description": "Index of system endpoints"}
            ]
        },
        message="Available endpoints catalog."
    )
