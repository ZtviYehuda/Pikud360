from app.core.authorization.exceptions import AuthorizationError, AccessDeniedError
from app.core.authorization.scopes import ScopeType, AuthorizationContext, resolve_access_scope
from app.core.authorization.policies import (
    match_permission, check_authorization, can_view_employee, can_manage_unit,
    can_view_schedule, can_manage_schedule
)
from app.core.authorization.decorators import require_permission
from app.core.authorization.middleware import init_authorization_middleware

__all__ = [
    "AuthorizationError",
    "AccessDeniedError",
    "ScopeType",
    "AuthorizationContext",
    "resolve_access_scope",
    "match_permission",
    "check_authorization",
    "require_permission",
    "init_authorization_middleware",
    "can_view_employee",
    "can_manage_unit",
    "can_view_schedule",
    "can_manage_schedule",
]


