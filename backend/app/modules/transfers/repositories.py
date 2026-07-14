import logging
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db_connection
from app.modules.transfers.models import EmployeeTransfer

logger = logging.getLogger("pikud360.modules.transfers.repositories")

class TransferRepository:
    """Repository mapping data operations for workforce.employee_transfers table."""

    def _row_to_entity(self, row) -> EmployeeTransfer:
        return EmployeeTransfer(
            id=row[0],
            tenant_id=row[1],
            employee_id=row[2],
            from_unit_id=row[3],
            to_unit_id=row[4],
            requested_by=row[5],
            approved_by=row[6],
            reason=row[7],
            status=row[8],
            requested_at=row[9],
            approved_at=row[10],
            completed_at=row[11]
        )

    def get_by_id(self, transfer_id: str) -> Optional[EmployeeTransfer]:
        query = """
            SELECT id, tenant_id, employee_id, from_unit_id, to_unit_id, requested_by, approved_by, reason, status, requested_at, approved_at, completed_at
            FROM workforce.employee_transfers
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (transfer_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching transfer request {transfer_id}: {e}", exc_info=True)
        return None

    def has_pending_transfer(self, employee_id: str) -> bool:
        query = """
            SELECT COUNT(*) FROM workforce.employee_transfers
            WHERE employee_id = %s AND status = 'PENDING';
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (employee_id,))
                    row = cur.fetchone()
                    return row and row[0] > 0
        except Exception as e:
            logger.error(f"Error checking pending transfers for employee {employee_id}: {e}", exc_info=True)
        return False

    def create(self, transfer: EmployeeTransfer) -> EmployeeTransfer:
        query = """
            INSERT INTO workforce.employee_transfers (
                id, tenant_id, employee_id, from_unit_id, to_unit_id, requested_by, reason, status, requested_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, tenant_id, employee_id, from_unit_id, to_unit_id, requested_by, approved_by, reason, status, requested_at, approved_at, completed_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        transfer.id, transfer.tenant_id, transfer.employee_id, transfer.from_unit_id,
                        transfer.to_unit_id, transfer.requested_by, transfer.reason, transfer.status,
                        transfer.requested_at
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to create transfer request.")

    def update_status(
        self,
        transfer_id: str,
        status: str,
        approved_by: Optional[str] = None,
        approved_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None
    ) -> bool:
        query = """
            UPDATE workforce.employee_transfers
            SET status = %s, approved_by = %s, approved_at = %s, completed_at = %s
            WHERE id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (status, approved_by, approved_at, completed_at, transfer_id))
                    conn.commit()
                    return cur.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating transfer status {transfer_id}: {e}", exc_info=True)
        return False

    def list_by_tenant(self, tenant_id: str) -> List[EmployeeTransfer]:
        query = """
            SELECT id, tenant_id, employee_id, from_unit_id, to_unit_id, requested_by, approved_by, reason, status, requested_at, approved_at, completed_at
            FROM workforce.employee_transfers
            WHERE tenant_id = %s
            ORDER BY requested_at DESC;
        """
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                    for r in rows:
                        results.append(self._row_to_entity(r))
        except Exception as e:
            logger.error(f"Error listing transfers for tenant {tenant_id}: {e}", exc_info=True)
        return results

    def list_by_units(self, tenant_id: str, unit_ids: List[str]) -> List[EmployeeTransfer]:
        if not unit_ids:
            return []
        query = """
            SELECT id, tenant_id, employee_id, from_unit_id, to_unit_id, requested_by, approved_by, reason, status, requested_at, approved_at, completed_at
            FROM workforce.employee_transfers
            WHERE tenant_id = %s AND (from_unit_id = ANY(%s) OR to_unit_id = ANY(%s))
            ORDER BY requested_at DESC;
        """
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (tenant_id, unit_ids, unit_ids))
                    rows = cur.fetchall()
                    for r in rows:
                        results.append(self._row_to_entity(r))
        except Exception as e:
            logger.error(f"Error listing scoped transfers: {e}", exc_info=True)
        return results
