import logging
from flask import Flask
from werkzeug.exceptions import HTTPException
from app.core.responses import ApiResponse
from app.core.authorization.exceptions import AccessDeniedError


logger = logging.getLogger("pikud360.errors")

class AppError(Exception):
    """Base Application Exception for known domain errors."""
    def __init__(self, message: str, status_code: int = 400, error_code: str = "BAD_REQUEST", details = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details

class ValidationError(AppError):
    def __init__(self, message: str = "Validation failed", details = None):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR", details=details)

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401, error_code="UNAUTHORIZED")

class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=403, error_code="FORBIDDEN")

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404, error_code="NOT_FOUND")

class DatabaseError(AppError):
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status_code=500, error_code="DATABASE_ERROR")

def register_error_handlers(app: Flask) -> None:
    """Registers global exception handlers to format all exceptions as JSON."""
    
    @app.errorhandler(AppError)
    def handle_app_error(error: AppError):
        logger.warning(f"Domain error [{error.error_code}]: {error.message}")
        return ApiResponse.error(
            message=error.message,
            error_code=error.error_code,
            details=error.details,
            status_code=error.status_code
        )

    @app.errorhandler(AccessDeniedError)
    def handle_access_denied_error(error: AccessDeniedError):
        logger.warning(f"Access Denied: {error.message}")
        return ApiResponse.error(
            message=error.message,
            error_code="FORBIDDEN",
            status_code=403
        )


    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        logger.warning(f"HTTP exception: {error.name} - {error.description}")
        return ApiResponse.error(
            message=error.description or error.name,
            error_code=f"HTTP_{error.code}",
            status_code=error.code
        )

    @app.errorhandler(Exception)
    def handle_generic_exception(error: Exception):
        logger.error(f"Unhandled system error: {error}", exc_info=True)
        return ApiResponse.error(
            message="An unexpected system error occurred. Please contact support.",
            error_code="INTERNAL_SERVER_ERROR",
            status_code=500
        )
