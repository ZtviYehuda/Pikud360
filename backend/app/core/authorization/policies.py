from typing import List, Optional
import logging

from app.core.authorization.scopes import AuthorizationContext, ScopeType, resolve_access_scope
from app.database.connection import get_db_connection


logger = logging.getLogger("pikud360.core.authorization.policies")

def match_permission(user_perms: List[str], required_perm: str) -> bool:
    """Matches permission codes supporting exact matches and trailing wildcard patterns (e.g. employees.*)."""
    for perm in user_perms:
        if perm == required_perm:
            return True
        if perm.endswith(".*"):
            prefix = perm[:-2] # "employees" from "employees.*"
            if required_perm.startswith(prefix + ".") or required_perm == prefix:
                return True
    return False

def check_authorization(
    ctx: AuthorizationContext,
    required_perm: str,
    resource_unit_id: Optional[str] = None,
    resource_owner_id: Optional[str] = None,
    required_scope: ScopeType = ScopeType.ORGANIZATION_UNIT
) -> bool:
    """
    Core policy rule engine. Matches permissions (exact/wildcard) and verifies scope type boundaries
    including GLOBAL, ORGANIZATION_UNIT, DIRECT_CHILDREN, and SELF mappings.
    """
    # 1. Match Permission Code (Exact or Wildcard)
    if not match_permission(ctx.permissions, required_perm):
        logger.debug(f"Permission mismatch: user={ctx.user_id} required={required_perm}")
        return False

    # 2. Match scope types
    # GLOBAL scope gives access to everything under the active tenant
    if ctx.scope_type == ScopeType.GLOBAL.value:
        return True

    if required_scope == ScopeType.GLOBAL:
        return ctx.scope_type == ScopeType.GLOBAL.value

    if required_scope == ScopeType.ORGANIZATION_UNIT:
        if not resource_unit_id:
            # If no specific resource unit is constrained, grant access based on permission possession
            return True
        return resource_unit_id in ctx.organization_units

    if required_scope == ScopeType.DIRECT_CHILDREN:
        if not resource_unit_id:
            return True
        # Verify closure matrix depth: depth <= 1 (self and immediate descendants only)
        query = """
            SELECT COUNT(*) 
            FROM core.organization_unit_closure
            WHERE ancestor_id IN (
                SELECT org_unit_id FROM security.user_organization_access WHERE user_id = %s
            )
            AND descendant_id = %s AND depth <= 1;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (ctx.user_id, resource_unit_id))
                    row = cur.fetchone()
                    if row and row[0] > 0:
                        return True
        except Exception as e:
            logger.error(f"Error checking DIRECT_CHILDREN closure depth: {e}")
        return False

    if required_scope == ScopeType.SELF:
        if not resource_owner_id:
            return False
        return resource_owner_id == ctx.user_id

    return False

def can_view_employee(user_id: str, tenant_id: str, employee_unit_id: str) -> bool:
    """Verifies if the user is authorized to read records for a specific employee unit."""
    ctx = resolve_access_scope(user_id, tenant_id)
    return check_authorization(ctx, "employees.view", resource_unit_id=employee_unit_id, required_scope=ScopeType.ORGANIZATION_UNIT)

def can_manage_unit(user_id: str, tenant_id: str, unit_id: str) -> bool:
    """Verifies if the user holds unit modification permissions (create/update) for the organizational scope."""
    ctx = resolve_access_scope(user_id, tenant_id)
    return (
        check_authorization(ctx, "employees.create", resource_unit_id=unit_id, required_scope=ScopeType.ORGANIZATION_UNIT) or
        check_authorization(ctx, "employees.update", resource_unit_id=unit_id, required_scope=ScopeType.ORGANIZATION_UNIT)
    )

def can_view_schedule(user_id: str, tenant_id: str, unit_id: str) -> bool:
    """Verifies if the user is authorized to view daily status schedules for a unit."""
    ctx = resolve_access_scope(user_id, tenant_id)
    return check_authorization(ctx, "schedule.view", resource_unit_id=unit_id, required_scope=ScopeType.ORGANIZATION_UNIT)

def can_manage_schedule(user_id: str, tenant_id: str, unit_id: str) -> bool:
    """Verifies if the user holds scheduling edit permissions (schedule.manage or schedule.settings_manage)."""
    ctx = resolve_access_scope(user_id, tenant_id)
    return (
        check_authorization(ctx, "schedule.manage", resource_unit_id=unit_id, required_scope=ScopeType.ORGANIZATION_UNIT) or
        check_authorization(ctx, "schedule.settings_manage", resource_unit_id=unit_id, required_scope=ScopeType.ORGANIZATION_UNIT)
    )



