"""
Analytics module API routes — all endpoints under /api/analytics/*
All routes require analytics permissions and respect tenant and organization unit scoping.
"""
import logging
from typing import Optional
from datetime import datetime, date, timedelta
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, get_jwt
from pydantic import ValidationError

from app.core.authorization.decorators import require_permission
from app.core.authorization.scopes import ScopeType
from app.core.authorization.exceptions import AccessDeniedError
from app.core.responses import ApiResponse
from app.modules.analytics.services import AnalyticsService
from app.modules.analytics.schemas import (
    AnalyticsFilterRequest, SnapshotGenerateRequest,
    SummaryResponse, TrendResponse, TrendDataPoint,
    DistributionItem, DistributionResponse, AlertResponse,
    SnapshotGenerateResponse, JobStatusResponseItem, JobRunResponse
)

from app.modules.analytics.models import TrendPeriod
from app.modules.analytics.scheduler import SchedulerEngine, JobAlreadyRunningException
from app.modules.analytics.repositories import JobRepository

logger = logging.getLogger("pikud360.modules.analytics.routes")
analytics_bp = Blueprint("analytics", __name__)
scheduler_engine = SchedulerEngine()
scheduler_engine.start()  # Start engine state
job_repo = JobRepository()
analytics_service = AnalyticsService()


# ── SUMMARY ENDPOINT ──────────────────────────────────────────────────────────

