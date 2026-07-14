"""
Reports module API routes — all endpoints under /api/v1/reports/*
All routes require analytics permissions and respect tenant scoping.
"""
import logging
import os
from flask import Blueprint, request, send_file
from flask_jwt_extended import get_jwt_identity, get_jwt
from pydantic import ValidationError

from app.core.authorization.decorators import require_permission
from app.core.authorization.scopes import ScopeType
from app.core.authorization.exceptions import AccessDeniedError
from app.core.responses import ApiResponse
from app.modules.reports.models import ReportFormat, ReportStatus, ReportType
from app.modules.reports.services import ReportService
from app.modules.reports.schemas import (
    ReportRequestCreate, ReportTemplateResponse,
    ReportRequestResponse, ReportHistoryResponse
)

logger = logging.getLogger("pikud360.modules.reports.routes")
reports_bp = Blueprint("reports", __name__)
report_service = ReportService()


# ── TEMPLATES ──────────────────────────────────────────────────────────────────

@reports_bp.route("/templates", methods=["GET"])
@require_permission("analytics.view", ScopeType.GLOBAL)
def get_templates():
    """List all enabled report templates."""
    templates = report_service.get_enabled_templates()
    serialized = [
        ReportTemplateResponse(
            id=t.id,
            code=t.code,
            name=t.name,
            description=t.description,
            supported_formats=t.supported_formats,
            enabled=t.enabled
        ).model_dump()
        for t in templates
    ]
    return ApiResponse.success(data=serialized, meta={"total": len(serialized)})


# ── HISTORY ────────────────────────────────────────────────────────────────────

@reports_bp.route("/history", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def get_history():
    """Return report generation history for the authenticated tenant."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")
    org_unit_id = request.args.get("unit_id")
    limit = min(int(request.args.get("limit", 50)), 200)

    reports = report_service.get_history(tenant_id, org_unit_id, limit)
    items = [
        ReportRequestResponse(
            id=r.id,
            name=r.name,
            report_type=r.report_type,
            format=r.format,
            status=r.status,
            org_unit_id=r.org_unit_id,
            file_path=r.file_path,
            file_name=r.file_name,
            file_size=r.file_size,
            download_count=r.download_count,
            error_message=r.error_message,
            generated_at=r.generated_at,
            duration_ms=r.duration_ms,
            mime_type=r.mime_type,
            checksum=r.checksum,
            started_at=r.started_at,
            completed_at=r.completed_at,
            created_at=r.created_at
        ).model_dump()
        for r in reports
    ]
    return ApiResponse.success(data=items, meta={"total": len(items)})


# ── SINGLE REPORT STATUS ───────────────────────────────────────────────────────

@reports_bp.route("/<report_id>", methods=["GET"])
@require_permission("analytics.view", ScopeType.GLOBAL)
def get_report(report_id):
    """Fetch a specific report record and its current status."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        report = report_service.get_report(report_id, tenant_id)
        if not report:
            return ApiResponse.error("Report not found.", "NOT_FOUND", status_code=404)
        serialized = ReportRequestResponse(
            id=report.id,
            name=report.name,
            report_type=report.report_type,
            format=report.format,
            status=report.status,
            org_unit_id=report.org_unit_id,
            file_path=report.file_path,
            file_name=report.file_name,
            file_size=report.file_size,
            download_count=report.download_count,
            error_message=report.error_message,
            generated_at=report.generated_at,
            duration_ms=report.duration_ms,
            mime_type=report.mime_type,
            checksum=report.checksum,
            started_at=report.started_at,
            completed_at=report.completed_at,
            created_at=report.created_at
        )
        return ApiResponse.success(data=serialized.model_dump())
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error fetching report {report_id}: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── GENERATE ───────────────────────────────────────────────────────────────────

@reports_bp.route("/generate", methods=["POST"])
@require_permission("analytics.export", ScopeType.ORGANIZATION_UNIT)
def generate_report():
    """Request asynchronous generation of a report. Enqueued to the SchedulerEngine."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        body = ReportRequestCreate(**(request.get_json() or {}))
    except ValidationError as e:
        return ApiResponse.error("Validation failed", "VALIDATION_ERROR", e.errors(), 400)

    try:
        report = report_service.request_report(
            tenant_id=tenant_id,
            user_id=user_id,
            report_type=body.report_type,
            format=body.format,
            org_unit_id=body.org_unit_id,
            parameters=body.parameters
        )
        serialized = ReportRequestResponse(
            id=report.id,
            name=report.name,
            report_type=report.report_type,
            format=report.format,
            status=report.status,
            org_unit_id=report.org_unit_id,
            created_at=report.created_at
        )
        return ApiResponse.success(
            data=serialized.model_dump(),
            message="Report request accepted. Generation queued for background processing.",
            status_code=202
        )
    except ValueError as e:
        return ApiResponse.error(str(e), "BAD_REQUEST", status_code=400)
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error creating report request: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── DELETE ─────────────────────────────────────────────────────────────────────

@reports_bp.route("/<report_id>", methods=["DELETE"])
@require_permission("analytics.manage", ScopeType.GLOBAL)
def delete_report(report_id):
    """Delete a report record and associated metadata."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        deleted = report_service.delete_report(report_id, tenant_id)
        if not deleted:
            return ApiResponse.error("Report not found.", "NOT_FOUND", status_code=404)
        return ApiResponse.success(message="Report deleted successfully.")
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error deleting report {report_id}: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)


# ── DOWNLOAD ───────────────────────────────────────────────────────────────────

@reports_bp.route("/<report_id>/download", methods=["GET"])
@require_permission("analytics.view", ScopeType.ORGANIZATION_UNIT)
def download_report(report_id):
    """Securely stream a generated report file."""
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    try:
        from app.modules.reports.download import ReportDownloadService
        download_service = ReportDownloadService()
        file_path, mime_type, file_name = download_service.get_download_metadata(report_id, tenant_id)

        return send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=True,
            download_name=file_name
        )
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            return ApiResponse.error(msg, "NOT_FOUND", status_code=404)
        return ApiResponse.error(msg, "BAD_REQUEST", status_code=400)
    except FileNotFoundError as e:
        return ApiResponse.error(str(e), "NOT_FOUND", status_code=404)
    except AccessDeniedError as e:
        return ApiResponse.error(str(e), "FORBIDDEN", status_code=403)
    except Exception as e:
        logger.error(f"Error downloading report {report_id}: {e}", exc_info=True)
        return ApiResponse.error("Internal server error", "INTERNAL_ERROR", status_code=500)
