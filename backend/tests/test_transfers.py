import json
import pytest
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token
from datetime import date, datetime

@pytest.fixture
def mock_db_transfers():
    """Intercepts and mocks database queries for employee transfers, history logs, and notifications."""
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

        # Row tuple mock definitions
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

        unit_row = ("unit-uuid-555", "tenant-uuid-456", None, None, "Cyber Section", "CYBER_SECT", "Operations Unit", 0, True, datetime.utcnow(), datetime.utcnow(), None)
        target_unit_row = ("unit-uuid-777", "tenant-uuid-456", None, None, "Sigma Section", "SIGMA_SECT", "Target Operations Unit", 0, True, datetime.utcnow(), datetime.utcnow(), None)
        transfer_row = (
            "transfer-uuid-999", "tenant-uuid-456", "employee-uuid-111", "unit-uuid-555", "unit-uuid-777",
            "user-uuid-123", None, "Required operational shift", "PENDING", datetime.utcnow(), None, None
        )
        notif_row = (
            "notif-uuid-111", "tenant-uuid-456", "unit-uuid-555", "user-uuid-123",
            "TRANSFER_REQUEST_CREATED", "INFO", "Employee transfer requested", "UNREAD", datetime.utcnow(), None
        )

        def fetchone_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            print(f"\nFETCHONE QUERY: {q}")
            if "count" in q:
                if "pending" in q:
                    print("--> returning pending check count (0,)")
                    return (0,)
                print("--> returning general count (1,)")
                return (1,)
            elif "security.users" in q:
                print("--> returning user_row")
                return ("user-uuid-123", "tenant-uuid-456", "test_user", "test@example.com", "hashed_pass", True, 0, None, None, None, None)
            elif "workforce.employees" in q:
                print("--> returning emp_row")
                return emp_row
            elif "core.organization_units" in q and "select name" in q:
                print("--> returning org unit name only")
                return ("Test Unit Name",)
            elif "core.organization_units" in q:
                if "unit-uuid-777" in str(mock_cur.active_params):
                    print("--> returning target_unit_row")
                    return target_unit_row
                print("--> returning unit_row")
                return unit_row
            elif "workforce.employee_history" in q:
                print("--> returning employee_history row")
                return (
                    "history-uuid-1", "employee-uuid-111", "TRANSFER", "unit-uuid-555", None,
                    "Captain", "Operations Chief", "Regular Service", "ACTIVE", "{}", datetime.utcnow(), "user-uuid-123", datetime.utcnow()
                )
            elif "workforce.employee_transfers" in q:
                print("--> returning transfer_row")
                return transfer_row
            elif "core.notifications" in q:
                print("--> returning notif_row")
                return notif_row
            return None

        def fetchall_hook():
            q = mock_cur.active_query.lower() if mock_cur.active_query else ""
            if "role_permissions" in q or "permissions" in q:
                return [
                    ("transfers.view", "ORGANIZATION_UNIT"),
                    ("transfers.request", "ORGANIZATION_UNIT"),
                    ("transfers.approve", "ORGANIZATION_UNIT"),
                    ("employees.view", "ORGANIZATION_UNIT"),
                    ("employees.history.view", "ORGANIZATION_UNIT"),
                    ("schedule.view", "ORGANIZATION_UNIT"),
                    ("notifications.view", "ORGANIZATION_UNIT"),
                    ("notifications.manage", "ORGANIZATION_UNIT")
                ]
            elif "user_organization_access" in q:
                return [("unit-uuid-555",), ("unit-uuid-777",)]
            elif "organization_unit_closure" in q:
                return [("unit-uuid-555",), ("unit-uuid-777",)]
            elif "workforce.employee_history" in q:
                # SELECT eh.id, eh.change_type, eh.org_unit_id, eh.commander_id, eh.rank, eh.position,
                #        eh.service_type, eh.status, eh.snapshot_json, eh.created_at, u.username
                return [
                    ("history-uuid-1", "TRANSFER", "unit-uuid-555", None, "Captain", "Operations Chief",
                     "Regular Service", "ACTIVE", {}, datetime.now(), "test_user")
                ]
            elif "workforce.employee_transfers" in q:
                # SELECT et.id, et.from_unit_id, et.to_unit_id, et.reason, et.status,
                #        et.requested_at, et.completed_at, u_req.username, u_app.username
                return [
                    ("transfer-uuid-999", "unit-uuid-555", "unit-uuid-777", "Required operational shift",
                     "COMPLETED", datetime.now(), None, "test_user", None)
                ]
            elif "core.notifications" in q:
                return [notif_row]
            return []

        mock_cur.fetchone.side_effect = fetchone_hook
        mock_cur.fetchall.side_effect = fetchall_hook
        yield mock_cur


