from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pydantic import ValidationError
import logging

from app.modules.workforce.repositories import EmployeeRepository, EmployeeHistoryRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.workforce.services import WorkforceService
from app.modules.workforce.schemas import EmployeeCreateRequest, EmployeeUpdateRequest, EmployeeResponse
from app.core.authorization import require_permission, ScopeType, AccessDeniedError
from app.core.responses import ApiResponse

logger = logging.getLogger("matzevet.modules.workforce.routes")

workforce_bp = Blueprint("workforce", __name__)

# Initialize dependencies
employee_repo = EmployeeRepository()
history_repo = EmployeeHistoryRepository()
audit_repo = AuditLogRepository()

workforce_service = WorkforceService(
    employee_repo=employee_repo,
    history_repo=history_repo,
    audit_repo=audit_repo
)

@workforce_bp.route("/employees", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def list_employees():
    """Lists employees within the tenant scope allowed for the active user."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    employees = workforce_service.list_employees(tenant_id, user_id)
    serialized = [EmployeeResponse.model_validate(emp).model_dump() for emp in employees]
    
    return ApiResponse.success(data=serialized)


@workforce_bp.route("/employees/<employee_id>", methods=["GET"])
@require_permission("employees.view", ScopeType.ORGANIZATION_UNIT)
def get_employee(employee_id):
    """Fetches a specific employee record."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    emp = workforce_service.get_employee(employee_id, tenant_id, user_id)
    if not emp:
        return ApiResponse.error(message="Employee not found", error_code="NOT_FOUND", status_code=404)
        
    serialized = EmployeeResponse.model_validate(emp).model_dump()
    return ApiResponse.success(data=serialized)


@workforce_bp.route("/employees", methods=["POST"])
@require_permission("employees.create", ScopeType.ORGANIZATION_UNIT)
def create_employee():
    """Onboards a new employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = EmployeeCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    created_emp = workforce_service.create_employee(req, tenant_id, user_id)
    serialized = EmployeeResponse.model_validate(created_emp).model_dump()
    
    return ApiResponse.success(data=serialized, status_code=201)


@workforce_bp.route("/employees/<employee_id>", methods=["PUT"])
@require_permission("employees.update", ScopeType.ORGANIZATION_UNIT)
def update_employee(employee_id):
    """Updates an employee record."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = EmployeeUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    updated_emp = workforce_service.update_employee(employee_id, req, tenant_id, user_id)
    if not updated_emp:
        return ApiResponse.error(message="Employee not found", error_code="NOT_FOUND", status_code=404)
        
    serialized = EmployeeResponse.model_validate(updated_emp).model_dump()
    return ApiResponse.success(data=serialized)


@workforce_bp.route("/employees/<employee_id>", methods=["DELETE"])
@require_permission("employees.delete", ScopeType.ORGANIZATION_UNIT)
def delete_employee(employee_id):
    """Soft deletes an employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    success = workforce_service.delete_employee(employee_id, tenant_id, user_id)
    if not success:
        return ApiResponse.error(message="Employee not found or already deleted", error_code="NOT_FOUND", status_code=404)
        
    return ApiResponse.success(message="Employee record successfully soft-deleted.")


@workforce_bp.route("/employees/<employee_id>/history", methods=["GET"])
@require_permission("employees.history.view", ScopeType.ORGANIZATION_UNIT)
def get_employee_history(employee_id):
    """Fetches the chronological status changes and transfers history log for an employee."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        timeline = workforce_service.get_employee_timeline(employee_id, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="NOT_FOUND", status_code=404)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    return ApiResponse.success(data=timeline)


@workforce_bp.route("/chat/heartbeat", methods=["POST"])
@workforce_bp.route("/employees/chat/heartbeat", methods=["POST"])
@jwt_required(optional=True)
def chat_heartbeat():
    return jsonify({"success": True, "status": "online"}), 200


@workforce_bp.route("/employees/structure", methods=["GET"])
@jwt_required(optional=True)
def get_employees_structure():
    departments = [
        {
            "id": 1,
            "name": "מחלקה התעצמות",
            "sections": [
                {
                    "id": 11,
                    "name": "מדור תכנון",
                    "teams": [{"id": 111, "name": "צוות א'"}]
                }
            ]
        }
    ]
    return jsonify(departments), 200


@workforce_bp.route("/employees/roles", methods=["GET"])
@jwt_required(optional=True)
def get_employees_roles():
    roles = [{"id": 1, "name": "מפקד מחלקה"}, {"id": 2, "name": "קצין"}, {"id": 3, "name": "חייל"}]
    return jsonify(roles), 200


@workforce_bp.route("/employees/service-types", methods=["GET"])
@jwt_required(optional=True)
def get_employees_service_types():
    service_types = [{"id": "KEVA", "name": "קבע"}, {"id": "SADIR", "name": "סדיר"}, {"id": "MILUIM", "name": "מילואים"}]
    return jsonify(service_types), 200


@workforce_bp.route("/attendance/status-types", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_status_types():
    status_types = [
        {"id": "PRESENT", "name": "נוכח", "color": "#10B981"},
        {"id": "ABSENT", "name": "נעדר", "color": "#EF4444"},
        {"id": "VACATION", "name": "חופשה", "color": "#F59E0B"},
        {"id": "SICK", "name": "מחלה", "color": "#6366F1"},
        {"id": "COURSE", "name": "קורס", "color": "#8B5CF6"}
    ]
    return jsonify(status_types), 200


@workforce_bp.route("/attendance/stats", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_stats():
    return jsonify({
        "success": True,
        "present": 85,
        "absent": 5,
        "vacation": 6,
        "sick": 4,
        "total": 100
    }), 200


@workforce_bp.route("/attendance/stats/trend", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_stats_trend():
    return jsonify([]), 200


@workforce_bp.route("/attendance/stats/comparison", methods=["GET"])
@jwt_required(optional=True)
def get_attendance_stats_comparison():
    comparison = [
        {
            "unit_id": 1,
            "unit_name": "מחלקה התעצמות",
            "total_count": 10,
            "present_count": 8,
            "absent_count": 2,
            "unknown_count": 0,
            "level": "department"
        }
    ]
    return jsonify(comparison), 200
