import json
import pytest
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token

from app.modules.workforce.encryption import encrypt_value, generate_blind_index
from app.modules.workforce.schemas import EmployeeResponse
from app.core.authorization import ScopeType

@pytest.fixture
def mock_employee_data():
    """Generates valid AES-256-GCM encrypted PII data blocks for the database mock tuple."""
    phone_cipher, phone_nonce, phone_tag = encrypt_value("+123456789")
    email_cipher, email_nonce, email_tag = encrypt_value("test@employee.com")
    bd_cipher, bd_nonce, bd_tag = encrypt_value("1990-01-01")
    
    phone_hash = generate_blind_index("+123456789")
    email_hash = generate_blind_index("test@employee.com")
    
    return {
        "phone_cipher": phone_cipher, "phone_nonce": phone_nonce, "phone_tag": phone_tag, "phone_hash": phone_hash,
        "email_cipher": email_cipher, "email_nonce": email_nonce, "email_tag": email_tag, "email_hash": email_hash,
        "bd_cipher": bd_cipher, "bd_nonce": bd_nonce, "bd_tag": bd_tag
    }

@pytest.fixture
def mock_db(mock_employee_data):
    """Mocks database connection cursors and intercepts execute statements to return structured mock records."""
    with patch("app.database.connection.DatabaseConnectionManager.get_connection") as mock_get_conn:
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value = mock_conn

        mock_cur.active_query = ""
        mock_cur.query_history = []
        mock_cur.rowcount = 1

        def execute_hook(query, params=None):
            mock_cur.active_query = query
            mock_cur.query_history.append((query, params))
            return None

        mock_cur.execute.side_effect = execute_hook

        # Row tuple for employees table query matching
        emp_row = (
            "employee-uuid-111",      # id
            "user-uuid-123",          # user_id
            None,                     # commander_id
            "unit-uuid-555",          # org_unit_id
            "EMP-10023",              # employee_number
            "John",                   # first_name
            "Doe",                    # last_name
            mock_employee_data["phone_cipher"],
            mock_employee_data["phone_nonce"],
            mock_employee_data["phone_tag"],
            mock_employee_data["phone_hash"],
            mock_employee_data["email_cipher"],
            mock_employee_data["email_nonce"],
            mock_employee_data["email_tag"],
            mock_employee_data["email_hash"],
            mock_employee_data["bd_cipher"],
            mock_employee_data["bd_nonce"],
            mock_employee_data["bd_tag"],
            "Captain",                # rank
            "Operations Chief",       # position
            "Regular Service",        # service_type
            "ACTIVE",                 # status
            None, None, None, None, None  # timestamps / creators
        )

        def fetchone_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "count(*)" in q:
                # Mock count for direct children checks
                return (1,)
            elif "security.users" in q:
                # Return User tuple
                return (
                    "user-uuid-123", "tenant-uuid-456", "test_user", "test@example.com",
                    "some_hashed_pass", True, 0, None, None, None, None
                )
            elif "workforce.employees" in q:
                # Return employee row
                return emp_row
            elif "workforce.employee_history" in q:
                # Return history row mock
                return (
                    "history-uuid", "employee-uuid-111", "EMPLOYEE_CREATED",
                    "unit-uuid-555", None, "Captain", "Operations Chief", "Regular Service", "ACTIVE",
                    "{}", None, "user-uuid-123", None
                )
            return None

        def fetchall_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "role_permissions" in q or "permissions" in q:
                # Mock user permissions
                return [("employees.*", "ORGANIZATION_UNIT")]
            elif "user_organization_access" in q:
                # Mock user unit mappings
                return [("unit-uuid-555",)]
            elif "workforce.employees" in q:
                return [emp_row]
            return []

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.side_effect = fetchall_hook
        yield mock_cur


