from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Set
import logging
import json

from app.database.connection import get_db_connection

logger = logging.getLogger("matzevet.core.authorization.scopes")

class ScopeType(str, Enum):
    GLOBAL = "GLOBAL"
    ORGANIZATION_UNIT = "ORGANIZATION_UNIT"
    DIRECT_CHILDREN = "DIRECT_CHILDREN"
    SELF = "SELF"

@dataclass
class AuthorizationContext:
    user_id: str
    tenant_id: str
    permissions: List[str] = field(default_factory=list)
    organization_units: List[str] = field(default_factory=list)
    scope_type: str = "SELF"

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "tenant_id": self.tenant_id,
            "permissions": self.permissions,
            "organization_units": self.organization_units,
            "scope_type": self.scope_type
        }

    @classmethod
    def from_dict(cls, data: dict) -> "AuthorizationContext":
        return cls(
            user_id=data["user_id"],
            tenant_id=data["tenant_id"],
            permissions=data.get("permissions", []),
            organization_units=data.get("organization_units", []),
            scope_type=data.get("scope_type", "SELF")
        )

# Design for Redis Caching:
# Future integration can utilize a Redis backend helper like:
# redis_client.get(f"auth_ctx:{user_id}") -> deserialize to AuthorizationContext
# redis_client.setex(f"auth_ctx:{user_id}", 300, json.dumps(context.to_dict()))

def resolve_access_scope(user_id: str, tenant_id: str, claims: Optional[dict] = None) -> AuthorizationContext:
    """
    CRITICAL SECURITY POLICY:
    Independently resolves user permissions and allowed organizational unit boundaries.
    Non-admins are strictly confined to their assigned organization hierarchy.
    """
    from app.core.authorization.org_hierarchy import get_user_effective_scope

    effective = get_user_effective_scope(user_id, claims=claims)

    default_perms = [
        "employees.*",
        "employees.view",
        "employees.create",
        "employees.update",
        "employees.delete",
        "employees.history.view",
        "schedule.view",
        "schedule.manage",
        "analytics.view",
        "organization.view",
        "transfers.view",
    ]

    if effective.get("is_admin") or effective.get("level") == "global":
        return AuthorizationContext(
            user_id=str(user_id) if user_id else "admin",
            tenant_id=tenant_id,
            permissions=["*"] + default_perms,
            organization_units=[],
            scope_type=ScopeType.GLOBAL.value
        )

    # For non-admin users, query any custom roles/permissions or use default permissions
    permissions = []
    perm_query = """
        SELECT DISTINCT p.code
        FROM security.permissions p
        JOIN security.role_permissions rp ON rp.permission_id = p.id
        JOIN security.user_roles ur ON ur.role_id = rp.role_id
        LEFT JOIN security.users u ON u.id = ur.user_id
        WHERE ur.user_id::text = %s OR u.username = %s;
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(perm_query, (str(user_id), str(user_id)))
                perm_rows = cur.fetchall()
                for row in perm_rows:
                    permissions.append(row[0])
    except Exception as e:
        logger.warning(f"Error fetching role permissions for {user_id}: {e}")

    if not permissions:
        permissions = default_perms

    allowed_units = list(effective.get("allowed_unit_ids") or [])

    return AuthorizationContext(
        user_id=str(user_id),
        tenant_id=tenant_id,
        permissions=permissions,
        organization_units=allowed_units,
        scope_type=ScopeType.ORGANIZATION_UNIT.value if allowed_units else ScopeType.SELF.value
    )
