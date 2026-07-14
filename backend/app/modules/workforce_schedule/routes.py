from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pydantic import ValidationError
import logging
from datetime import datetime

from app.modules.workforce_schedule.repositories import WorkforceScheduleRepository
from app.modules.workforce.repositories import EmployeeRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce_schedule.services import WorkforceScheduleService
from app.modules.workforce_schedule.schemas import (
    ScheduleSettingsUpdateRequest,
    ScheduleSettingsResponse,
    ShiftTypeCreateRequest,
    ShiftTypeResponse,
    ScheduleStatusCreateRequest,
    ScheduleStatusUpdateRequest,
    ScheduleStatusResponse,
    ScheduleCreateRequest,
    ScheduleUpdateRequest,
    ScheduleResponse,
    BulkScheduleRequest
)
from app.core.authorization import require_permission, ScopeType, AccessDeniedError, can_view_schedule
from app.core.responses import ApiResponse

logger = logging.getLogger("pikud360.modules.workforce_schedule.routes")

# Unified Blueprint registered at url_prefix /api/scheduling
scheduling_bp = Blueprint("scheduling", __name__)

schedule_repo = WorkforceScheduleRepository()
employee_repo = EmployeeRepository()
audit_repo = AuditLogRepository()

schedule_service = WorkforceScheduleService(
    schedule_repo=schedule_repo,
    employee_repo=employee_repo,
    audit_repo=audit_repo
)

# --- Availability Statuses ---