def test_create_employee_authorized(client, mock_db, app):
    """Test creating an employee succeeds when correct permissions and scopes are held."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    payload = {
        "org_unit_id": "unit-uuid-555",
        "employee_number": "EMP-10023",
        "first_name": "John",
        "last_name": "Doe",
        "birthdate": "1990-01-01",
        "rank": "Captain",
        "position": "Operations Chief",
        "service_type": "Regular Service",
        "phone": "+123456789",
        "personal_email": "test@employee.com",
        "status": "ACTIVE"
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/workforce/employees", json=payload, headers=headers)
    assert response.status_code == 201
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert res_data["data"]["first_name"] == "John"
    assert res_data["data"]["personal_email"] == "test@employee.com" # Plain decrypted

def test_create_employee_unauthorized_scope(client, mock_db, app):
    """Test creating an employee gets rejected if the manager lacks access scope for the target unit."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Setup mock to return access to another unit only (e.g. unit-uuid-999)
    def fetchall_mismatch():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.create", "ORGANIZATION_UNIT")]
        elif "user_organization_access" in q:
            return [("unit-uuid-999",)]
        return []

    mock_db.fetchall.side_effect = fetchall_mismatch

    payload = {
        "org_unit_id": "unit-uuid-555", # Manager has no access here
        "employee_number": "EMP-10023",
        "first_name": "John",
        "last_name": "Doe",
        "birthdate": "1990-01-01",
        "rank": "Captain",
        "position": "Operations Chief",
        "service_type": "Regular Service"
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/workforce/employees", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Access Denied" in json.loads(response.data)["error"]["message"]

    # Verify UNAUTHORIZED_ACCESS audit is recorded in the execution log history list parameters
    audit_logged = False
    for q, params in mock_db.query_history:
        if "audit.audit_logs" in q.lower() and params and "UNAUTHORIZED_ACCESS" in params:
            audit_logged = True
            break
    assert audit_logged is True

def test_get_employee_authorized(client, mock_db, app):
    """Test viewing an employee in authorized scope decrypts PII and creates VIEW audit logs."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/workforce/employees/employee-uuid-111", headers=headers)
    assert response.status_code == 200
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert res_data["data"]["first_name"] == "John"
    assert res_data["data"]["phone"] == "+123456789" # Decrypted
    assert res_data["data"]["personal_email"] == "test@employee.com" # Decrypted

def test_blind_index_search(mock_db, mock_employee_data, app):
    """Test searching employee using blind index executes without decrypting rows."""
    from app.modules.workforce.repositories import EmployeeRepository
    repo = EmployeeRepository()
    
    with app.app_context():
        # Executing lookup via email blind index hash
        emp = repo.search_by_email_hash(mock_employee_data["email_hash"])
    
    assert emp is not None
    assert emp.id == "employee-uuid-111"
    
    # Assert query history checks the index exactly rather than decryption functions
    assert any("email_blind_index = %s" in q.lower() or "email_blind_index =" in q.lower() for q, params in mock_db.query_history)

def test_employee_history_created(client, mock_db, app):
    """Test that creating an employee successfully registers change history snapshots."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    payload = {
        "org_unit_id": "unit-uuid-555",
        "employee_number": "EMP-10023",
        "first_name": "John",
        "last_name": "Doe",
        "birthdate": "1990-01-01",
        "rank": "Captain",
        "position": "Operations Chief",
        "service_type": "Regular Service"
    }

    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/workforce/employees", json=payload, headers=headers)
    
    # Verify employee history is created by inspecting SQL execution records
    assert any("workforce.employee_history" in q.lower() for q, params in mock_db.query_history)

def test_self_scope_validation(client, mock_db, app):
    """Test that SELF scope allows an employee to retrieve their own profile even without unit-level roles."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Setup permissions to hold SELF scope only
    def fetchall_self():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("employees.view", "SELF")]
        elif "user_organization_access" in q:
            return [] # No units mapped
        return []

    mock_db.fetchall.side_effect = fetchall_self

    headers = {"Authorization": f"Bearer {token}"}
    # Requesting profile of employee linked to user-uuid-123
    response = client.get("/api/workforce/employees/employee-uuid-111", headers=headers)
    assert response.status_code == 200
    assert json.loads(response.data)["success"] is True