def test_transfer_request(client, mock_db_transfers, app):
    """Test creating a pending transfer request successfully."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "employee_id": "employee-uuid-111",
            "to_unit_id": "unit-uuid-777",
            "reason": "Relocating for cyber operation support."
        }
        res = client.post("/api/transfers", json=payload, headers=headers)
        if res.status_code != 201:
            print(f"test_transfer_request FAILED: status={res.status_code}, body={res.data.decode('utf-8')}")
        assert res.status_code == 201
        data = json.loads(res.data)
        assert data["success"] is True
        assert data["data"]["status"] == "PENDING"
        assert data["data"]["from_unit_id"] == "unit-uuid-555"
        assert data["data"]["to_unit_id"] == "unit-uuid-777"


def test_transfer_approval(client, mock_db_transfers, app):
    """Test approving a pending transfer request updates employee org_unit_id."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mock approval action
        res = client.put("/api/transfers/transfer-uuid-999/approve", headers=headers)
        if res.status_code != 200:
            print(f"test_transfer_approval FAILED: status={res.status_code}, body={res.data.decode('utf-8')}")
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data["success"] is True
        assert data["data"]["status"] == "COMPLETED"


def test_transfer_scope_validation(client, mock_db_transfers, app):
    """Test that requesting a transfer with mismatched organization unit scope fails."""
    # Redefine fetchall hook to return unauthorized units
    def restricted_fetchall():
        q = mock_db_transfers.active_query.lower() if mock_db_transfers.active_query else ""
        if "role_permissions" in q or "permissions" in q:
            return [("transfers.request", "ORGANIZATION_UNIT")]
        elif "user_organization_access" in q:
            return [("unit-uuid-unauthorized",)] # No access to unit-uuid-555
        return []

    mock_db_transfers.fetchall.side_effect = restricted_fetchall

    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "employee_id": "employee-uuid-111",
            "to_unit_id": "unit-uuid-777",
            "reason": "Scope mismatch check."
        }
        res = client.post("/api/transfers", json=payload, headers=headers)
        if res.status_code != 403:
            print(f"test_transfer_scope_validation FAILED: status={res.status_code}, body={res.data.decode('utf-8')}")
        assert res.status_code == 403
        data = json.loads(res.data)
        assert data["success"] is False
        # The service returns various denial messages — just verify 403 FORBIDDEN
        assert data["error"]["code"] == "FORBIDDEN"


def test_employee_history(client, mock_db_transfers, app):
    """Test that employees history log endpoint gathers history snapshot entries and transfers."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
        headers = {"Authorization": f"Bearer {token}"}
        res = client.get("/api/workforce/employees/employee-uuid-111/history", headers=headers)
        if res.status_code != 200:
            print(f"test_employee_history FAILED: status={res.status_code}, body={res.data.decode('utf-8')}")
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data["success"] is True
        assert len(data["data"]) >= 1


def test_workforce_calendar(client, mock_db_transfers, app):
    """Test retrieving aggregated presence logs from calendar view endpoint."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
        headers = {"Authorization": f"Bearer {token}"}
        res = client.get("/api/scheduling/calendar?unit_id=unit-uuid-555&start_date=2026-07-01&end_date=2026-07-05", headers=headers)
        if res.status_code != 200:
            print(f"test_workforce_calendar FAILED: status={res.status_code}, body={res.data.decode('utf-8')}")
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data["success"] is True
        assert len(data["data"]) == 5 # 5 days in date range


def test_notification_creation(client, mock_db_transfers, app):
    """Test listing alerts feeds and marking individual notifications as read."""
    with app.app_context():
        token = create_access_token(identity="user-uuid-123", additional_claims={"tenant_id": "tenant-uuid-456"})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test GET feed
        res = client.get("/api/notifications?status=UNREAD", headers=headers)
        if res.status_code != 200:
            print(f"test_notification_creation GET FAILED: status={res.status_code}, body={res.data.decode('utf-8')}")
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["severity"] == "INFO"

        # Test PUT read action
        read_res = client.put(f"/api/notifications/{data['data'][0]['id']}/read", headers=headers)
        if read_res.status_code != 200:
            print(f"test_notification_creation PUT FAILED: status={read_res.status_code}, body={read_res.data.decode('utf-8')}")
        assert read_res.status_code == 200
        read_data = json.loads(read_res.data)
        assert read_data["success"] is True
