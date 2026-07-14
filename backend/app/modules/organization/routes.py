from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pydantic import ValidationError
import logging

from app.modules.organization.repositories import OrganizationRepository, UnitCommanderRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.organization.services import OrganizationTreeService
from app.modules.organization.schemas import (
    OrganizationUnitCreateRequest,
    OrganizationUnitUpdateRequest,
    OrganizationMoveRequest,
    CommanderAssignRequest,
    OrganizationUnitResponse
)
from app.core.authorization import require_permission, ScopeType
from app.core.responses import ApiResponse

logger = logging.getLogger("pikud360.modules.organization.routes")

org_bp = Blueprint("organization", __name__)

# Initialize repositories and services
org_repo = OrganizationRepository()
commander_repo = UnitCommanderRepository()
audit_repo = AuditLogRepository()

org_service = OrganizationTreeService(
    org_repo=org_repo,
    commander_repo=commander_repo,
    audit_repo=audit_repo
)

@org_bp.route("/units", methods=["GET"])
@require_permission("organization.view", ScopeType.ORGANIZATION_UNIT)
def get_org_tree():
    """Fetches the nested organization tree, filtered by commander access scope."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    from app.core.authorization.scopes import resolve_access_scope
    ctx = resolve_access_scope(user_id, tenant_id)
    
    tree = org_service.get_nested_tree(tenant_id)
    
    def filter_tree(nodes, allowed_ids, is_global):
        res = []
        for node in nodes:
            node_id = node["id"]
            if is_global or node_id in allowed_ids:
                res.append({
                    "id": node["id"],
                    "name": node["name"],
                    "code": node["code"],
                    "description": node.get("description"),
                    "children": filter_tree(node.get("children", []), allowed_ids, is_global)
                })
            else:
                allowed_children = filter_tree(node.get("children", []), allowed_ids, is_global)
                res.extend(allowed_children)
        return res
        
    is_global = ctx.scope_type == "GLOBAL"
    allowed_ids = set(ctx.organization_units)
    filtered_tree = filter_tree(tree, allowed_ids, is_global)
    
    return ApiResponse.success(data=filtered_tree)


@org_bp.route("/units/<unit_id>", methods=["GET"])
@require_permission("organization.view", ScopeType.ORGANIZATION_UNIT)
def get_unit_details(unit_id):
    """Fetches specific organization unit profile attributes."""
    unit = org_repo.get_by_id(unit_id)
    if not unit:
        return ApiResponse.error(message="Organization unit not found", error_code="NOT_FOUND", status_code=404)
        
    serialized = OrganizationUnitResponse.model_validate(unit).model_dump()
    # Add active commander details if assigned
    serialized["commander_id"] = org_service.get_current_commander(unit_id)
    
    return ApiResponse.success(data=serialized)


@org_bp.route("/units", methods=["POST"])
@require_permission("organization.create", ScopeType.ORGANIZATION_UNIT)
def create_unit():
    """Adds a new organizational department into the structure."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = OrganizationUnitCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    try:
        created_unit = org_service.create_unit(req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
        
    serialized = OrganizationUnitResponse.model_validate(created_unit).model_dump()
    return ApiResponse.success(data=serialized, status_code=21)


@org_bp.route("/units/<unit_id>", methods=["PUT"])
@require_permission("organization.update", ScopeType.ORGANIZATION_UNIT)
def update_unit(unit_id):
    """Updates non-structural attributes of an organization unit."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = OrganizationUnitUpdateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    try:
        updated_unit = org_service.update_unit(unit_id, req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
        
    if not updated_unit:
        return ApiResponse.error(message="Organization unit not found", error_code="NOT_FOUND", status_code=404)
        
    serialized = OrganizationUnitResponse.model_validate(updated_unit).model_dump()
    return ApiResponse.success(data=serialized)


@org_bp.route("/units/<unit_id>/move", methods=["POST"])
@require_permission("organization.manage_hierarchy", ScopeType.ORGANIZATION_UNIT)
def move_unit(unit_id):
    """Adjusts unit placement within hierarchy, guarding against cycles."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = OrganizationMoveRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    try:
        success = org_service.move_unit(unit_id, req, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
        
    if not success:
        return ApiResponse.error(message="Organization unit not found", error_code="NOT_FOUND", status_code=404)
        
    return ApiResponse.success(message="Organization unit successfully relocated.")


@org_bp.route("/units/<unit_id>", methods=["DELETE"])
@require_permission("organization.delete", ScopeType.ORGANIZATION_UNIT)
def delete_unit(unit_id):
    """Soft deletes an organization unit."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    success = org_service.delete_unit(unit_id, tenant_id, user_id)
    if not success:
        return ApiResponse.error(message="Organization unit not found or already deleted", error_code="NOT_FOUND", status_code=404)
        
    return ApiResponse.success(message="Organization unit successfully soft-deleted.")


@org_bp.route("/units/<unit_id>/commander", methods=["POST"])
@require_permission("organization.update", ScopeType.ORGANIZATION_UNIT)
def assign_commander(unit_id):
    """Assigns an active commander to the organization unit."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    try:
        req_data = request.get_json() or {}
        req = CommanderAssignRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )
        
    success = org_service.assign_commander(unit_id, req, tenant_id, user_id)
    if not success:
        return ApiResponse.error(message="Failed to assign unit commander", error_code="BAD_REQUEST", status_code=400)
        
    return ApiResponse.success(message="Unit commander successfully assigned.")


@org_bp.route("/units/<unit_id>/commander", methods=["DELETE"])
@require_permission("organization.update", ScopeType.ORGANIZATION_UNIT)
def remove_commander(unit_id):
    """Removes the unit active commander."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    
    success = org_service.remove_commander(unit_id, tenant_id, user_id)
    if not success:
        return ApiResponse.error(message="No active commander assigned or unit not found", error_code="NOT_FOUND", status_code=404)
        
    return ApiResponse.success(message="Unit commander successfully removed.")
