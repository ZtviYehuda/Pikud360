import json
import pytest
from unittest.mock import MagicMock, patch
from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token

from app.core.authorization.scopes import ScopeType, AuthorizationContext
from app.core.authorization.decorators import require_permission

# Define a test blueprint inside the test package to verify decorator routing behaviors
test_auth_bp = Blueprint("test_auth", __name__)

@test_auth_bp.route("/test/global-view", methods=["GET"])
@require_permission("employees.view", ScopeType.GLOBAL)
def global_view():
    return jsonify({"success": True, "message": "Access Granted"}), 200

@test_auth_bp.route("/test/unit-view/<unit_id>", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def unit_view(unit_id):
    return jsonify({"success": True, "message": "Access Granted"}), 200

@test_auth_bp.route("/test/child-view/<unit_id>", methods=["GET"])
@require_permission("employees.view", ScopeType.DIRECT_CHILDREN)
def child_view(unit_id):
    return jsonify({"success": True, "message": "Access Granted"}), 200

@test_auth_bp.route("/test/self-view/<user_id>", methods=["GET"])
@require_permission("employees.view", ScopeType.SELF)
def self_view(user_id):
    return jsonify({"success": True, "message": "Access Granted"}), 200

@test_auth_bp.route("/test/wildcard-view", methods=["GET"])
@require_permission("employees.update", ScopeType.GLOBAL)
def wildcard_view():
    return jsonify({"success": True, "message": "Access Granted"}), 200


@pytest.fixture(autouse=True)
def register_test_blueprint(app):
    """Registers test_auth_bp on Flask testing application factory."""
    if "test_auth" not in app.blueprints:
        app.register_blueprint(test_auth_bp)
    yield

@pytest.fixture
def mock_db():
    """Mocks database queries returning permissions, user tuples, unit lists, and closure relations."""
    with patch("app.database.connection.DatabaseConnectionManager.get_connection") as mock_get_conn:
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value = mock_conn

        mock_cur.active_query = ""
        mock_cur.rowcount = 1

        def execute_hook(query, params=None):
            mock_cur.active_query = query
            return None

        mock_cur.execute.side_effect = execute_hook

        # Default results hook
        def fetchone_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "count(*)" in q:
                # Return 1 for direct children validation query
                return (1,)
            elif "security.users" in q:
                # Return User tuple
                return (
                    "user-uuid-123",
                    "tenant-uuid-456",
                    "test_user",
                    "test@example.com",
                    "some_password_hash",
                    True,
                    0,
                    None,
                    None,
                    None,
                    None
                )
            return None

        def fetchall_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "role_permissions" in q or "permissions" in q:
                # User has 'employees.*' wildcard permission, and has 'ORGANIZATION_UNIT' scope
                return [("employees.*", "ORGANIZATION_UNIT")]
            elif "user_organization_access" in q:
                # User has access to unit-uuid-111
                return [("unit-uuid-111",)]
            return []

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.side_effect = fetchall_hook
        yield mock_cur


def test_permission_granted_success(client, mock_db, app):
    """Test accessing a route with valid permissions and scopes."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/test/unit-view/unit-uuid-111", headers=headers)
    assert response.status_code == 200
    assert json.loads(response.data)["success"] is True

def test_permission_denied_forbidden(client, mock_db, app):
    """Test accessing a route with a unit not within the user's allowed organizational units list."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Setup database mock to return an empty units list for this call
    def fetchall_restricted():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.view", "ORGANIZATION_UNIT")]
        return [] # No units assigned
        
    mock_db.fetchall.side_effect = fetchall_restricted

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/test/unit-view/unit-uuid-999", headers=headers)
    assert response.status_code == 403
    assert "Access Denied" in json.loads(response.data)["error"]["message"]


    # Verify UNAUTHORIZED_ACCESS audit log is generated
    # The active query when failing should contain audit_logs insert statement
    assert "audit.audit_logs" in mock_db.active_query.lower()

def test_wildcard_permission_resolves(client, mock_db, app):
    """Test that wildcard permission 'employees.*' matches requested 'employees.update' action."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Mock user roles to contain wildcard permission
    def fetchall_wildcard():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.*", "GLOBAL")]
        return []
        
    mock_db.fetchall.side_effect = fetchall_wildcard

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/test/wildcard-view", headers=headers)
    assert response.status_code == 200
    assert json.loads(response.data)["success"] is True

def test_self_scope_access_granted(client, mock_db, app):
    """Test SELF scope granting access when target resource matches the user's ID."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    def fetchall_self():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.view", "SELF")]
        return []
        
    mock_db.fetchall.side_effect = fetchall_self

    headers = {"Authorization": f"Bearer {token}"}
    # Requesting resource owned by self ("user-uuid-123")
    response = client.get("/test/self-view/user-uuid-123", headers=headers)
    assert response.status_code == 200

def test_self_scope_access_denied(client, mock_db, app):
    """Test SELF scope blocking access when target resource belongs to another user."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    def fetchall_self():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.view", "SELF")]
        return []
        
    mock_db.fetchall.side_effect = fetchall_self

    headers = {"Authorization": f"Bearer {token}"}
    # Requesting resource owned by another user ("user-uuid-999")
    response = client.get("/test/self-view/user-uuid-999", headers=headers)
    assert response.status_code == 403

def test_direct_children_scope_granted(client, mock_db, app):
    """Test DIRECT_CHILDREN scope allows accessing immediate subtrees when depth is <= 1."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    def fetchall_child():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.view", "DIRECT_CHILDREN")]
        return []
        
    mock_db.fetchall.side_effect = fetchall_child

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/test/child-view/unit-uuid-111", headers=headers)
    assert response.status_code == 200
