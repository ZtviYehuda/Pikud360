import json
import pytest
from datetime import date, datetime
from unittest.mock import MagicMock, patch

from app.modules.analytics.services import AnalyticsService
from app.modules.analytics.models import AlertRule, TrendPeriod
from app.core.authorization.exceptions import AccessDeniedError

# Define some default mock fixtures

@pytest.fixture
def mock_repo():
    """Mock database access repositories for testing business logic calculators."""
    with patch("app.modules.analytics.services.AnalyticsRepository") as mock_class:
        instance = mock_class.return_value
        
        # Default mock: subtree unit resolution
        instance.load_organization_subtree.return_value = ["unit-111", "unit-222"]
        
        # Default mock: immediate child units (using side_effect to prevent circular loop recursion)
        def load_child_units_side_effect(uid):
            if uid == "unit-111":
                return [{"id": "unit-222", "name": "Sub-Unit"}]
            return []
        instance.load_child_units.side_effect = load_child_units_side_effect
        
        # Default mock: total employees count
        instance.load_employee_counts.return_value = 50
        
        # Default mock: schedule statuses
        instance.load_schedule_statuses.return_value = [
            {"id": "s1", "code": "AVAILABLE", "category": "AVAILABLE"},
            {"id": "s2", "code": "SICK", "category": "SICK"},
            {"id": "s3", "code": "VACATION", "category": "VACATION"},
            {"id": "s4", "code": "TRAINING", "category": "TRAINING"}
        ]
        
        # Default mock: SQL aggregated status counts query scaled by timeframe days
        def load_status_counts_side_effect(descendant_ids, start_date, end_date):
            num_days = (end_date - start_date).days + 1
            return {
                "s1": 2 * num_days,
                "s2": 1 * num_days,
                "s3": 1 * num_days
            }
        instance.load_status_counts.side_effect = load_status_counts_side_effect

        # Default mock: active shifts count
        instance.load_active_shifts_count.return_value = 12
        
        yield instance


@pytest.fixture
def mock_snapshot_repo():
    """Mock snapshot repository database calls."""
    with patch("app.modules.analytics.services.SnapshotRepository") as mock_class:
        instance = mock_class.return_value
        yield instance


@pytest.fixture
def mock_alert_repo():
    """Mock alert rules configurations."""
    with patch("app.modules.analytics.services.AlertRepository") as mock_class:
        instance = mock_class.return_value
        
        # Default mock alert rules
        instance.load_alert_rules.return_value = [
            AlertRule(
                id="rule-1",
                tenant_id="tenant-123",
                name="High Sick Rate",
                metric_name="SICK_PERCENTAGE",
                operator=">",
                threshold_value=5.00,
                evaluation_period="TODAY",
                severity="WARNING"
            ),
            AlertRule(
                id="rule-2",
                tenant_id="tenant-123",
                name="Manpower Shortage Alert",
                metric_name="AVAILABILITY_PERCENTAGE",
                operator="<",
                threshold_value=70.00,
                evaluation_period="LAST_7_DAYS",
                severity="CRITICAL"
            )
        ]
        
        yield instance


# ─── Business Logic Calculations Tests ─────────────────────────────────────

def test_summary_calculator_calculations(mock_repo):
    """Test SummaryCalculator basic count, averages, and percentages aggregation."""
    from app.modules.analytics.services import SummaryCalculator
    calc = SummaryCalculator(mock_repo)
    
    res = calc.calculate_summary("tenant-123", "unit-111", date(2026, 7, 14), date(2026, 7, 14))
    
    # 50 employees, 1 day = 50 total slots.
    # Schedules: 2 AVAILABLE, 1 SICK, 1 VACATION. Total assigned = 4.
    assert res["total_personnel"] == 50
    assert res["assigned"] == 4.0
    assert res["unassigned"] == 46.0
    assert res["available"] == 2.0
    assert res["unavailable"] == 2.0
    
    # Percentages: total_slots = 50.
    # assigned_pct = 4 / 50 * 100 = 8.0
    assert res["assigned_percentage"] == 8.0
    # availability_pct = 2 / 50 * 100 = 4.0
    assert res["availability_percentage"] == 4.0
    # absence_pct = (sick=1 + vacation=1) / 50 * 100 = 4.0
    assert res["absence_percentage"] == 4.0
    # unassigned_pct = 46 / 50 * 100 = 92.0
    assert res["unassigned_percentage"] == 92.0


def test_trend_calculator_periods(mock_repo):
    """Test TrendCalculator output structures for daily intervals."""
    from app.modules.analytics.services import SummaryCalculator, TrendCalculator
    summary_calc = SummaryCalculator(mock_repo)
    calc = TrendCalculator(mock_repo, summary_calc)
    
    trends = calc.calculate_trends("tenant-123", "unit-111", date(2026, 7, 14), date(2026, 7, 15), TrendPeriod.DAILY)
    
    assert len(trends) == 2
    assert trends[0]["date"] == date(2026, 7, 14)
    assert trends[1]["date"] == date(2026, 7, 15)
    assert trends[0]["total_personnel"] == 50
    assert trends[0]["assigned"] == 4
    assert trends[0]["readiness_percentage"] == 4.0
    assert trends[0]["status_distribution"]["SICK"] == 1


