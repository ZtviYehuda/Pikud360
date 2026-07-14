from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging

from app.modules.intelligence.dashboard.services import DashboardService
from app.core.responses import ApiResponse
from app.core.authorization import require_permission, ScopeType, AccessDeniedError

logger = logging.getLogger("pikud360.modules.intelligence.dashboard.routes")

dashboard_bp = Blueprint("intelligence_dashboard", __name__)
dashboard_service = DashboardService()

@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
@require_permission("dashboard.view", ScopeType.ORGANIZATION_UNIT)
def get_dashboard_summary():
    """Retrieves commander intelligence operational picture aggregated metrics."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    tenant_id = claims.get("tenant_id")

    unit_id = request.args.get("unit_id")
    date_str = request.args.get("date")
    range_str = request.args.get("range", "day") # day, week, month

    if not unit_id or not date_str:
        return ApiResponse.error(
            message="Missing required parameters: unit_id and date are mandatory.",
            error_code="BAD_REQUEST",
            status_code=400
        )

    try:
        summary = dashboard_service.get_dashboard_summary(
            unit_id=unit_id,
            date_str=date_str,
            range_str=range_str,
            tenant_id=tenant_id,
            operator_id=user_id
        )
        return ApiResponse.success(data=summary)
    except AccessDeniedError as e:
        return ApiResponse.error(message=str(e), error_code="FORBIDDEN", status_code=403)
    except ValueError as e:
        return ApiResponse.error(message=str(e), error_code="BAD_REQUEST", status_code=400)
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {e}", exc_info=True)
        return ApiResponse.error(message="System error compiling dashboard", error_code="INTERNAL_SERVER_ERROR", status_code=500)
