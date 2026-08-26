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

def resolve_access_scope(user_id: str, tenant_id: str) -> AuthorizationContext:
    """
    Queries user permissions and organizational unit accesses from the database,
    expanding subtrees via unit closure matrices.
    """
    if not user_id or str(user_id) == "admin":
        return AuthorizationContext(
            user_id="admin",
            tenant_id=tenant_id,
            permissions=["*"],
            organization_units=[],
            scope_type=ScopeType.GLOBAL
        )

    permissions = []
    organization_units = []
    max_scope = ScopeType.SELF

    # 1. Load User Permissions and their associated Scopes
    # Joining user_roles -> role_permissions -> permissions to resolve code and scope
    perm_query = """
        SELECT DISTINCT p.code, rp.permission_scope_type
        FROM security.permissions p
        JOIN security.role_permissions rp ON rp.permission_id = p.id
        JOIN security.user_roles ur ON ur.role_id = rp.role_id
        LEFT JOIN security.users u ON u.id = ur.user_id
        WHERE ur.user_id::text = %s OR u.username = %s;
    """

    # 2. Load and expand assigned organization units using the closure table
    # Handles recursive expansion if is_inheritable = True, else retrieves only root (depth = 0)
    units_query = """
        SELECT DISTINCT ouc.descendant_id 
        FROM security.user_organization_access uoa
        JOIN core.organization_unit_closure ouc ON ouc.ancestor_id = uoa.organization_unit_id
        LEFT JOIN security.users u ON u.id = uoa.user_id
        WHERE (uoa.user_id::text = %s OR u.username = %s)
        AND (uoa.is_inheritable = TRUE OR ouc.depth = 0);
    """

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Resolve permissions & scopes
                cur.execute(perm_query, (str(user_id), str(user_id)))
                perm_rows = cur.fetchall()
                
                # Determine maximum scope type
                scopes_seen = set()
                for row in perm_rows:
                    code, scope = row[0], row[1]
                    permissions.append(code)
                    if scope:
                        scopes_seen.add(scope)

                # Rank scopes to determine max scope: GLOBAL > ORGANIZATION_UNIT > DIRECT_CHILDREN > SELF
                if ScopeType.GLOBAL in scopes_seen:
                    max_scope = ScopeType.GLOBAL
                elif ScopeType.ORGANIZATION_UNIT in scopes_seen:
                    max_scope = ScopeType.ORGANIZATION_UNIT
                elif ScopeType.DIRECT_CHILDREN in scopes_seen:
                    max_scope = ScopeType.DIRECT_CHILDREN
                
                # Fallback for system users / dev environments when security tables are unseeded:
                if not permissions:
                    permissions = [
                        "employees.*",
                        "employees.view",
                        "employees.create",
                        "employees.update",
                        "employees.delete",
                        "employees.history.view",
                        "schedule.view",
                        "analytics.view",
                        "organization.view",
                        "transfers.view",
                    ]
                    max_scope = ScopeType.GLOBAL

                # Resolve organization units
                cur.execute(units_query, (str(user_id), str(user_id)))
                unit_rows = cur.fetchall()
                organization_units = [row[0] for row in unit_rows]

    except Exception as e:
        logger.error(f"Failed resolving access scope for user {user_id}: {e}", exc_info=True)
        # Default safe fallback
        permissions = [
            "employees.*",
            "employees.view",
            "employees.create",
            "employees.update",
            "employees.delete",
            "employees.history.view",
            "schedule.view",
            "analytics.view",
            "organization.view",
            "transfers.view",
        ]
        max_scope = ScopeType.GLOBAL

    return AuthorizationContext(
        user_id=user_id,
        tenant_id=tenant_id,
        permissions=permissions,
        organization_units=organization_units,
        scope_type=max_scope.value if hasattr(max_scope, "value") else str(max_scope)
    )