@scheduling_bp.route("/statuses", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def list_statuses():
    """Lists active schedule statuses under tenant isolation context."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    statuses = schedule_repo.list_statuses(tenant_id)
    serialized = [ScheduleStatusResponse.model_validate(s).model_dump() for s in statuses]
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/statuses", methods=["POST"])
@require_permission("schedule.status_manage", ScopeType.ORGANIZATION_UNIT)
def create_status():
    """Creates a custom scheduling status."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = ScheduleStatusCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created = schedule_service.create_custom_status(req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = ScheduleStatusResponse.model_validate(created).model_dump()
    return ApiResponse.success(data=serialized, status_code=21)


@scheduling_bp.route("/statuses/<status_id>", methods=["PUT"])
@require_permission("schedule.status_manage", ScopeType.ORGANIZATION_UNIT)
def update_status(status_id):
    """Updates an existing custom status."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = ScheduleStatusUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        updated = schedule_service.update_custom_status(status_id, req, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    if not updated:
        return ApiResponse.error(message="Status not found", error_code="NOT_FOUND", status_code=404)

    serialized = ScheduleStatusResponse.model_validate(updated).model_dump()
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/statuses/<status_id>", methods=["DELETE"])
@require_permission("schedule.status_manage", ScopeType.ORGANIZATION_UNIT)
def delete_status(status_id):
    """Soft-deletes / disables a custom status record."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        disabled = schedule_service.disable_custom_status(status_id, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    if not disabled:
        return ApiResponse.error(message="Status not found", error_code="NOT_FOUND", status_code=404)

    return ApiResponse.success(data={"deleted": True})


# --- Single Assignments ---

@scheduling_bp.route("/date/<date_str>", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_daily_assignments(date_str):
    """Retrieves all daily status allocations for the unit on a date."""
    unit_id = request.args.get("unit_id")
    if not unit_id:
        return ApiResponse.error(message="Missing required 'unit_id' query parameter", error_code="BAD_REQUEST", status_code=400)

    try:
        schedule_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return ApiResponse.error(message="Invalid date format. Use YYYY-MM-DD", error_code="BAD_REQUEST", status_code=400)

    schedules = schedule_repo.get_unit_schedules_by_date(unit_id, schedule_date)
    serialized = [ScheduleResponse.model_validate(s).model_dump() for s in schedules]
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/unit/<unit_id>/employees", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_unit_employees(unit_id):
    """Retrieves all employees of a unit with their daily scheduling details."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    date_str = request.args.get("date")
    if not date_str:
        return ApiResponse.error(message="Missing required 'date' query parameter", error_code="BAD_REQUEST", status_code=400)

    try:
        schedule_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return ApiResponse.error(message="Invalid date format. Use YYYY-MM-DD", error_code="BAD_REQUEST", status_code=400)

    try:
        data = schedule_service.get_unit_employees_with_schedule(unit_id, schedule_date, tenant_id, user_id)
        return ApiResponse.success(data=data)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error loading unit employees: {e}", exc_info=True)
        return ApiResponse.error(message="Internal error", error_code="INTERNAL_ERROR", status_code=500)



@scheduling_bp.route("/assign", methods=["POST"])
@require_permission("schedule.manage", ScopeType.ORGANIZATION_UNIT)
def create_assignment():
    """Assigns an employee a daily status planning log under commander authority."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = ScheduleCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created = schedule_service.create_schedule_entry(req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = ScheduleResponse.model_validate(created).model_dump()
    return ApiResponse.success(data=serialized, status_code=21)


@scheduling_bp.route("/assign/<schedule_id>", methods=["PUT"])
@require_permission("schedule.manage", ScopeType.ORGANIZATION_UNIT)
def update_assignment(schedule_id):
    """Updates active daily status planning assignment attributes."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = ScheduleUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        updated = schedule_service.update_schedule_entry(schedule_id, req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    if not updated:
        return ApiResponse.error(message="Daily assignment not found", error_code="NOT_FOUND", status_code=404)

    serialized = ScheduleResponse.model_validate(updated).model_dump()
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/assign/<schedule_id>", methods=["DELETE"])
@require_permission("schedule.manage", ScopeType.ORGANIZATION_UNIT)
def delete_assignment(schedule_id):
    """Deletes an active daily assignment record."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        deleted = schedule_service.delete_schedule_entry(schedule_id, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    if not deleted:
        return ApiResponse.error(message="Daily assignment not found", error_code="NOT_FOUND", status_code=404)

    return ApiResponse.success(data={"deleted": True})


# --- Bulk Operations ---

@scheduling_bp.route("/bulk", methods=["POST"])
@require_permission("schedule.bulk_manage", ScopeType.ORGANIZATION_UNIT)
def bulk_schedule_entries():
    """Commander bulk status allocation tool."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = BulkScheduleRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created_list = schedule_service.bulk_schedule(req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = [ScheduleResponse.model_validate(s).model_dump() for s in created_list]
    return ApiResponse.success(data=serialized, status_code=21)


# --- Dashboard Summaries ---

@scheduling_bp.route("/dashboard/<unit_id>/<date_str>", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_dashboard_metrics(unit_id, date_str):
    """Retrieves distribution workforce planning summary aggregates for dashboard view."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        summary = schedule_service.get_daily_workforce_summary(unit_id, date_str, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)

    return ApiResponse.success(data=summary)


# --- Settings & Shifts ---

@scheduling_bp.route("/settings/<unit_id>", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_unit_settings(unit_id):
    """Retrieves daily status scheduling config options settings."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    settings = schedule_service.get_or_create_settings(unit_id, tenant_id, user_id)
    serialized = ScheduleSettingsResponse.model_validate(settings).model_dump()
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/settings/<unit_id>", methods=["PUT"])
@require_permission("schedule.settings_manage", ScopeType.ORGANIZATION_UNIT)
def update_unit_settings(unit_id):
    """Modifies daily status configuration modes (DIRECT_STATUS vs SHIFT_BASED)."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = ScheduleSettingsUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        updated = schedule_service.update_settings(
            unit_id,
            req.scheduling_mode,
            tenant_id,
            user_id,
            req.unassigned_threshold,
            req.sick_threshold,
            req.shortage_threshold
        )
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = ScheduleSettingsResponse.model_validate(updated).model_dump()
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/shifts/<unit_id>", methods=["POST"])
@require_permission("schedule.settings_manage", ScopeType.ORGANIZATION_UNIT)
def create_unit_shift(unit_id):
    """Creates a custom, commander-defined shift type for a specific unit."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = ShiftTypeCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created = schedule_service.create_shift_type(unit_id, req.name, req.start_time, req.end_time, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = ShiftTypeResponse.model_validate(created).model_dump()
    return ApiResponse.success(data=serialized, status_code=21)


@scheduling_bp.route("/employee/<employee_id>", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_emp_schedules(employee_id):
    """Retrieves full planning history log for a specific employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    emp = employee_repo.get_by_id(employee_id)
    if not emp:
        return ApiResponse.error(message="Employee profile not found", error_code="NOT_FOUND", status_code=404)

    if not can_view_schedule(user_id, tenant_id, emp.org_unit_id):
        return ApiResponse.error(
            message="Access Denied: Lacks permission to view status history.",
            error_code="FORBIDDEN",
            status_code=403
        )

    history = schedule_repo.get_employee_history(employee_id)
    serialized = [ScheduleResponse.model_validate(s).model_dump() for s in history]
    return ApiResponse.success(data=serialized)


@scheduling_bp.route("/calendar", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_scheduling_calendar():
    """Retrieves aggregated daily workforce calendar data for a unit over a date range."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    unit_id = request.args.get("unit_id")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if not unit_id or not start_date or not end_date:
        return ApiResponse.error(message="Missing required parameters: unit_id, start_date, end_date", error_code="BAD_REQUEST", status_code=400)

    try:
        data = schedule_service.get_scheduling_calendar(unit_id, start_date, end_date, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)

    return ApiResponse.success(data=data)


@scheduling_bp.route("/snapshot", methods=["GET"])
@require_permission("schedule.view", ScopeType.ORGANIZATION_UNIT)
def get_scheduling_snapshot():
    """Retrieves a historical snapshot of workforce status assignments for a given unit and date."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    unit_id = request.args.get("unit_id")
    date_str = request.args.get("date")

    if not unit_id or not date_str:
        return ApiResponse.error(message="Missing required parameters: unit_id, date", error_code="BAD_REQUEST", status_code=400)

    try:
        data = schedule_service.get_scheduling_snapshot(unit_id, date_str, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)

    return ApiResponse.success(data=data)