@analytics_bp.route("/summary", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def get_summary():
    """Fetch aggregated personnel status counts, percentages, and child units breakdown."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    # Validate query parameters using Common Filter DTO
    try:
        req = AnalyticsFilterRequest(
            unit_id=request.args.get("unit_id") or "",
            start_date=request.args.get("start_date") or None,
            end_date=request.args.get("end_date") or None
        )
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    if not req.unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    start_date = req.start_date or date.today()
    end_date = req.end_date or date.today()

    try:
        data = analytics_service.get_summary(tenant_id, req.unit_id, start_date, end_date, user_id)
        
        # Serialize response using Pydantic SummaryResponse model
        serialized = SummaryResponse(
            total_personnel=data["total_personnel"],
            assigned=data["assigned"],
            unassigned=data["unassigned"],
            available=data["available"],
            unavailable=data["unavailable"],
            assigned_percentage=data["assigned_percentage"],
            availability_percentage=data["availability_percentage"],
            absence_percentage=data["absence_percentage"],
            unassigned_percentage=data["unassigned_percentage"],
            active_shift_count=data["active_shift_count"],
            organization_units=[
                {
                    "unit_id": u["unit_id"],
                    "unit_name": u["unit_name"],
                    "total_personnel": u["total_personnel"],
                    "assigned": u["assigned"],
                    "unassigned": u["unassigned"],
                    "status_distribution": [
                        DistributionItem(status=d["status"], count=d["count"], percentage=d["percentage"])
                        for d in u["status_distribution"]
                    ]
                }
                for u in data["organization_units"]
            ],
            child_units=[
                {
                    "unit_id": u["unit_id"],
                    "unit_name": u["unit_name"],
                    "total_personnel": u["total_personnel"],
                    "assigned": u["assigned"],
                    "unassigned": u["unassigned"],
                    "status_distribution": [
                        DistributionItem(status=d["status"], count=d["count"], percentage=d["percentage"])
                        for d in u["status_distribution"]
                    ]
                }
                for u in data["child_units"]
            ],
            status_distribution=[
                DistributionItem(status=item["status"], count=item["count"], percentage=item["percentage"])
                for item in data["status_distribution"]
            ],
            alerts_count=data["alerts_count"]
        )
        return ApiResponse.success(data=serialized.model_dump())
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error loading summary: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── TRENDS ENDPOINT ───────────────────────────────────────────────────────────

@analytics_bp.route("/trends", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def get_trends():
    """Fetch time-series manpower statistics divided by daily/weekly/monthly steps."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    # Validate query parameters using Common Filter DTO
    try:
        req = AnalyticsFilterRequest(
            unit_id=request.args.get("unit_id") or "",
            start_date=request.args.get("start_date") or None,
            end_date=request.args.get("end_date") or None,
            period=request.args.get("period", "daily").lower()
        )
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    if not req.unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    period_str = req.period or "daily"
    period_map = {
        "daily": TrendPeriod.DAILY,
        "weekly": TrendPeriod.WEEKLY,
        "monthly": TrendPeriod.MONTHLY
    }
    trend_period = period_map.get(period_str.lower(), TrendPeriod.DAILY)

    # Default to last 7 days for daily, or longer for weekly/monthly
    default_start = date.today() - timedelta(days=6) if trend_period == TrendPeriod.DAILY else date.today() - timedelta(days=30)
    start_date = req.start_date or default_start
    end_date = req.end_date or date.today()

    try:
        trends = analytics_service.get_trends(tenant_id, req.unit_id, start_date, end_date, trend_period, user_id)
        
        serialized = TrendResponse(
            period=trend_period.value,
            unit_id=req.unit_id,
            start_date=start_date,
            end_date=end_date,
            data=[
                TrendDataPoint(
                    date=pt["date"],
                    total_personnel=pt["total_personnel"],
                    assigned=pt["assigned"],
                    unassigned=pt["unassigned"],
                    available=pt["available"],
                    unavailable=pt["unavailable"],
                    readiness_percentage=pt["readiness_percentage"],
                    status_distribution=pt["status_distribution"]
                )
                for pt in trends
            ]
        )
        return ApiResponse.success(data=serialized.model_dump())
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error loading trends: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── DISTRIBUTION ENDPOINT ─────────────────────────────────────────────────────

@analytics_bp.route("/distribution", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def get_distribution():
    """Fetch status categories distribution with dynamic mapping counts and percentages."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    # Validate query parameters using Common Filter DTO
    try:
        req = AnalyticsFilterRequest(
            unit_id=request.args.get("unit_id") or "",
            start_date=request.args.get("start_date") or None,
            end_date=request.args.get("end_date") or None
        )
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    if not req.unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    start_date = req.start_date or date.today()
    end_date = req.end_date or date.today()

    try:
        dist = analytics_service.get_distribution(tenant_id, req.unit_id, start_date, end_date, user_id)
        serialized = DistributionResponse(
            distribution=[
                DistributionItem(status=item["status"], count=item["count"], percentage=item["percentage"])
                for item in dist
            ]
        )
        return ApiResponse.success(data=serialized.model_dump())
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error loading distribution: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── ALERTS ENDPOINT ───────────────────────────────────────────────────────────

@analytics_bp.route("/alerts", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def get_alerts():
    """Evaluate configured alert rules for a unit and return status details."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    unit_id = request.args.get("unit_id")
    if not unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    # Validate query parameters using Common Filter DTO
    try:
        req = AnalyticsFilterRequest(
            unit_id=unit_id,
            start_date=request.args.get("date") or None
        )
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    reference_date = req.start_date or date.today()

    try:
        alerts = analytics_service.get_alerts(tenant_id, req.unit_id, reference_date, user_id)
        serialized = [
            AlertResponse(
                rule_name=a["rule_name"],
                metric=a["metric"],
                current_value=a["current_value"],
                threshold=a["threshold"],
                operator=a["operator"],
                severity=a["severity"],
                organization_unit=a["organization_unit"],
                is_triggered=a["is_triggered"]
            ).model_dump()
            for a in alerts
        ]
        return ApiResponse.success(data=serialized)
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error loading alerts: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── SNAPSHOT GENERATION ENDPOINT ──────────────────────────────────────────────

@analytics_bp.route("/snapshots/generate", methods=["POST"])
@require_permission("analytics.manage", ScopeType.ORGANIZATION_UNIT)
def generate_snapshot():
    """Trigger Point-in-Time snapshot generation and return runtime statistics."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req = SnapshotGenerateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    try:
        res = analytics_service.trigger_snapshot_generation(
            tenant_id, req.unit_id, req.snapshot_date, req.snapshot_hour, user_id
        )
        serialized = SnapshotGenerateResponse(
            success=res["success"],
            generated_at=res["generated_at"],
            duration_ms=res["duration_ms"],
            records_processed=res["records_processed"],
            unit_id=res["unit_id"],
            snapshot_date=res["snapshot_date"]
        )
        return ApiResponse.success(data=serialized.model_dump(), message="Snapshot generated successfully.")
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error generating snapshot: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── SCHEDULER HEALTH & MANAGEMENT ENDPOINTS ───────────────────────────────────

@analytics_bp.route("/jobs/<job_name>/run", methods=["POST"])
@require_permission("analytics.manage", ScopeType.GLOBAL)
def trigger_manual_job(job_name):
    """Trigger manual execution of a structured scheduler job."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    if job_name not in scheduler_engine.registry:
        return ApiResponse.error(f"Job '{job_name}' is not registered.", "BAD_REQUEST", status_code=400)

    try:
        res = scheduler_engine.run_job(job_name, tenant_id)
        serialized = JobRunResponse(
            job_name=res["job_name"],
            success=res["success"],
            duration_ms=res["duration_ms"],
            records_processed=res["records_processed"],
            error_message=res["error_message"]
        )
        return ApiResponse.success(data=serialized.model_dump(), message=f"Job '{job_name}' executed successfully.")
    except JobAlreadyRunningException as e:
        return ApiResponse.error(str(e), "CONFLICT", status_code=409)
    except Exception as e:
        logger.error(f"Error executing job '{job_name}' manually: {e}", exc_info=True)
        return ApiResponse.error("Internal server error during job run", "INTERNAL_ERROR", status_code=500)


@analytics_bp.route("/jobs/run-all", methods=["POST"])
@require_permission("analytics.manage", ScopeType.GLOBAL)
def trigger_run_all_jobs():
    """Trigger manual execution of all registered scheduler jobs in sequence."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    results = []

    for job_name in ["snapshot", "alerts", "cleanup"]:
        try:
            res = scheduler_engine.run_job(job_name, tenant_id)
            results.append(res)
        except JobAlreadyRunningException:
            results.append({
                "job_name": job_name,
                "success": False,
                "duration_ms": 0,
                "records_processed": 0,
                "error_message": "Skipped: Job already running"
            })
        except Exception as e:
            results.append({
                "job_name": job_name,
                "success": False,
                "duration_ms": 0,
                "records_processed": 0,
                "error_message": str(e)
            })

    serialized = [
        JobRunResponse(
            job_name=r["job_name"],
            success=r["success"],
            duration_ms=r["duration_ms"],
            records_processed=r["records_processed"],
            error_message=r.get("error_message")
        ).model_dump()
        for r in results
    ]
    return ApiResponse.success(data=serialized, message="All jobs triggered.")


@analytics_bp.route("/jobs/status", methods=["GET"])
@require_permission("analytics.view", ScopeType.GLOBAL)
def get_jobs_status():
    """Fetch structured health telemetry metadata for all scheduler tasks."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    statuses = []

    for name, job in scheduler_engine.registry.items():
        stats = job_repo.get_job_stats(name, tenant_id)
        last_run = job_repo.get_last_job_run(name, tenant_id)
        
        # Calculate next scheduled run time
        next_run = None
        if job.supports_schedule and job.enabled:
            interval_str = scheduler_engine._get_setting_value(job.interval_setting_key, "60")
            try:
                interval_minutes = int(interval_str)
            except ValueError:
                interval_minutes = 60
                
            last_finished = last_run["finished_at"] if last_run else None
            if last_finished:
                next_run = last_finished + timedelta(minutes=interval_minutes)
            else:
                next_run = datetime.now()

        statuses.append(
            JobStatusResponseItem(
                job_name=name,
                enabled=job.enabled,
                running=scheduler_engine.is_running(name),
                next_run=next_run,
                last_run=last_run["started_at"] if last_run else None,
                last_success=stats["last_success"],
                last_failure=stats["last_failure"],
                average_duration_ms=stats["average_duration_ms"],
                last_duration_ms=stats["last_duration_ms"],
                records_processed=stats["records_processed"],
                error_count=stats["error_count"]
            ).model_dump()
        )

    return ApiResponse.success(data=statuses, meta={"total": len(statuses)})
