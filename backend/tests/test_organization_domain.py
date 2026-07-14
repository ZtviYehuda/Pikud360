import json
import pytest
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token

@pytest.fixture
def mock_db():
    """Mocks database connection cursors and tracks active queries with parameter contexts."""
    with patch("app.database.connection.DatabaseConnectionManager.get_connection") as mock_get_conn:
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value = mock_conn

        mock_cur.active_query = ""
        mock_cur.active_params = None
        mock_cur.query_history = []
        mock_cur.rowcount = 1

        def execute_hook(query, params=None):
            mock_cur.active_query = query
            mock_cur.active_params = params
            mock_cur.query_history.append((query, params))
            return None

        mock_cur.execute.side_effect = execute_hook

        # Organization Unit row representation
        unit_row = (
            "unit-uuid-111",          # id
            "tenant-uuid-456",        # tenant_id
            None,                     # parent_id (root)
            "type-uuid-999",          # type_id
            "HQ Command",             # name
            "HQ-01",                  # code
            "Main headquarters unit", # description
            0,                        # sort_order
            True,                     # is_active
            None, None, None          # dates
        )

        child_row = (
            "unit-uuid-222",          # id
            "tenant-uuid-456",        # tenant_id
            "unit-uuid-111",          # parent_id
            "type-uuid-999",          # type_id
            "Operations Division",    # name
            "OPS-02",                 # code
            "Operations division",    # description
            1,                        # sort_order
            True,                     # is_active
            None, None, None          # dates
        )

        def fetchone_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "count(*)" in q:
                return (1,)
            elif "security.users" in q:
                return (
                    "user-uuid-123", "tenant-uuid-456", "test_user", "test@example.com",
                    "some_hashed_pass", True, 0, None, None, None, None
                )
            elif "core.organization_units" in q:
                if "parent_id = %s" in q or "parent_id is null" in q:
                    return None
                return unit_row
            elif "core.organization_unit_commanders" in q:
                if "is_active = true" in q:
                    return ("employee-uuid-777",)
                return None
            return None

        def fetchall_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "role_permissions" in q or "permissions" in q:
                # Return wildcard capabilities
                return [("organization.*", "ORGANIZATION_UNIT")]
            elif "user_organization_access" in q:
                return [("unit-uuid-111",), ("unit-uuid-222",)]
            elif "core.organization_units" in q:
                if "parent_id is null" in q:
                    return [unit_row]
                elif "parent_id = %s" in q:
                    # Prevent mock recursion loops: only return children for root parent HQ unit
                    if mock_cur.active_params and mock_cur.active_params[0] == "unit-uuid-111":
                        return [child_row]
                    return []
                elif "descendant_id =" in q:
                    # Return child as descendant for loop checks
                    return [child_row]
                elif "ancestor_id =" in q:
                    # Return parent as ancestor
                    return [unit_row]
                return [unit_row, child_row]
            return []

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.side_effect = fetchall_hook
        yield mock_cur


def test_create_unit_authorized(client, mock_db, app):
    """Test that creating an organization unit succeeds when operator is authorized."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    payload = {
        "type_id": "type-uuid-999",
        "name": "HQ Command",
        "code": "HQ-01",
        "parent_id": None,
        "description": "Main headquarters unit",
        "sort_order": 0
    }

    # Setup mock to return that unit code doesn't exist yet
    original_fetchone = mock_db.fetchone.side_effect
    def fetchone_check_code():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "code = %s" in q:
            return None # Unique code
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_check_code

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/organization/units", json=payload, headers=headers)
    assert response.status_code == 21
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert res_data["data"]["name"] == "HQ Command"
    assert res_data["data"]["code"] == "HQ-01"

    # Verify audit log is recorded
    assert any("ORGANIZATION_UNIT_CREATED" in str(params) for q, params in mock_db.query_history if params)


def test_create_unit_duplicate_code(client, mock_db, app):
    """Test that unit onboarding fails if code is already registered in the tenant."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    payload = {
        "type_id": "type-uuid-999",
        "name": "Branch HQ",
        "code": "HQ-01" # Already exists in database mock
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/organization/units", json=payload, headers=headers)
    assert response.status_code == 400
    assert "already exists in tenant" in json.loads(response.data)["error"]["message"]


def test_get_nested_tree(client, mock_db, app):
    """Test fetching organization units loads recursive parent-child tree mapping."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/organization/units", headers=headers)
    assert response.status_code == 200
    
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert len(res_data["data"]) == 1
    # Verify child node is nested under roots
    assert res_data["data"][0]["name"] == "HQ Command"
    assert len(res_data["data"][0]["children"]) == 1
    assert res_data["data"][0]["children"][0]["name"] == "Operations Division"


def test_circular_move_prevention(client, mock_db, app):
    """Test that moving a unit under its own descendant is blocked as circular reference."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Setup permissions to hold manage hierarchy roles
    def fetchall_hierarchy():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("organization.manage_hierarchy", "ORGANIZATION_UNIT")]
        elif "user_organization_access" in q:
            return [("unit-uuid-111",)]
        elif "core.organization_units" in q:
            # When looking up descendants of unit-uuid-111, return child-uuid-222
            return [
                ("unit-uuid-222", "tenant-uuid-456", "unit-uuid-111", "type-uuid-999", "Child", "CH-1", "", 0, True, None, None, None)
            ]
        return []

    mock_db.fetchall.side_effect = fetchall_hierarchy

    # Moving unit-uuid-111 under unit-uuid-222 (which is its child descendant)
    payload = {"parent_id": "unit-uuid-222"}

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/organization/units/unit-uuid-111/move", json=payload, headers=headers)
    assert response.status_code == 400
    assert "circular reference" in json.loads(response.data)["error"]["message"].lower()


def test_assign_commander(client, mock_db, app):
    """Test assigning a unit commander updates status and generates COMMANDER_CHANGED logs."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    payload = {"commander_id": "employee-uuid-888"}

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/organization/units/unit-uuid-111/commander", json=payload, headers=headers)
    assert response.status_code == 200
    assert json.loads(response.data)["success"] is True

    # Verify COMMANDER_CHANGED log audit parameters
    assert any("COMMANDER_CHANGED" in str(params) for q, params in mock_db.query_history if params)
