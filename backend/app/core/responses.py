from flask import jsonify, Response
from typing import Any, Optional, Tuple

class ApiResponse:
    """Standardized API JSON response generator."""
    
    @staticmethod
    def success(
        data: Any = None, 
        message: Optional[str] = None, 
        meta: Optional[dict] = None, 
        status_code: int = 200
    ) -> Tuple[Response, int]:
        """Generates a standardized success response."""
        response_body = {
            "success": True,
            "data": data,
            "message": message or "Request processed successfully.",
        }
        if meta is not None:
            response_body["meta"] = meta
            
        return jsonify(response_body), status_code

    @staticmethod
    def error(
        message: str, 
        error_code: str = "INTERNAL_SERVER_ERROR", 
        details: Any = None, 
        status_code: int = 500
    ) -> Tuple[Response, int]:
        """Generates a standardized error response."""
        response_body = {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "details": details
            }
        }
        return jsonify(response_body), status_code
