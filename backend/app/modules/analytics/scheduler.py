"""
Analytics module reusable background Scheduler Engine.
Provides JobDefinition, JobRegistry, and SchedulerEngine completely decoupled from Flask.
"""
import logging
import threading
from dataclasses import dataclass
from datetime import datetime, date, timedelta
from typing import Callable, List, Dict, Any, Optional, Set

from app.modules.analytics.repositories import AnalyticsRepository, SnapshotRepository, AlertRepository, JobRepository
from app.modules.analytics.services import SnapshotGenerator, SummaryCalculator, AlertEvaluator

logger = logging.getLogger("pikud360.modules.analytics.scheduler")


class JobAlreadyRunningException(Exception):
    """Raised when trying to execute a job that is currently active."""
    pass


@dataclass
class JobDefinition:
    """Structured configuration and callbacks definition for scheduled jobs."""
    name: str
    description: str
    callback: Callable[[], int]  # Callback returns records_processed count
    enabled: bool = True
    interval_setting_key: Optional[str] = None
    supports_manual_run: bool = True
    supports_schedule: bool = True
    supports_retry: bool = True


class SchedulerEngine:
    """Extensible execution engine for background jobs, fully independent of Flask."""

    def __init__(self):
        self._analytics_repo = AnalyticsRepository()
        self._snapshot_repo = SnapshotRepository()
        self._alert_repo = AlertRepository()
        self._job_repo = JobRepository()

        # Instantiate business calculators
        self._snapshot_generator = SnapshotGenerator(self._analytics_repo, self._snapshot_repo)
        self._summary_calculator = SummaryCalculator(self._analytics_repo)
        self._alert_evaluator = AlertEvaluator(self._analytics_repo, self._alert_repo, self._summary_calculator)

        self._running_jobs: Set[str] = set()
        self._lock = threading.Lock()
        self._started = False

        # Structured Job Registry containing JobDefinition objects
        self.registry: Dict[str, JobDefinition] = {
            "snapshot": JobDefinition(
                name="snapshot",
                description="Aggregates and writes point-in-time organization unit status counts snapshots.",
                callback=self._run_snapshot_job,
                interval_setting_key="scheduler_snapshot_interval"
            ),
            "alerts": JobDefinition(
                name="alerts",
                description="Runs workforce alert rules checks recursively and upserts active/resolved alerts.",
                callback=self._run_alerts_job,
                interval_setting_key="scheduler_alert_interval"
            ),
            "cleanup": JobDefinition(
                name="cleanup",
                description="Prunes expired dashboard snapshots, report logs, and job run histories.",
                callback=self._run_cleanup_job,
                interval_setting_key="scheduler_cleanup_interval"
            ),
            "reports": JobDefinition(
                name="reports",
                description="Processes PENDING report generation requests via registered ReportProcessor.",
                callback=self._run_reports_job,
                interval_setting_key="scheduler_alert_interval",
                supports_retry=False
            )
        }

    def start(self) -> None:
        """Initialize engine states."""
        self._started = True
        logger.info("Scheduler Engine started successfully.")

    def stop(self) -> None:
        """Clean up engine states."""
        self._started = False
        logger.info("Scheduler Engine stopped successfully.")

    def is_running(self, job_name: str) -> bool:
        """Check if a specific job is currently running."""
        with self._lock:
            return job_name in self._running_jobs

    def run_job(self, job_name: str, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Execute a structured JobDefinition thread-safely with concurrency locking."""
        job = self.registry.get(job_name)
        if not job:
            raise ValueError(f"Job '{job_name}' is not registered.")

        # Concurrency Lock check
        with self._lock:
            if job_name in self._running_jobs:
                logger.warning(f"Rejecting run: Job '{job_name}' is already running.")
                raise JobAlreadyRunningException(f"Job '{job_name}' is already running.")
            self._running_jobs.add(job_name)

        # Log start to database history
        job_run_id = self._job_repo.log_job_start(job_name, tenant_id)
        start_time = datetime.now()
        success = False
        error_msg = None
        records_processed = 0

        try:
            logger.info(f"Running job '{job_name}'...")
            # Execute job callback
            records_processed = job.callback()
            success = True
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error running job '{job_name}': {e}", exc_info=True)
            if not job.supports_retry:
                # If retry is not supported, raise/propagate
                raise
        finally:
            # Release Concurrency Lock
            with self._lock:
                self._running_jobs.discard(job_name)

            # Log end to database history
            self._job_repo.log_job_end(job_run_id, success, error_msg, records_processed)
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            logger.info(f"Finished job '{job_name}'. Duration: {duration_ms}ms, Success: {success}, Processed: {records_processed}")

        return {
            "job_name": job_name,
            "success": success,
            "duration_ms": duration_ms,
            "records_processed": records_processed,
            "error_message": error_msg
        }

    def tick(self) -> List[str]:
        """Evaluate scheduled jobs against dynamic intervals configuration and execute due items."""
        if not self._started:
            return []

        executed_jobs = []
        for job_name, job in self.registry.items():
            if not job.enabled or not job.supports_schedule:
                continue

            # Load dynamic interval setting from core.system_settings
            interval_str = self._get_setting_value(job.interval_setting_key, "60")
            try:
                interval_minutes = int(interval_str)
            except ValueError:
                interval_minutes = 60

            # Load last run metrics from history
            last_run = self._job_repo.get_last_job_run(job_name)
            due = False
            if not last_run or not last_run.get("finished_at"):
                due = True
            else:
                elapsed = datetime.now() - last_run["finished_at"].replace(tzinfo=None)
                if elapsed >= timedelta(minutes=interval_minutes):
                    due = True

            # If due and not currently running, launch in thread
            if due and not self.is_running(job_name):
                executed_jobs.append(job_name)
                threading.Thread(
                    target=self.run_job,
                    args=(job_name,),
                    name=f"job-{job_name}",
                    daemon=True
                ).start()

        return executed_jobs

    def run_due_jobs(self) -> List[str]:
        """Trigger evaluation and immediate run of all due jobs."""
        return self.tick()

    # ── Job Callbacks Implementation ──────────────────────────────────────────

    def _run_snapshot_job(self) -> int:
        """Snapshot Job callback: builds snapshots recursively for all active units."""
        units = self._analytics_repo.load_all_active_units()
        today = date.today()
        hour = datetime.now().hour
        records_processed = 0

        for unit in units:
            try:
                res = self._snapshot_generator.generate_snapshot(
                    unit["tenant_id"], unit["unit_id"], today, hour
                )
                if res.get("success"):
                    records_processed += res.get("records_processed", 0)
            except Exception as e:
                logger.error(f"Failed to generate snapshot for unit {unit['unit_id']}: {e}")

        return records_processed

    def _run_alerts_job(self) -> int:
        """Alerts Job callback: runs alert rules and updates core.alerts table."""
        units = self._analytics_repo.load_all_active_units()
        today = date.today()
        records_processed = 0

        for unit in units:
            try:
                alerts = self._alert_evaluator.evaluate_alerts(unit["tenant_id"], unit["unit_id"], today)
                for alert in alerts:
                    if alert["is_triggered"]:
                        self._alert_repo.create_or_keep_alert(
                            tenant_id=unit["tenant_id"],
                            unit_id=unit["unit_id"],
                            alert_type=alert["rule_name"],
                            severity=alert["severity"],
                            message=f"Alert triggered: {alert['rule_name']} value {alert['current_value']} exceeds threshold {alert['threshold']}."
                        )
                    else:
                        self._alert_repo.resolve_alert(
                            unit_id=unit["unit_id"],
                            alert_type=alert["rule_name"]
                        )
                records_processed += 1
            except Exception as e:
                logger.error(f"Failed to evaluate alert rules for unit {unit['unit_id']}: {e}")

        return records_processed

    def _run_cleanup_job(self) -> int:
        """Cleanup Job callback: prunes old dashboard records and logs based on retention days."""
        retention_str = self._get_setting_value("scheduler_retention_days", "90")
        try:
            retention_days = int(retention_str)
        except ValueError:
            retention_days = 90

        deleted_rows = self._job_repo.prune_all_expired_data(retention_days)
        return deleted_rows

    def _run_reports_job(self) -> int:
        """Reports Job callback: processes PENDING report requests via the registered processor."""
        # Import lazily to avoid circular dependencies at module load time
        from app.modules.reports.services import ReportService, NoOpReportProcessor
        service = ReportService()
        processor = NoOpReportProcessor()
        return service.process_pending_reports(processor)

    def _get_setting_value(self, key: Optional[str], default: str) -> str:
        """Helper to fetch setting value from database configuration."""
        if not key:
            return default
        query = "SELECT value FROM core.system_settings WHERE key = %s;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (key,))
                    row = cur.fetchone()
                    return str(row[0]) if row else default
        except Exception:
            return default
