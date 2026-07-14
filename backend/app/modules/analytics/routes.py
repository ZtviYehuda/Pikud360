"""
Analytics module API routes — all endpoints under /api/analytics/*
All routes require analytics permissions and respect tenant and organization unit scoping.
"""
import logging
from typing import Optional
from datetime import datetime, date
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, get_jwt
from pydantic import ValidationError

from app.core.authorization.decorators import require_permission
from app.core.authorization.scopes import ScopeType
from app.core.authorization.exceptions import AccessDeniedError
from app.core.responses import ApiResponse
from app.modules.analytics.services import AnalyticsService
from app.modules.analytics.schemas import (
    SummaryResponse, TrendsResponse, TrendDataPoint,
    StatusDistributionItem, AlertEvaluationResult,
    SnapshotGenerateRequest, SnapshotGenerateResponse
)

logger = logging.getLogger("pikud360.modules.analytics.routes")
analytics_bp = Blueprint("analytics", __name__)
analytics_service = AnalyticsService()


def _parse_date(date_str: Optional[str], default_val: date) -> date:
    if not date_str:
        return default_val
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return default_val


# ── SUMMARY ENDPOINT ──────────────────────────────────────────────────────────

@analytics_bp.route("/summary", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def get_summary():
    """Fetch aggregated personnel status counts, percentages, and child units breakdown."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    unit_id = request.args.get("unit_id")
    if not unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    start_date = _parse_date(request.args.get("start_date"), date.today())
    end_date = _parse_date(request.args.get("end_date"), date.today())

    try:
        data = analytics_service.get_summary(tenant_id, unit_id, start_date, end_date, user_id)
        
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
                        StatusDistributionItem(status=d["status"], count=d["count"], percentage=d["percentage"])
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
                        StatusDistributionItem(status=d["status"], count=d["count"], percentage=d["percentage"])
                        for d in u["status_distribution"]
                    ]
                }
                for u in data["child_units"]
            ],
            status_distribution=[
                StatusDistributionItem(status=item["status"], count=item["count"], percentage=item["percentage"])
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

    unit_id = request.args.get("unit_id")
    if not unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    period = request.args.get("period", "daily").lower()
    if period not in ["daily", "weekly", "monthly"]:
        return ApiResponse.error("Invalid period. Must be daily, weekly, or monthly", "BAD_REQUEST", status_code=400)

    # Default to last 7 days for daily, or longer for weekly/monthly
    default_start = date.today() - timedelta(days=6) if period == "daily" else date.today() - timedelta(days=30)
    start_date = _parse_date(request.args.get("start_date"), default_start)
    end_date = _parse_date(request.args.get("end_date"), date.today())

    try:
        trends = analytics_service.get_trends(tenant_id, unit_id, start_date, end_date, period, user_id)
        
        serialized = TrendsResponse(
            period=period,
            unit_id=unit_id,
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

    unit_id = request.args.get("unit_id")
    if not unit_id:
        return ApiResponse.error("Missing unit_id parameter", "BAD_REQUEST", status_code=400)

    start_date = _parse_date(request.args.get("start_date"), date.today())
    end_date = _parse_date(request.args.get("end_date"), date.today())

    try:
        dist = analytics_service.get_distribution(tenant_id, unit_id, start_date, end_date, user_id)
        serialized = [
            StatusDistributionItem(status=item["status"], count=item["count"], percentage=item["percentage"]).model_dump()
            for item in dist
        ]
        return ApiResponse.success(data=serialized)
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

    reference_date = _parse_date(request.args.get("date"), date.today())

    try:
        alerts = analytics_service.get_alerts(tenant_id, unit_id, reference_date, user_id)
        serialized = [
            AlertEvaluationResult(
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
