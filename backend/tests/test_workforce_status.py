import json
import pytest
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token
from datetime import date, time

@pytest.fixture
def mock_db():
    """Mocks database connection cursors and intercepts execution statements for daily planning tests."""
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

        # Row tuple for workforce.employees
        emp_row = (
            "employee-uuid-111",      # id
            "user-uuid-123",          # user_id
            None,                     # commander_id
            "unit-uuid-555",          # org_unit_id
            "EMP-10023",              # employee_number
            "John",                   # first_name
            "Doe",                    # last_name
            b"phone_cipher", b"nonce", b"tag", None,
            b"email_cipher", b"nonce", b"tag", None,
            b"bd_cipher", b"nonce", b"tag",
            "Captain", "Operations Chief", "Regular Service", "ACTIVE",
            None, None, None, None, None
        )

        status_row = ("status-uuid-sick", "tenant-uuid-456", "SICK", "Sick", "SICK", "#F44336", True, 20, "user-uuid-123", None, None)
        settings_row = ("settings-uuid-999", "tenant-uuid-456", "unit-uuid-555", "DIRECT_STATUS", "user-uuid-123", None, None, 10.0, 5.0, 70.0)

        def fetchone_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "count" in q:
                return (1,)
            elif "security.users" in q:
                return (
                    "user-uuid-123", "tenant-uuid-456", "test_user", "test@example.com",
                    "some_hashed_pass", True, 0, None, None, None, None
                )
            elif "workforce.employees" in q:
                return emp_row
            elif "workforce.schedule_settings" in q:
                return settings_row
            elif "workforce.shift_types" in q:
                return ("shift-uuid-morning", "tenant-uuid-456", "unit-uuid-555", "Morning", time(7, 0), time(15, 0), True, "user-uuid-123", None)
            elif "workforce.schedule_statuses" in q:
                return status_row
            elif "workforce.employee_daily_schedule" in q:
                return (
                    "schedule-uuid-999", "tenant-uuid-456", "employee-uuid-111", "unit-uuid-555",
                    date(2026, 8, 1), "status-uuid-sick", None, None, None, "Feeling unwell", "user-uuid-123", "user-uuid-123", None, None
                )
            return None

        def fetchall_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "role_permissions" in q or "permissions" in q:
                return [
                    ("schedule.view", "ORGANIZATION_UNIT"),
                    ("schedule.manage", "ORGANIZATION_UNIT"),
                    ("schedule.bulk_manage", "ORGANIZATION_UNIT"),
                    ("schedule.settings_manage", "ORGANIZATION_UNIT"),
                    ("schedule.status_manage", "ORGANIZATION_UNIT")
                ]
            elif "user_organization_access" in q:
                return [("unit-uuid-555",)]
            elif "workforce.schedule_statuses" in q:
                return [status_row]
            elif "workforce.employee_daily_schedule" in q:
                return [
                    ("schedule-uuid-999", "tenant-uuid-456", "employee-uuid-111", "unit-uuid-555",
                     date(2026, 8, 1), "status-uuid-sick", "shift-uuid-morning", None, None, "Feeling unwell", "user-uuid-123", "user-uuid-123", None, None)
                ]
            return []

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.side_effect = fetchall_hook
        yield mock_cur


