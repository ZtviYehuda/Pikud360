"""
Admin module API routes — all endpoints under /api/admin/*
All routes require GLOBAL scope permissions; only system administrators may access.
"""
import logging
import csv
import io
from flask import Blueprint, request, make_response
from flask_jwt_extended import get_jwt_identity, get_jwt
from pydantic import ValidationError

from app.core.authorization.decorators import require_permission
from app.core.authorization.scopes import ScopeType
from app.core.authorization.exceptions import AccessDeniedError
from app.core.responses import ApiResponse
from app.modules.admin.services import admin_service
from app.modules.admin.schemas import (
    SystemSettingsUpdateRequest,
    BusinessRuleCreateRequest, BusinessRuleUpdateRequest,
    AutomationRuleCreateRequest, AutomationRuleUpdateRequest,
    NotificationTemplateCreateRequest, NotificationTemplateUpdateRequest,
    BusinessRuleResponse, AutomationRuleResponse,
    NotificationTemplateResponse, SystemSettingResponse
)

logger = logging.getLogger("pikud360.modules.admin.routes")
admin_bp = Blueprint("admin", __name__)


# ── System Settings ──────────────────────────────────────────────────────────

@admin_bp.route("/settings", methods=["GET"])
@require_permission("system.settings.view", ScopeType.GLOBAL)
def get_settings():
    """Returns all global system settings for the platform."""
    settings = admin_service.get_all_settings()
    serialized = [SystemSettingResponse(
        key=s.key, value=s.value, description=s.description,
        updated_at=s.updated_at
    ).model_dump() for s in settings]
    return ApiResponse.success(data=serialized, meta={"total": len(serialized)})


@admin_bp.route("/settings", methods=["PUT"])
@require_permission("system.settings.manage", ScopeType.GLOBAL)
def update_settings():
    """Bulk-updates one or more system settings."""
    try:
        req = SystemSettingsUpdateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    updated = admin_service.update_settings(req)
    serialized = [SystemSettingResponse(
        key=s.key, value=s.value, description=s.description,
        updated_at=s.updated_at
    ).model_dump() for s in updated]
    return ApiResponse.success(data=serialized, message=f"Updated {len(updated)} settings.")


# ── Business Rules ─────────────────────────────────────────────────────────

@admin_bp.route("/business-rules", methods=["GET"])
@require_permission("business_rules.view", ScopeType.GLOBAL)
def list_business_rules():
    """Returns all business rules for the current tenant."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    active_only = request.args.get("active_only", "false").lower() == "true"
    rules = admin_service.list_business_rules(tenant_id, active_only=active_only)
    serialized = [BusinessRuleResponse(**r.__dict__).model_dump() for r in rules]
    return ApiResponse.success(data=serialized, meta={"total": len(serialized)})


@admin_bp.route("/business-rules", methods=["POST"])
@require_permission("business_rules.manage", ScopeType.GLOBAL)
def create_business_rule():
    """Creates a new configurable business rule."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    try:
        req = BusinessRuleCreateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    created = admin_service.create_business_rule(req, tenant_id, user_id)
    if not created:
        return ApiResponse.error("Failed to create business rule", "INTERNAL_ERROR", status_code=500)
    return ApiResponse.success(data=BusinessRuleResponse(**created.__dict__).model_dump(), status_code=201)


@admin_bp.route("/business-rules/<rule_id>", methods=["PUT"])
@require_permission("business_rules.manage", ScopeType.GLOBAL)
def update_business_rule(rule_id):
    """Updates a specific business rule."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    try:
        req = BusinessRuleUpdateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    updated = admin_service.update_business_rule(rule_id, req, tenant_id, user_id)
    if not updated:
        return ApiResponse.error("Business rule not found", "NOT_FOUND", status_code=404)
    return ApiResponse.success(data=BusinessRuleResponse(**updated.__dict__).model_dump())


@admin_bp.route("/business-rules/<rule_id>", methods=["DELETE"])
@require_permission("business_rules.manage", ScopeType.GLOBAL)
def deactivate_business_rule(rule_id):
    """Deactivates a business rule (soft delete)."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    success = admin_service.deactivate_business_rule(rule_id, tenant_id)
    if not success:
        return ApiResponse.error("Failed to deactivate rule", "NOT_FOUND", status_code=404)
    return ApiResponse.success(message="Business rule deactivated.")


# ── Audit Center ───────────────────────────────────────────────────────────

