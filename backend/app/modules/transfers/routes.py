from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from pydantic import ValidationError
import logging

from app.modules.transfers.repositories import TransferRepository
from app.modules.workforce.repositories import EmployeeRepository, EmployeeHistoryRepository
from app.modules.organization.repositories import OrganizationRepository
from app.modules.security.repositories import AuditLogRepository
from app.modules.transfers.services import TransfersService
from app.modules.transfers.schemas import TransferCreateRequest, TransferResponse
from app.core.authorization import require_permission, ScopeType, AccessDeniedError
from app.core.responses import ApiResponse
from app.modules.notifications.services import NotificationService # Resolve dependency

logger = logging.getLogger("pikud360.modules.transfers.routes")

transfers_bp = Blueprint("transfers", __name__)

# Initialize dependencies
transfer_repo = TransferRepository()
employee_repo = EmployeeRepository()
org_repo = OrganizationRepository()
history_repo = EmployeeHistoryRepository()
audit_repo = AuditLogRepository()

# Notifications service initialization
from app.modules.notifications.repositories import NotificationRepository
notif_repo = NotificationRepository()
notif_service = NotificationService(notification_repo=notif_repo)

transfers_service = TransfersService(
    transfer_repo=transfer_repo,
    employee_repo=employee_repo,
    org_repo=org_repo,
    history_repo=history_repo,
    audit_repo=audit_repo,
    notification_service=notif_service
)

@transfers_bp.route("/transfers", methods=["GET"])
@require_permission("transfers.view", ScopeType.ORGANIZATION_UNIT)
def list_transfers():
    """Lists transfers within organization units accessible to active commander."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    results = transfers_service.list_transfers(tenant_id, user_id)
    return ApiResponse.success(data=results)

@transfers_bp.route("/transfers", methods=["POST"])
@require_permission("transfers.request", ScopeType.ORGANIZATION_UNIT)
def request_transfer():
    """Submits a new employee transfer request."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        req_data = request.get_json() or {}
        req = TransferCreateRequest(**req_data)
    except ValidationError as e:
        return ApiResponse.error(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details=e.errors(),
            status_code=400
        )

    try:
        created = transfers_service.request_transfer(
            employee_id=req.employee_id,
            to_unit_id=req.to_unit_id,
            reason=req.reason,
            tenant_id=tenant_id,
            operator_user_id=user_id
        )
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = TransferResponse.model_validate(created).model_dump()
    return ApiResponse.success(data=serialized, status_code=201)

@transfers_bp.route("/transfers/<transfer_id>/approve", methods=["PUT"])
@require_permission("transfers.approve", ScopeType.ORGANIZATION_UNIT)
def approve_transfer(transfer_id):
    """Signs off and commits a pending employee transfer."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        completed = transfers_service.approve_transfer(transfer_id, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = TransferResponse.model_validate(completed).model_dump()
    return ApiResponse.success(data=serialized)

@transfers_bp.route("/transfers/<transfer_id>/reject", methods=["PUT"])
@require_permission("transfers.approve", ScopeType.ORGANIZATION_UNIT)
def reject_transfer(transfer_id):
    """Rejects a pending employee transfer request."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        rejected = transfers_service.reject_transfer(transfer_id, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = TransferResponse.model_validate(rejected).model_dump()
    return ApiResponse.success(data=serialized)

@transfers_bp.route("/transfers/<transfer_id>/cancel", methods=["PUT"])
@require_permission("transfers.request", ScopeType.ORGANIZATION_UNIT)
def cancel_transfer(transfer_id):
    """Cancels a pending employee transfer request."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        cancelled = transfers_service.cancel_transfer(transfer_id, tenant_id, user_id)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)

    serialized = TransferResponse.model_validate(cancelled).model_dump()
    return ApiResponse.success(data=serialized)