def test_direct_status_mode(client, mock_db, app):
    """Test assigning daily status under DIRECT_STATUS mode restricts shift parameters."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Direct status successful assign
    payload_success = {
        "employee_id": "employee-uuid-111",
        "organization_unit_id": "unit-uuid-555",
        "schedule_date": "2026-08-01",
        "status_id": "status-uuid-sick",
        "notes": "Recovering"
    }
    response = client.post("/api/scheduling/assign", json=payload_success, headers=headers)
    assert response.status_code == 21
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert res_data["data"]["status_id"] == "status-uuid-sick"
    assert any("SCHEDULE_ASSIGNMENT_CREATED" in str(params) for q, params in mock_db.query_history if params)

    # 2. Block shift parameters under DIRECT_STATUS mode
    payload_blocked = {
        "employee_id": "employee-uuid-111",
        "organization_unit_id": "unit-uuid-555",
        "schedule_date": "2026-08-01",
        "status_id": "status-uuid-sick",
        "shift_type_id": "shift-uuid-morning"
    }
    response = client.post("/api/scheduling/assign", json=payload_blocked, headers=headers)
    assert response.status_code == 400
    assert "DIRECT_STATUS" in json.loads(response.data)["error"]["message"]



def test_shift_based_mode(client, mock_db, app):
    """Test shift assignment validations under SHIFT_BASED scheduling configuration mode."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Mock settings mode to SHIFT_BASED
    original_fetchone = mock_db.fetchone.side_effect
    def fetchone_shift_mode():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "workforce.schedule_settings" in q:
            return ("settings-uuid-999", "tenant-uuid-456", "unit-uuid-555", "SHIFT_BASED", "user-uuid-123", None, None, 10.0, 5.0, 70.0)
        elif "insert into workforce.employee_daily_schedule" in q:
            return (
                "schedule-uuid-999", "tenant-uuid-456", "employee-uuid-111", "unit-uuid-555",
                date(2026, 8, 1), "status-uuid-sick", "shift-uuid-morning", time(7, 0), time(15, 0), "With Shift", "user-uuid-123", "user-uuid-123", None, None
            )
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_shift_mode

    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Error when shift_type_id is missing in SHIFT_BASED mode
    payload_missing_shift = {
        "employee_id": "employee-uuid-111",
        "organization_unit_id": "unit-uuid-555",
        "schedule_date": "2026-08-01",
        "status_id": "status-uuid-sick"
    }
    response = client.post("/api/scheduling/assign", json=payload_missing_shift, headers=headers)
    assert response.status_code == 400
    assert "Shift type is required" in json.loads(response.data)["error"]["message"]


    # 2. Successful shift assignment
    payload_success = {
        "employee_id": "employee-uuid-111",
        "organization_unit_id": "unit-uuid-555",
        "schedule_date": "2026-08-01",
        "status_id": "status-uuid-sick",
        "shift_type_id": "shift-uuid-morning",
        "start_time": "07:00",
        "end_time": "15:00",
        "notes": "With Shift"
    }
    response = client.post("/api/scheduling/assign", json=payload_success, headers=headers)
    assert response.status_code == 21
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert res_data["data"]["shift_type_id"] == "shift-uuid-morning"


def test_commander_only_access(client, mock_db, app):
    """Test that unauthorized users lacking permissions are blocked from planning endpoints."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Intercept permissions fetch to return empty list
    mock_db.fetchall.side_effect = lambda: []

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/scheduling/date/2026-08-01?unit_id=unit-uuid-555", headers=headers)
    assert response.status_code == 403


def test_bulk_status_assignment(client, mock_db, app):
    """Test assigning planning daily statuses to multiple employee profiles simultaneously."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    payload = {
        "organization_unit_id": "unit-uuid-555",
        "date": "2026-08-01",
        "status_id": "status-uuid-sick",
        "employee_ids": ["employee-uuid-111", "employee-uuid-222"]
    }

    # Setup mocks for loop lookups and custom insert returns
    original_fetchone = mock_db.fetchone.side_effect
    def fetchone_bulk():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "workforce.employees" in q:
            return (
                "employee-uuid-bulk", "user-uuid-loop", None, "unit-uuid-555", "EMP-bulk",
                "Bulk", "Person", b"", b"", b"", None, b"", b"", b"", None, b"", b"", b"",
                "Captain", "Operations Chief", "Regular Service", "ACTIVE",
                None, None, None, None, None
            )
        elif "insert into workforce.employee_daily_schedule" in q:
            return (
                "schedule-uuid-bulk", "tenant-uuid-456", "employee-uuid-bulk", "unit-uuid-555",
                date(2026, 8, 1), "status-uuid-sick", None, None, None, "Bulk Assignment", "user-uuid-123", "user-uuid-123", None, None
            )
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_bulk

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/scheduling/bulk", json=payload, headers=headers)
    assert response.status_code == 21
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert len(res_data["data"]) == 2
    assert any("SCHEDULE_BULK_ASSIGNMENT_CREATED" in str(params) for q, params in mock_db.query_history if params)


