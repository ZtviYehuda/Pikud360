from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pydantic import ValidationError
import logging
from datetime import datetime

from app.modules.workforce_planning.repositories import WorkforcePlanningRepository
from app.modules.workforce.repositories import EmployeeRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce_planning.services import WorkforcePlanningService
from app.modules.workforce_planning.schemas import (
    WorkforceSettingsUpdateRequest,
    DailyPlanCreateRequest,
    AssignmentCreateRequest,
    AssignmentUpdateRequest,
    WorkforceSettingsResponse,
    DailyPlanResponse,
    AssignmentResponse
)
from app.core.authorization import require_permission, ScopeType, AccessDeniedError
from app.core.responses import ApiResponse

logger = logging.getLogger("pikud360.modules.workforce_planning.routes")

planning_bp = Blueprint("workforce_planning", __name__)

# Initialize repositories and services
planning_repo = WorkforcePlanningRepository()
employee_repo = EmployeeRepository()
audit_repo = AuditLogRepository()

planning_service = WorkforcePlanningService(
    planning_repo=planning_repo,
    employee_repo=employee_repo,
    audit_repo=audit_repo
)

@planning_bp.route("/settings/<unit_id>", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def get_settings(unit_id):
    """Fetches workforce planning settings for the unit."""
    settings = planning_service.get_or_create_settings(unit_id)
    serialized = WorkforceSettingsResponse.model_validate(settings).model_dump()
    return ApiResponse.success(data=serialized)


@planning_bp.route("/settings/<unit_id>", methods=["PUT"])
@require_permission("employees.update", ScopeType.ORGANIZATION_UNIT)
def update_settings(unit_id):
    """Updates workforce planning settings configuration."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = WorkforceSettingsUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        updated = planning_service.update_settings(unit_id, req, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = WorkforceSettingsResponse.model_validate(updated).model_dump()
    return ApiResponse.success(data=serialized)


@planning_bp.route("/daily/<date_str>", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def get_daily_plan(date_str):
    """Retrieves the daily plan metadata by unit_id and date query parameters."""
    unit_id = request.args.get("unit_id")
    if not unit_id:
        return ApiResponse.error(message="Missing required 'unit_id' parameter", error_code="BAD_REQUEST", status_code=400)

    try:
        plan_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return ApiResponse.error(message="Invalid date format. Use YYYY-MM-DD", error_code="BAD_REQUEST", status_code=400)

    plan = planning_repo.get_plan_by_unit_and_date(unit_id, plan_date)
    if not plan:
        return ApiResponse.error(message="Daily workforce plan not found for this date", error_code="NOT_FOUND", status_code=404)

    serialized = DailyPlanResponse.model_validate(plan).model_dump()
    return ApiResponse.success(data=serialized)


@planning_bp.route("/daily", methods=["POST"])
@require_permission("employees.update", ScopeType.ORGANIZATION_UNIT)
def create_plan():
    """Initializes a new manpower Daily Workforce Plan."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = DailyPlanCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created = planning_service.create_daily_plan(req, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = DailyPlanResponse.model_validate(created).model_dump()
    return ApiResponse.success(data=serialized, status_code=21)


@planning_bp.route("/daily/<plan_id>/assign", methods=["POST"])
@require_permission("employees.update", ScopeType.ORGANIZATION_UNIT)
def assign_employee(plan_id):
    """Assigns an employee's availability status and shift definition in the plan."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = AssignmentCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created = planning_service.assign_employee_status(plan_id, req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = AssignmentResponse.model_validate(created).model_dump()
    return ApiResponse.success(data=serialized, status_code=21)


@planning_bp.route("/assignment/<assignment_id>", methods=["PUT"])
@require_permission("employees.update", ScopeType.ORGANIZATION_UNIT)
def update_assignment(assignment_id):
    """Modifies details of an active daily assignment."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = AssignmentUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        updated = planning_service.update_assignment(assignment_id, req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    if not updated:
        return ApiResponse.error(message="Daily assignment record not found", error_code="NOT_FOUND", status_code=404)

    serialized = AssignmentResponse.model_validate(updated).model_dump()
    return ApiResponse.success(data=serialized)


@planning_bp.route("/dashboard/<unit_id>/<date_str>", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def get_dashboard_summary(unit_id, date_str):
    """Compiles daily workforce manpower and shift aggregates dashboard summaries."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        summary = planning_service.get_daily_workforce_summary(unit_id, date_str, tenant_id, user_id)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)

    return ApiResponse.success(data=summary)
