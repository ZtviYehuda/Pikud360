import logging
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db_connection
from app.modules.organization.models import OrganizationUnit, OrganizationUnitCommander

logger = logging.getLogger("pikud360.modules.organization.repositories")

class OrganizationRepository:
    """Repository managing core.organization_units table CRUD and closures."""

    def _row_to_entity(self, row) -> OrganizationUnit:
        return OrganizationUnit(
            id=row[0],
            tenant_id=row[1],
            parent_id=row[2],
            type_id=row[3],
            name=row[4],
            code=row[5],
            description=row[6],
            sort_order=row[7],
            is_active=row[8],
            created_at=row[9],
            updated_at=row[10],
            deleted_at=row[11]
        )

    def get_by_id(self, unit_id: str) -> Optional[OrganizationUnit]:
        query = """
            SELECT id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_at, updated_at, deleted_at
            FROM core.organization_units
            WHERE id = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching unit {unit_id}: {e}", exc_info=True)
        return None

    def get_by_code(self, tenant_id: str, code: str) -> Optional[OrganizationUnit]:
        query = """
            SELECT id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_at, updated_at, deleted_at
            FROM core.organization_units
            WHERE tenant_id = %s AND code = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id, code))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching unit by code {code}: {e}", exc_info=True)
        return None

    def create(self, unit: OrganizationUnit, created_by: Optional[str] = None) -> OrganizationUnit:
        query = """
            INSERT INTO core.organization_units (
                id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_by, updated_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_at, updated_at, deleted_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        unit.id, unit.tenant_id, unit.parent_id, unit.type_id, unit.name,
                        unit.code, unit.description, unit.sort_order, unit.is_active,
                        created_by, created_by
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to create organization unit.")

    def update(self, unit_id: str, unit: OrganizationUnit, updated_by: Optional[str] = None) -> Optional[OrganizationUnit]:
        query = """
            UPDATE core.organization_units
            SET name = %s, code = %s, description = %s, sort_order = %s, is_active = %s, 
                updated_at = CURRENT_TIMESTAMP, updated_by = %s
            WHERE id = %s AND deleted_at IS NULL
            RETURNING id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_at, updated_at, deleted_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        unit.name, unit.code, unit.description, unit.sort_order, unit.is_active,
                        updated_by, unit_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        return None

    def move(self, unit_id: str, parent_id: Optional[str], updated_by: Optional[str] = None) -> bool:
        query = """
            UPDATE core.organization_units
            SET parent_id = %s, updated_at = CURRENT_TIMESTAMP, updated_by = %s
            WHERE id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (parent_id, updated_by, unit_id))
                rows_updated = cur.rowcount
                conn.commit()
                return rows_updated > 0

    def delete(self, unit_id: str, deleted_by: Optional[str] = None) -> bool:
        query = """
            UPDATE core.organization_units
            SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE, updated_by = %s
            WHERE id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (deleted_by, unit_id))
                rows_updated = cur.rowcount
                conn.commit()
                return rows_updated > 0

    def get_root_units(self, tenant_id: str) -> List[OrganizationUnit]:
        query = """
            SELECT id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_at, updated_at, deleted_at
            FROM core.organization_units
            WHERE tenant_id = %s AND parent_id IS NULL AND deleted_at IS NULL
            ORDER BY sort_order, name;
        """
        units = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    for row in cur.fetchall():
                        units.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error fetching root units for tenant {tenant_id}: {e}", exc_info=True)
        return units

    def get_children(self, unit_id: str) -> List[OrganizationUnit]:
        query = """
            SELECT id, tenant_id, parent_id, type_id, name, code, description, sort_order, is_active, created_at, updated_at, deleted_at
            FROM core.organization_units
            WHERE parent_id = %s AND deleted_at IS NULL
            ORDER BY sort_order, name;
        """
        units = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    for row in cur.fetchall():
                        units.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error fetching children of unit {unit_id}: {e}", exc_info=True)
        return units

    def get_descendants(self, unit_id: str) -> List[OrganizationUnit]:
        query = """
            SELECT ou.id, ou.tenant_id, ou.parent_id, ou.type_id, ou.name, ou.code, ou.description, ou.sort_order, ou.is_active, ou.created_at, ou.updated_at, ou.deleted_at
            FROM core.organization_units ou
            JOIN core.organization_unit_closure ouc ON ouc.descendant_id = ou.id
            WHERE ouc.ancestor_id = %s AND ouc.depth > 0 AND ou.deleted_at IS NULL
            ORDER BY ouc.depth, ou.sort_order;
        """
        units = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    for row in cur.fetchall():
                        units.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error fetching descendants of unit {unit_id}: {e}", exc_info=True)
        return units

    def get_ancestors(self, unit_id: str) -> List[OrganizationUnit]:
        query = """
            SELECT ou.id, ou.tenant_id, ou.parent_id, ou.type_id, ou.name, ou.code, ou.description, ou.sort_order, ou.is_active, ou.created_at, ou.updated_at, ou.deleted_at
            FROM core.organization_units ou
            JOIN core.organization_unit_closure ouc ON ouc.ancestor_id = ou.id
            WHERE ouc.descendant_id = %s AND ouc.depth > 0 AND ou.deleted_at IS NULL
            ORDER BY ouc.depth DESC, ou.sort_order;
        """
        units = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    for row in cur.fetchall():
                        units.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error fetching ancestors of unit {unit_id}: {e}", exc_info=True)
        return units


class UnitCommanderRepository:
    """Repository managing core.organization_unit_commanders table active assignments."""

    def assign_commander(self, org_unit_id: str, commander_id: str) -> bool:
        deactivate_query = """
            UPDATE core.organization_unit_commanders
            SET is_active = FALSE
            WHERE org_unit_id = %s AND is_active = TRUE;
        """
        insert_query = """
            INSERT INTO core.organization_unit_commanders (org_unit_id, commander_id, is_active)
            VALUES (%s, %s, TRUE);
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(deactivate_query, (org_unit_id,))
                    cur.execute(insert_query, (org_unit_id, commander_id))
                    conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Error assigning commander {commander_id} to unit {org_unit_id}: {e}", exc_info=True)
        return False

    def remove_commander(self, org_unit_id: str) -> bool:
        query = """
            UPDATE core.organization_unit_commanders
            SET is_active = FALSE
            WHERE org_unit_id = %s AND is_active = TRUE;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id,))
                    rows_updated = cur.rowcount
                    conn.commit()
                    return rows_updated > 0
        except Exception as e:
            logger.error(f"Error removing commander from unit {org_unit_id}: {e}", exc_info=True)
        return False

    def get_current_commander(self, org_unit_id: str) -> Optional[str]:
        query = """
            SELECT commander_id
            FROM core.organization_unit_commanders
            WHERE org_unit_id = %s AND is_active = TRUE;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (org_unit_id,))
                    row = cur.fetchone()
                    if row:
                        return row[0]
        except Exception as e:
            logger.error(f"Error reading commander for unit {org_unit_id}: {e}", exc_info=True)
        return None