def test_snapshot_generator(mock_repo, mock_snapshot_repo):
    """Test SnapshotGenerator builds and inserts snapshot records with metadata."""
    from app.modules.analytics.services import SnapshotGenerator
    gen = SnapshotGenerator(mock_repo, mock_snapshot_repo)
    
    res = gen.generate_snapshot("tenant-123", "unit-111", date(2026, 7, 14), 12)
    
    assert res["success"] is True
    assert res["records_processed"] == 50
    assert isinstance(res["duration_ms"], int)
    
    # Assert database upsert repository was triggered
    mock_snapshot_repo.upsert_snapshot.assert_called_once()
    args, _ = mock_snapshot_repo.upsert_snapshot.call_args
    assert args[0]["tenant_id"] == "tenant-123"
    assert args[0]["org_unit_id"] == "unit-111"
    assert args[0]["readiness_percentage"] == 4.0  # (available=2 / total=50) * 100


def test_alert_evaluator_triggers(mock_repo, mock_alert_repo):
    """Test AlertEvaluator calculates and flags correct alerts according to threshold metrics."""
    from app.modules.analytics.services import SummaryCalculator, AlertEvaluator
    summary_calc = SummaryCalculator(mock_repo)
    evaluator = AlertEvaluator(mock_repo, mock_alert_repo, summary_calc)
    
    alerts = evaluator.evaluate_alerts("tenant-123", "unit-111", date(2026, 7, 14))
    
    # 2 configured rules
    assert len(alerts) == 2
    
    # Rule 1: High Sick Rate. operator '>', threshold 5.0. 
    # Current value = sick_slots=1 / total_slots=50 * 100 = 2.0%. 
    # 2.0 > 5.0 is False, so is_triggered should be False.
    sick_alert = next(a for a in alerts if a["rule_name"] == "High Sick Rate")
    assert sick_alert["current_value"] == 2.0
    assert sick_alert["is_triggered"] is False
    
    # Rule 2: Manpower Shortage. operator '<', threshold 70.0.
    # Current value = available_slots=14 / total_slots=350 * 100 = 4.0%.
    # 4.0 < 70.0 is True, so is_triggered should be True.
    shortage_alert = next(a for a in alerts if a["rule_name"] == "Manpower Shortage Alert")
    assert shortage_alert["current_value"] == 4.0
    assert shortage_alert["is_triggered"] is True


# ─── API Routes Scopes & Authorization Tests ───────────────────────────────

def test_analytics_service_authorization_checks(mock_repo, mock_snapshot_repo, mock_alert_repo):
    """Verify that AnalyticsService enforces correct RBAC permissions and organization scopes."""
    service = AnalyticsService()
    
    # Inject mocked repos
    service.summary_calculator._repo = mock_repo
    service.trend_calculator._repo = mock_repo
    service.snapshot_generator._repo = mock_repo
    service.alert_evaluator._repo = mock_repo
    service.alert_evaluator._alert_repo = mock_alert_repo
    service._analytics_repo = mock_repo
    service._snapshot_repo = mock_snapshot_repo
    service._alert_repo = mock_alert_repo
    
    # 1. No view permission → Lacks analytics.view
    with patch("app.modules.analytics.services.resolve_access_scope") as mock_resolve:
        mock_resolve.return_value = MagicMock(permissions=["other.perm"], scope_type="GLOBAL")
        with pytest.raises(AccessDeniedError):
            service.get_summary("tenant-123", "unit-111", date(2026, 7, 14), date(2026, 7, 14), "user-999")
            
    # 2. Unit ID not in permitted scope → Scope restricted
    with patch("app.modules.analytics.services.resolve_access_scope") as mock_resolve:
        mock_resolve.return_value = MagicMock(permissions=["analytics.view"], organization_units=["unit-333"], scope_type="ORGANIZATION_UNIT")
        with pytest.raises(AccessDeniedError):
            service.get_summary("tenant-123", "unit-111", date(2026, 7, 14), date(2026, 7, 14), "user-999")
            
    # 3. Successful query with correct view permissions and scope
    with patch("app.modules.analytics.services.resolve_access_scope") as mock_resolve:
        mock_resolve.return_value = MagicMock(permissions=["analytics.view"], organization_units=["unit-111"], scope_type="ORGANIZATION_UNIT")
        res = service.get_summary("tenant-123", "unit-111", date(2026, 7, 14), date(2026, 7, 14), "user-999")
        assert res["total_personnel"] == 50
        assert res["assigned"] == 4.0
        
    # 4. Successful snapshot trigger using analytics.manage permission
    with patch("app.modules.analytics.services.resolve_access_scope") as mock_resolve:
        mock_resolve.return_value = MagicMock(permissions=["analytics.manage"], organization_units=["unit-111"], scope_type="ORGANIZATION_UNIT")
        res = service.trigger_snapshot_generation("tenant-123", "unit-111", date(2026, 7, 14), 12, "user-999")
        assert res["success"] is True
