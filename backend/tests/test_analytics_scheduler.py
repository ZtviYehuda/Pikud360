import pytest
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock, patch

from app.modules.analytics.scheduler import SchedulerEngine, JobDefinition, JobAlreadyRunningException
from app.modules.analytics.repositories.job_repository import JobRepository


@pytest.fixture
def mock_job_repo():
    """Mock JobRepository database queries."""
    with patch("app.modules.analytics.scheduler.JobRepository") as mock_class:
        instance = mock_class.return_value
        instance.log_job_start.return_value = "job-run-uuid-123"
        instance.get_last_job_run.return_value = None
        instance.get_job_stats.return_value = {
            "average_duration_ms": 150,
            "error_count": 1,
            "records_processed": 5,
            "last_duration_ms": 140,
            "last_success": datetime.now() - timedelta(hours=1),
            "last_failure": datetime.now() - timedelta(hours=2)
        }
        yield instance


@pytest.fixture
def mock_analytics_repo():
    """Mock AnalyticsRepository for active unit resolutions."""
    with patch("app.modules.analytics.scheduler.AnalyticsRepository") as mock_class:
        instance = mock_class.return_value
        instance.load_all_active_units.return_value = [
            {"tenant_id": "tenant-111", "unit_id": "unit-111"},
            {"tenant_id": "tenant-222", "unit_id": "unit-222"}
        ]
        yield instance


# ─── Scheduler Core Engine Tests ───────────────────────────────────────────

def test_job_definition_registry_init():
    """Verify default job definitions exist in the engine registry."""
    engine = SchedulerEngine()
    assert "snapshot" in engine.registry
    assert "alerts" in engine.registry
    assert "cleanup" in engine.registry
    
    snapshot_job = engine.registry["snapshot"]
    assert snapshot_job.enabled is True
    assert snapshot_job.supports_manual_run is True
    assert snapshot_job.supports_schedule is True


def test_scheduler_engine_start_stop():
    """Verify scheduler engine start and stop toggles."""
    engine = SchedulerEngine()
    assert engine._started is False
    
    engine.start()
    assert engine._started is True
    
    engine.stop()
    assert engine._started is False


def test_scheduler_engine_manual_run_and_lock(mock_job_repo):
    """Verify thread-safe execution locks block concurrent job runs of the same name."""
    engine = SchedulerEngine()
    engine._job_repo = mock_job_repo

    # Register a blocking job mock
    def blocking_callback():
        # Assert that lock is active inside callback
        assert engine.is_running("test_job") is True
        return 10

    engine.registry["test_job"] = JobDefinition(
        name="test_job",
        description="Test Concurrency Lock",
        callback=blocking_callback
    )

    res = engine.run_job("test_job")
    assert res["success"] is True
    assert res["records_processed"] == 10
    
    # Assert lock is released after run
    assert engine.is_running("test_job") is False
    mock_job_repo.log_job_start.assert_called_once_with("test_job", None)
    mock_job_repo.log_job_end.assert_called_once()


def test_scheduler_engine_concurrent_run_rejection(mock_job_repo):
    """Verify that triggering an already running job raises JobAlreadyRunningException."""
    engine = SchedulerEngine()
    engine._job_repo = mock_job_repo

    # Set job state to running directly
    engine._running_jobs.add("snapshot")
    
    with pytest.raises(JobAlreadyRunningException):
        engine.run_job("snapshot")


def test_scheduler_engine_failure_recovery_logging(mock_job_repo):
    """Verify exceptions in callback are caught, lock released, and logged to history."""
    engine = SchedulerEngine()
    engine._job_repo = mock_job_repo

    def failing_callback():
        raise RuntimeError("Operational database timeout error")

    engine.registry["failing_job"] = JobDefinition(
        name="failing_job",
        description="Fails consistently",
        callback=failing_callback,
        supports_retry=True
    )

    res = engine.run_job("failing_job")
    assert res["success"] is False
    assert "Operational database timeout error" in res["error_message"]
    assert engine.is_running("failing_job") is False
    mock_job_repo.log_job_end.assert_called_once_with(
        "job-run-uuid-123", False, "Operational database timeout error", 0
    )


# ─── Scheduler Core Job Callbacks Tests ────────────────────────────────────

def test_snapshot_job_execution(mock_analytics_repo):
    """Verify snapshot generation triggers recursively for all active units."""
    engine = SchedulerEngine()
    engine._analytics_repo = mock_analytics_repo
    
    # Mock generator to avoid actual database triggers
    engine._snapshot_generator = MagicMock()
    engine._snapshot_generator.generate_snapshot.return_value = {"success": True, "records_processed": 5}
    
    processed = engine._run_snapshot_job()
    assert processed == 10  # 2 units * 5 records
    assert engine._snapshot_generator.generate_snapshot.call_count == 2


def test_cleanup_job_execution(mock_job_repo):
    """Verify cleanup job queries settings and triggers multi-resource database pruning."""
    engine = SchedulerEngine()
    engine._job_repo = mock_job_repo
    
    # Mock settings value retrieve
    engine._get_setting_value = MagicMock(return_value="30")
    mock_job_repo.prune_all_expired_data.return_value = 150
    
    deleted = engine._run_cleanup_job()
    assert deleted == 150
    engine._get_setting_value.assert_called_once_with("scheduler_retention_days", "90")
    mock_job_repo.prune_all_expired_data.assert_called_once_with(30)
