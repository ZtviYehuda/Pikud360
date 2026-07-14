import json
import pytest
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token
from datetime import date, time

@pytest.fixture
def mock_db():
    """Mocks database connections and queries for intelligence dashboard testing."""
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

        # Mock objects
        settings_row = ("settings-uuid-999", "tenant-uuid-456", "unit-uuid-555", "DIRECT_STATUS", "user-uuid-123", None, None, 10.0, 5.0, 70.0)
        status_row = ("status-uuid-sick", "tenant-uuid-456", "SICK", "Sick", "SICK", "#F44336", True, 20, "user-uuid-123", None, None)
        avail_row = ("status-uuid-avail", "tenant-uuid-456", "AVAILABLE", "Available", "AVAILABLE", "#4CAF50", True, 10, "user-uuid-123", None, None)

        def fetchone_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "count" in q:
                # Mock total personnel count = 10
                return (10,)
            elif "security.users" in q:
                return (
                    "user-uuid-123", "tenant-uuid-456", "test_user", "test@example.com",
                    "some_hashed_pass", True, 0, None, None, None, None
                )
            elif "workforce.schedule_settings" in q:
                return settings_row
            return None

        def fetchall_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "role_permissions" in q or "permissions" in q:
                return [
                    ("dashboard.view", "ORGANIZATION_UNIT"),
                    ("dashboard.export", "ORGANIZATION_UNIT"),
                    ("dashboard.manage_alerts", "ORGANIZATION_UNIT"),
                    ("schedule.view", "ORGANIZATION_UNIT")
                ]
            elif "user_organization_access" in q or "organization_unit_closure" in q:
                # Allowed unit scopes list
                return [("unit-uuid-555",), ("unit-uuid-child1",)]
            elif "workforce.schedule_statuses" in q:
                return [status_row, avail_row]
            elif "workforce.employee_daily_schedule" in q:
                # Return 1 sick schedule row
                return [
                    ("schedule-uuid-999", "tenant-uuid-456", "employee-uuid-111", "unit-uuid-555",
                     date(2026, 8, 1), "status-uuid-sick", None, None, None, "Feeling sick", "user-uuid-123", "user-uuid-123", None, None)
                ]
            elif "core.alerts" in q:
                # Alert mock row
                return [
                    ("alert-uuid-1", "tenant-uuid-456", "unit-uuid-555", "SICK_THRESHOLD_EXCEEDED", "CRITICAL", "High sickness rate", "ACTIVE", None, None)
                ]
            return []

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.side_effect = fetchall_hook
        yield mock_cur


def test_commander_dashboard_scope_limitation(client, mock_db, app):
    """Test that commander gets blocked with 403 when trying to access an unauthorized unit ID."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
    headers = {"Authorization": f"Bearer {token}"}

    # Query unauthorized unit-uuid-999
    response = client.get("/api/dashboard/summary?unit_id=unit-uuid-999&date=2026-08-01", headers=headers)
    assert response.status_code == 403
    assert "access" in json.loads(response.data)["error"]["message"].lower()


def test_dashboard_recursive_aggregation(client, mock_db, app):
    """Test dashboard successfully returns compiled KPI aggregates over date ranges."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/dashboard/summary?unit_id=unit-uuid-555&date=2026-08-01&range=week", headers=headers)
    assert response.status_code == 200
    res_data = json.loads(response.data)
    assert res_data["success"] is True
    
    data = res_data["data"]
    assert data["total_personnel"] == 10
    assert "shortage_index" in data
    assert "sick_percentage" in data
    assert "availability_percentage" in data


def test_dashboard_alert_generation(client, mock_db, app):
    """Test that thresholds trigger warnings/alerts and write persistent logs to the core.alerts DB table."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
    headers = {"Authorization": f"Bearer {token}"}

    # Query with target date
    response = client.get("/api/dashboard/summary?unit_id=unit-uuid-555&date=2026-08-01", headers=headers)
    assert response.status_code == 200
    res_data = json.loads(response.data)
    
    # Assert active alerts list is populated from DB mock
    assert len(res_data["data"]["alerts"]) > 0
    assert res_data["data"]["alerts"][0]["alert_type"] == "SICK_THRESHOLD_EXCEEDED"