def test_schedule_settings_permissions(client, mock_db, app):
    """Test modifying unit scheduling configuration mode with correct settings permissions."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    original_fetchone = mock_db.fetchone.side_effect
    def fetchone_settings():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "update workforce.schedule_settings" in q:
            return ("settings-uuid-999", "tenant-uuid-456", "unit-uuid-555", "SHIFT_BASED", "user-uuid-123", None, None, 10.0, 5.0, 70.0)
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_settings

    headers = {"Authorization": f"Bearer {token}"}
    payload = {"scheduling_mode": "SHIFT_BASED"}
    
    response = client.put("/api/scheduling/settings/unit-uuid-555", json=payload, headers=headers)
    assert response.status_code == 200
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    assert res_data["data"]["scheduling_mode"] == "SHIFT_BASED"
    assert any("SCHEDULE_SETTINGS_CHANGED" in str(params) for q, params in mock_db.query_history if params)


def test_status_distribution_dashboard(client, mock_db, app):
    """Test getting daily aggregates overview summary checks unassigned metrics and status distributions."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    original_fetchone = mock_db.fetchone.side_effect
    def fetchone_dashboard():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "schedule_settings" in q:
            # DIRECT_STATUS mode
            return ("settings-uuid-999", "tenant-uuid-456", "unit-uuid-555", "DIRECT_STATUS", "user-uuid-123", None, None, 10.0, 5.0, 70.0)
        elif "count(*)" in q:
            # 15 active personnel total in unit
            return (15,)
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_dashboard

    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Fetch in DIRECT_STATUS mode (shifts count omitted)
    response = client.get("/api/scheduling/dashboard/unit-uuid-555/2026-08-01", headers=headers)
    assert response.status_code == 200
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    
    summary = res_data["data"]
    assert summary["total_employees"] == 15
    assert summary["assigned_employees"] == 1
    assert summary["unassigned_employees"] == 14
    assert summary["statuses"]["SICK"] == 1
    assert "shifts" not in summary

    # 2. Fetch in SHIFT_BASED mode (shifts count populated)
    def fetchone_dashboard_shift():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "schedule_settings" in q:
            return ("settings-uuid-999", "tenant-uuid-456", "unit-uuid-555", "SHIFT_BASED", "user-uuid-123", None, None, 10.0, 5.0, 70.0)
        elif "count(*)" in q:
            return (15,)
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_dashboard_shift

    response = client.get("/api/scheduling/dashboard/unit-uuid-555/2026-08-01", headers=headers)
    assert response.status_code == 200
    res_data = json.loads(response.data)
    assert res_data["data"]["shifts"]["MORNING"] == 1


def test_system_status_deletion_protection(client, mock_db, app):
    """Test that system default scheduling status codes cannot be disabled or deleted."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})

    # Setup mock status fetch returning system default code "SICK"
    original_fetchone = mock_db.fetchone.side_effect
    def fetchone_system_status():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "workforce.schedule_statuses" in q:
            return ("status-uuid-sick", "tenant-uuid-456", "SICK", "Sick", "SICK", "#F44336", True, 20, "user-uuid-123", None, None)
        return original_fetchone()
    mock_db.fetchone.side_effect = fetchone_system_status

    headers = {"Authorization": f"Bearer {token}"}
    response = client.delete("/api/scheduling/statuses/status-uuid-sick", headers=headers)
    assert response.status_code == 400
    assert "System default status types cannot be deleted" in json.loads(response.data)["error"]["message"]


def test_commander_allowed_subtree(client, mock_db, app):
    """Test that commander gets forbidden error (403) when trying to access a unit outside their scope."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
    headers = {"Authorization": f"Bearer {token}"}

    # Mock user organization access context: user only has access to "unit-uuid-555" (and descendants)
    original_fetchall = mock_db.fetchall.side_effect
    def fetchall_allowed_units():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "user_organization_access" in q or "organization_unit_closure" in q:
            return [("unit-uuid-555",)] # only unit-uuid-555 is allowed
        return original_fetchall()
    mock_db.fetchall.side_effect = fetchall_allowed_units

    # Requesting employees for forbidden unit "unit-uuid-999" should return 403 Forbidden
    response = client.get("/api/scheduling/unit/unit-uuid-999/employees?date=2026-08-01", headers=headers)
    assert response.status_code == 403
    assert "access" in json.loads(response.data)["error"]["message"].lower()

    # Requesting allowed unit should succeed (200)
    response_allowed = client.get("/api/scheduling/unit/unit-uuid-555/employees?date=2026-08-01", headers=headers)
    assert response_allowed.status_code == 200
    res_data = json.loads(response_allowed.data)
    assert isinstance(res_data["data"], list)


def test_dashboard_child_units_aggregation(client, mock_db, app):
    """Test that the dashboard correctly aggregates child units and descendants recursively."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup database mocks to return child units for unit-uuid-555
    original_fetchall = mock_db.fetchall.side_effect
    def fetchall_hierarchy():
        q = mock_db.active_query.lower() if mock_db.active_query else ""
        if "organization_units" in q and "parent_id =" in q:
            # Immediate children of unit-uuid-555
            return [("unit-uuid-child1", "Child Unit 1")]
        elif "organization_unit_closure" in q:
            return [("unit-uuid-555",), ("unit-uuid-child1",)]
        return original_fetchall()
    mock_db.fetchall.side_effect = fetchall_hierarchy

    response = client.get("/api/scheduling/dashboard/unit-uuid-555/2026-08-01", headers=headers)
    assert response.status_code == 200
    res_data = json.loads(response.data)
    assert "child_units" in res_data["data"]
    assert len(res_data["data"]["child_units"]) > 0
    assert res_data["data"]["child_units"][0]["unit_name"] == "Child Unit 1"


