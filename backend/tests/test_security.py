import json
import pytest
import bcrypt
from unittest.mock import MagicMock, patch
from flask_jwt_extended import decode_token
from app.modules.security.services import SecurityService

@pytest.fixture
def hashed_password():
    salt = bcrypt.gensalt()
    return bcrypt.hashpw("secure_pass_123".encode('utf-8'), salt).decode('utf-8')

@pytest.fixture
def mock_db(hashed_password):
    """Mocks database connections and returns cursor for assertions by patching the root Connection Manager."""
    with patch("app.database.connection.DatabaseConnectionManager.get_connection") as mock_get_conn:
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value = mock_conn

        mock_cur.active_query = ""
        mock_cur.rowcount = 1

        # Intercept execute calls to save active query name
        def execute_hook(query, params=None):
            mock_cur.active_query = query
            return None

        mock_cur.execute.side_effect = execute_hook

        # Return mocked row based on active query target
        def fetchone_hook():
            q = mock_cur.active_query.lower().strip() if mock_cur.active_query else ""
            if "count(*)" in q or "count(" in q:
                # Return rate limit failed attempts count
                return (0,)
            elif "returning failed_login_attempts" in q:
                return (1,)
            elif "core.tenants" in q:
                return ("tenant-uuid-456", "Tenant Name", "tenant_code_123", True)
            elif "security.users" in q:
                if q.startswith("update"):
                    return (1,)
                # Return User tuple
                return (
                    "user-uuid-123",
                    "tenant-uuid-456",
                    "test_user",
                    "test@example.com",
                    hashed_password,
                    True,
                    0,
                    None,
                    None,
                    None,
                    None
                )
            elif "security.user_sessions" in q:
                # Return UserSession tuple
                return (
                    "session-uuid-789",
                    "user-uuid-123",
                    "session-token-hash",
                    "device",
                    "127.0.0.1",
                    None,
                    None,
                    None
                )
            elif "security.user_login_history" in q:
                # Return UserLoginHistory tuple
                return (
                    "history-uuid-abc",
                    "user-uuid-123",
                    "tenant-uuid-456",
                    "session-uuid-789",
                    "PASSWORD",
                    None,
                    "127.0.0.1",
                    None,
                    "pytest-agent",
                    True,
                    None
                )
            return None

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.return_value = []
        yield mock_cur

def test_password_hashing():
    """Test standard service password hashing."""
    service = SecurityService(MagicMock(), MagicMock(), MagicMock(), MagicMock(), MagicMock())
    password = "MySecurePassword123"
    
    hashed = service.hash_password(password)
    assert hashed != password
    assert service.verify_password(password, hashed) is True
    assert service.verify_password("WrongPassword", hashed) is False

def test_login_success(client, mock_db, app):
    """Test login with valid credentials."""
    payload = {
        "username": "test_user",
        "password": "secure_pass_123",
        "tenant_code": "tenant_code_123"
    }
    
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert "access_token" in res_data["data"]
    assert "refresh_token" in res_data["data"]
    
    # Decode token within app context to verify tenant, role, and permission claims
    with app.app_context():
        claims = decode_token(res_data["data"]["access_token"])
        assert claims["sub"] == "user-uuid-123"
        assert claims["tenant_id"] == "tenant-uuid-456"
        assert "roles" in claims
        assert "permissions" in claims

def test_login_invalid_password(client, mock_db):
    """Test login fails when input credentials are incorrect."""
    payload = {
        "username": "test_user",
        "password": "wrong_password_here",
        "tenant_code": "tenant_code_123"
    }
    
    original_fetchone = mock_db.fetchone.side_effect
    
    def bad_password_fetch():
        q = mock_db.active_query.lower().strip()
        if "count(*)" in q or "count(" in q:
            return (0,)
        if "returning failed_login_attempts" in q:
            return (1,)
        if "security.users" in q:
            if q.startswith("update"):
                return (1,)
            return (
                "user-uuid-123",
                "tenant-uuid-456",
                "test_user",
                "test@example.com",
                "some_different_hashed_password",
                True,
                0,
                None,
                None,
                None,
                None
            )
        return original_fetchone()
        
    mock_db.fetchone.side_effect = bad_password_fetch
    
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    
    res_data = json.loads(response.data)
    assert res_data["success"] is False
    assert "Invalid username or password" in res_data["message"]

def test_login_invalid_payload(client, mock_db):
    """Test validation errors for empty username or passwords."""
    payload = {
        "username": "",
        "password": "",
        "tenant_code": ""
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 400
    
    res_data = json.loads(response.data)
    assert res_data["success"] is False

def test_token_refresh_rotation(client, mock_db, hashed_password):
    """Test refresh token rotation (RTR) generating new refresh tokens and revoking old ones."""
    payload = {
        "username": "test_user",
        "password": "secure_pass_123",
        "tenant_code": "tenant_code_123"
    }
    login_res = client.post("/api/auth/login", json=payload)
    refresh_token = json.loads(login_res.data)["data"]["refresh_token"]

    mock_db.rowcount = 1

    headers = {"Authorization": f"Bearer {refresh_token}"}
    response = client.post("/api/auth/refresh", headers=headers)
    assert response.status_code == 200
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert "access_token" in res_data["data"]
    assert "refresh_token" in res_data["data"] # Rotated token returned

def test_logout(client, mock_db):
    """Test revoking active session tokens on logout."""
    payload = {
        "username": "test_user",
        "password": "secure_pass_123",
        "tenant_code": "tenant_code_123"
    }
    login_res = client.post("/api/auth/login", json=payload)
    refresh_token = json.loads(login_res.data)["data"]["refresh_token"]

    mock_db.rowcount = 1

    headers = {"Authorization": f"Bearer {refresh_token}"}
    response = client.post("/api/auth/logout", headers=headers)
    assert response.status_code == 200
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True

def test_rate_limiting_block(client, mock_db):
    """Test login API blocks request when rate limits are exceeded."""
    original_fetchone = mock_db.fetchone.side_effect

    def rate_limit_fetch():
        q = mock_db.active_query.lower()
        if "count(*)" in q or "count(" in q:
            return (12,)
        return original_fetchone()
        
    mock_db.fetchone.side_effect = rate_limit_fetch
    
    payload = {
        "username": "test_user",
        "password": "secure_pass_123",
        "tenant_code": "tenant_code_123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 429
    
    res_data = json.loads(response.data)
    assert res_data["success"] is False
    assert "Too many failed login attempts" in res_data["message"]