@admin_bp.route("/audit", methods=["GET"])
@require_permission("audit.view", ScopeType.GLOBAL)
def list_audit_logs():
    """Returns paginated audit log entries with optional filtering."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    page = int(request.args.get("page", 1))
    page_size = min(int(request.args.get("page_size", 50)), 200)
    filters = {
        "page": page,
        "page_size": page_size,
        "event_type": request.args.get("event_type"),
        "severity": request.args.get("severity"),
        "user_id": request.args.get("user_id"),
        "date_from": request.args.get("date_from"),
        "date_to": request.args.get("date_to")
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None or k in ("page", "page_size")}
    result = admin_service.get_audit_logs(tenant_id, **filters)
    return ApiResponse.success(
        data=result["entries"],
        meta={"total": result["total"], "page": result["page"], "page_size": result["page_size"]}
    )


@admin_bp.route("/audit/export", methods=["POST"])
@require_permission("audit.export", ScopeType.GLOBAL)
def export_audit_logs():
    """Exports filtered audit logs as a CSV file attachment."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    body = request.get_json() or {}
    filters = {
        "page": 1,
        "page_size": 5000,
        "event_type": body.get("event_type"),
        "severity": body.get("severity"),
        "user_id": body.get("user_id"),
        "date_from": body.get("date_from"),
        "date_to": body.get("date_to")
    }
    filters = {k: v for k, v in filters.items() if v is not None or k in ("page", "page_size")}
    result = admin_service.get_audit_logs(tenant_id, **filters)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "event_type", "action", "table_name", "record_id",
        "user_id", "severity", "ip_address", "created_at"
    ])
    writer.writeheader()
    for entry in result["entries"]:
        writer.writerow({k: entry.get(k, "") for k in writer.fieldnames})

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=audit_export.csv"
    response.headers["Content-Type"] = "text/csv"
    return response


# ── Automation Rules ────────────────────────────────────────────────────────

@admin_bp.route("/automation", methods=["GET"])
@require_permission("automation.view", ScopeType.GLOBAL)
def list_automation_rules():
    """Returns all automation rules for the current tenant."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    active_only = request.args.get("active_only", "false").lower() == "true"
    rules = admin_service.list_automation_rules(tenant_id, active_only=active_only)
    serialized = [AutomationRuleResponse(**r.__dict__).model_dump() for r in rules]
    return ApiResponse.success(data=serialized, meta={"total": len(serialized)})


@admin_bp.route("/automation", methods=["POST"])
@require_permission("automation.manage", ScopeType.GLOBAL)
def create_automation_rule():
    """Creates a new automation rule."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    try:
        req = AutomationRuleCreateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    created = admin_service.create_automation_rule(req, tenant_id, user_id)
    if not created:
        return ApiResponse.error("Failed to create automation rule", "INTERNAL_ERROR", status_code=500)
    return ApiResponse.success(data=AutomationRuleResponse(**created.__dict__).model_dump(), status_code=201)


@admin_bp.route("/automation/<rule_id>", methods=["PUT"])
@require_permission("automation.manage", ScopeType.GLOBAL)
def update_automation_rule(rule_id):
    """Updates a specific automation rule."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    try:
        req = AutomationRuleUpdateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    updated = admin_service.update_automation_rule(rule_id, req, tenant_id, user_id)
    if not updated:
        return ApiResponse.error("Automation rule not found", "NOT_FOUND", status_code=404)
    return ApiResponse.success(data=AutomationRuleResponse(**updated.__dict__).model_dump())


@admin_bp.route("/automation/<rule_id>", methods=["DELETE"])
@require_permission("automation.manage", ScopeType.GLOBAL)
def deactivate_automation_rule(rule_id):
    """Deactivates an automation rule."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    success = admin_service.deactivate_automation_rule(rule_id, tenant_id)
    if not success:
        return ApiResponse.error("Failed to deactivate rule", "NOT_FOUND", status_code=404)
    return ApiResponse.success(message="Automation rule deactivated.")


# ── Notification Templates ─────────────────────────────────────────────────

@admin_bp.route("/notification-templates", methods=["GET"])
@require_permission("notification_templates.view", ScopeType.GLOBAL)
def list_notification_templates():
    """Returns all notification templates for the current tenant."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    active_only = request.args.get("active_only", "false").lower() == "true"
    templates = admin_service.list_notification_templates(tenant_id, active_only=active_only)
    serialized = [NotificationTemplateResponse(**t.__dict__).model_dump() for t in templates]
    return ApiResponse.success(data=serialized, meta={"total": len(serialized)})


@admin_bp.route("/notification-templates", methods=["POST"])
@require_permission("notification_templates.manage", ScopeType.GLOBAL)
def create_notification_template():
    """Creates a new notification template."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    try:
        req = NotificationTemplateCreateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    created = admin_service.create_notification_template(req, tenant_id, user_id)
    if not created:
        return ApiResponse.error("Failed to create template", "INTERNAL_ERROR", status_code=500)
    return ApiResponse.success(data=NotificationTemplateResponse(**created.__dict__).model_dump(), status_code=201)


@admin_bp.route("/notification-templates/<template_id>", methods=["PUT"])
@require_permission("notification_templates.manage", ScopeType.GLOBAL)
def update_notification_template(template_id):
    """Updates a specific notification template."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    try:
        req = NotificationTemplateUpdateRequest(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    updated = admin_service.update_notification_template(template_id, req, tenant_id, user_id)
    if not updated:
        return ApiResponse.error("Template not found", "NOT_FOUND", status_code=404)
    return ApiResponse.success(data=NotificationTemplateResponse(**updated.__dict__).model_dump())


# ── System Health ──────────────────────────────────────────────────────────

@admin_bp.route("/system-health", methods=["GET"])
@require_permission("system_health.view", ScopeType.GLOBAL)
def get_system_health():
    """Returns aggregated system health metrics across all subsystems."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    health = admin_service.get_system_health(tenant_id)
    return ApiResponse.success(data=health)
