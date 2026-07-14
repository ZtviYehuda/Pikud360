from flask import jsonify
from flask_jwt_extended import JWTManager
from app.modules.security.repositories import UserRepository

jwt = JWTManager()

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """Maps token sub identifier to database User entity."""
    user_id = jwt_data["sub"]
    user_repo = UserRepository()
    try:
        return user_repo.get_by_id(user_id)
    except Exception:
        return None

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handles expired JWT authentication tokens."""
    return jsonify({
        "success": False,
        "message": "The token has expired.",
        "error": "token_expired"
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    """Handles invalid token formatting errors."""
    return jsonify({
        "success": False,
        "message": f"Signature verification failed: {error_string}",
        "error": "invalid_token"
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    """Handles missing authorization headers."""
    return jsonify({
        "success": False,
        "message": f"Authorization header is missing or invalid: {error_string}",
        "error": "authorization_required"
    }), 401
