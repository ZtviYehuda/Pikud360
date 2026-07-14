import logging
from typing import Any, List, Optional, Tuple
from app.database.connection import get_db_connection

logger = logging.getLogger("pikud360.security.permissions")

def get_user_permissions_and_scopes(user_id: str) -> List[Tuple[str, str]]:
    """Fetches list of tuples containing (permission_code, permission_scope_type) for the user."""
    query = """
        SELECT p.code, rp.permission_scope_type
        FROM security.permissions p
        JOIN security.role_permissions rp ON rp.permission_id = p.id
        JOIN security.user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = %s;
    """
    permissions = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                for row in cur.fetchall():
                    permissions.append((row[0], row[1]))
    except Exception as e:
        logger.error(f"Failed to fetch permissions for user {user_id}: {e}")
    return permissions

def get_user_roles(user_id: str) -> List[str]:
    """Queries security.roles to return a list of assigned role names."""
    query = """
        SELECT r.name 
        FROM security.roles r
        JOIN security.user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = %s AND r.deleted_at IS NULL;
    """
    roles = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                roles = [row[0] for row in cur.fetchall()]
    except Exception as e:
        logger.error(f"Failed to fetch roles for user {user_id}: {e}")
    return roles


def is_descendant_unit(ancestor_id: str, descendant_id: str) -> bool:
    """Queries closure table to see if descendant_id is within ancestor_id's subtree."""
    query = """
        SELECT 1 FROM core.organization_unit_closure
        WHERE ancestor_id = %s AND descendant_id = %s;
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (ancestor_id, descendant_id))
                return cur.fetchone() is not None
    except Exception as e:
        logger.error(f"Error checking closure tree: {e}")
        return False

def get_user_scoped_units(user_id: str) -> List[Tuple[str, bool]]:
    """Gets user organization access scopes: list of tuples (org_unit_id, is_inheritable)."""
    query = """
        SELECT organization_unit_id, is_inheritable
        FROM security.user_organization_access
        WHERE user_id = %s AND deleted_at IS NULL;
    """
    scopes = []
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                for row in cur.fetchall():
                    scopes.append((row[0], row[1]))
    except Exception as e:
        logger.error(f"Failed to fetch user org scopes: {e}")
    return scopes

def has_permission(user: Any, permission_code: str, resource: Optional[Any] = None) -> bool:
    """
    Validates if user has permission.
    
    Arguments:
        user: The active User entity.
        permission_code: E.g., 'employee.view', 'shift.manage'.
        resource: Target entity containing unit or owner identifier, e.g. dictionary or object.
    """
    if not user or not user.is_active:
        return False

    # 1. Fetch user permissions and scopes
    user_perms = get_user_permissions_and_scopes(user.id)
    
    # Filter matching permission codes
    matching_scopes = [scope for code, scope in user_perms if code == permission_code]
    if not matching_scopes:
        return False

    # If any matching permission has GLOBAL scope, access is immediately granted
    if "GLOBAL" in matching_scopes:
        return True

    # 2. Check resource-level scoping
    if resource is None:
        # If no specific resource was targeted, but the user has the permission under some scope, allow it.
        return True

    for scope in matching_scopes:
        if scope == "SELF":
            # Check ownership. Resource is expected to have 'user_id' or 'id' equal to user.id
            resource_owner = getattr(resource, "user_id", None) or getattr(resource, "id", None)
            if isinstance(resource, dict):
                resource_owner = resource.get("user_id") or resource.get("id")
            if resource_owner == user.id:
                return True

        elif scope == "ORGANIZATION_UNIT":
            # Check unit hierarchy
            resource_unit = getattr(resource, "org_unit_id", None)
            if isinstance(resource, dict):
                resource_unit = resource.get("org_unit_id")
                
            if not resource_unit:
                continue

            # Load user scoped unit mappings
            user_units = get_user_scoped_units(user.id)
            for unit_id, is_inheritable in user_units:
                if resource_unit == unit_id:
                    return True
                if is_inheritable and is_descendant_unit(unit_id, resource_unit):
                    return True

    return False
