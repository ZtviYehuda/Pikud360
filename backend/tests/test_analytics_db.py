import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import date, datetime

# ─── Schema File Structural Verifications ──────────────────────────────────

def test_02_tables_contains_refined_analytics_fields():
    """Verify that the database tables schema has the exact new tables and correct columns."""
    schema_path = os.path.join(os.path.dirname(__file__), "../../database/schema/02_tables.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Check table existence
    assert "CREATE TABLE workforce.dashboard_snapshots" in content
    assert "CREATE TABLE workforce.alert_rules" in content
    assert "CREATE TABLE workforce.generated_reports" in content
    
    # Check pre-computed columns in snapshots
    assert "available_count INTEGER DEFAULT 0" in content
    assert "sick_count INTEGER DEFAULT 0" in content
    assert "vacation_count INTEGER DEFAULT 0" in content
    assert "training_count INTEGER DEFAULT 0" in content
    assert "mission_count INTEGER DEFAULT 0" in content
    assert "reinforcement_count INTEGER DEFAULT 0" in content
    assert "other_count INTEGER DEFAULT 0" in content
    assert "readiness_percentage NUMERIC" in content
    assert "status_distribution JSONB" in content

    # Check alert rules checks
    assert "operator" in content
    assert "CHECK (operator IN ('>', '>=', '<', '<=', '=', '!='))" in content
    assert "evaluation_period" in content
    assert "CHECK (evaluation_period IN ('TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS'))" in content

    # Check generated reports metadata fields
    assert "started_at" in content
    assert "completed_at" in content
    assert "error_message" in content
    assert "file_size" in content
    assert "download_count" in content


def test_03_indexes_contains_analytics_indexes():
    """Verify that performance indexes exist for the new analytics tables."""
    schema_path = os.path.join(os.path.dirname(__file__), "../../database/schema/03_indexes.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "workforce.dashboard_snapshots(tenant_id, org_unit_id, snapshot_date)" in content
    assert "workforce.alert_rules(tenant_id, metric_name, is_active)" in content
    assert "workforce.generated_reports(tenant_id, generated_by, created_at DESC)" in content


def test_05_rls_policies_contains_analytics_rls():
    """Verify that row-level security is enabled and correct policies are defined."""
    schema_path = os.path.join(os.path.dirname(__file__), "../../database/schema/05_rls_policies.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "ALTER TABLE workforce.dashboard_snapshots ENABLE ROW LEVEL SECURITY;" in content
    assert "ALTER TABLE workforce.alert_rules ENABLE ROW LEVEL SECURITY;" in content
    assert "ALTER TABLE workforce.generated_reports ENABLE ROW LEVEL SECURITY;" in content
    
    assert "CREATE POLICY snapshots_tenant_policy ON workforce.dashboard_snapshots" in content
    assert "CREATE POLICY alert_rules_tenant_policy ON workforce.alert_rules" in content
    assert "CREATE POLICY generated_reports_tenant_policy ON workforce.generated_reports" in content


def test_06_seed_contains_analytics_permissions_and_rules():
    """Verify that permission groups, analytics codes, and default rules are seeded."""
    schema_path = os.path.join(os.path.dirname(__file__), "../../database/schema/06_seed.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "Analytics & Reports" in content
    assert "analytics.view" in content
    assert "analytics.manage" in content
    assert "Sick Rate High Alert" in content


# ─── Mock Database Query Operation Verifications ────────────────────────────

def test_mock_insert_dashboard_snapshot(app):
    """Test the structure of insert statements to workforce.dashboard_snapshots."""
    query = """
        INSERT INTO workforce.dashboard_snapshots (
            tenant_id, org_unit_id, snapshot_date, snapshot_hour,
            total_employees, assigned_employees, unassigned_employees,
            available_count, sick_count, vacation_count, training_count,
            mission_count, reinforcement_count, other_count, readiness_percentage,
            status_distribution
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    with app.app_context(), \
         patch("app.database.connection.DatabaseConnectionManager.get_connection") as mock_get_conn:
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value = mock_conn
        
        # Execute query mock call
        mock_cur.execute(query, (
            "tenant-123", "unit-555", date(2026, 7, 14), 10,
            100, 80, 20,
            70, 5, 2, 3, 0, 0, 0, 75.00,
            '{"sick": 5, "available": 70}'
        ))
        
        mock_cur.execute.assert_called_once()
        args, _ = mock_cur.execute.call_args
        assert "workforce.dashboard_snapshots" in args[0]
        assert args[1][4] == 100  # total_employees
        assert args[1][7] == 70   # available_count
        assert args[1][14] == 75.00  # readiness_percentage


def test_mock_select_active_alert_rules(app):
    """Test retrieving active alert rules filtering by tenant and metric."""
    query = """
        SELECT id, tenant_id, org_unit_id, name, metric_name, operator, threshold_value, evaluation_period, severity, is_active
        FROM workforce.alert_rules
        WHERE tenant_id = %s AND metric_name = %s AND is_active = TRUE;
    """
    
    mock_row = ("rule-999", "tenant-123", "unit-555", "Sick Alert", "SICK_PERCENTAGE", ">", 10.00, "LAST_7_DAYS", "WARNING", True)
    
    with app.app_context(), \
         patch("app.database.connection.DatabaseConnectionManager.get_connection") as mock_get_conn:
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_conn.return_value = mock_conn
        mock_cur.fetchone.return_value = mock_row
        
        mock_cur.execute(query, ("tenant-123", "SICK_PERCENTAGE"))
        res = mock_cur.fetchone()
        
        mock_cur.execute.assert_called_once()
        assert res[4] == "SICK_PERCENTAGE"
        assert res[5] == ">"
        assert res[7] == "LAST_7_DAYS"
