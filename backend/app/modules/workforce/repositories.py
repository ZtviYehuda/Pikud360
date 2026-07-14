import json
import uuid
import logging
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db_connection
from app.modules.workforce.models import Employee, EmployeeHistory
from app.modules.workforce.encryption import encrypt_value, decrypt_value, generate_blind_index

logger = logging.getLogger("pikud360.modules.workforce.repositories")

class EmployeeRepository:
    """Repository handling database operations for the workforce.employees table under RLS policies."""

    def _row_to_entity(self, row) -> Employee:
        # Decrypt encrypted PII columns on read
        phone_val = decrypt_value(row[7], row[8], row[9])
        email_val = decrypt_value(row[11], row[12], row[13])
        birthdate_val = decrypt_value(row[15], row[16], row[17]) or ""

        # Resolving tenant_id context safely checking active request contexts
        import flask
        tenant_id = "00000000-0000-0000-0000-000000000000"
        if flask.has_app_context() and flask.has_request_context():
            tenant_id = getattr(flask.g, "current_tenant_id", tenant_id) or tenant_id


        return Employee(
            id=row[0],
            tenant_id=tenant_id,
            user_id=row[1],
            commander_id=row[2],
            org_unit_id=row[3],
            employee_number=row[4],
            first_name=row[5],
            last_name=row[6],
            phone=phone_val,
            phone_blind_index=row[10],
            personal_email=email_val,
            email_blind_index=row[14],
            birthdate=birthdate_val,
            rank=row[18],
            position=row[19],
            service_type=row[20],
            status=row[21],
            created_at=row[22],
            updated_at=row[23],
            deleted_at=row[24],
            created_by=row[25],
            updated_by=row[26]
        )

    def get_by_id(self, employee_id: str) -> Optional[Employee]:
        query = """
            SELECT id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                   phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                   email_ciphertext, email_nonce, email_tag, email_blind_index,
                   birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                   rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by
            FROM workforce.employees
            WHERE id = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (employee_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching employee {employee_id}: {e}", exc_info=True)
        return None

    def get_by_user_id(self, user_id: str) -> Optional[Employee]:
        query = """
            SELECT id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                   phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                   email_ciphertext, email_nonce, email_tag, email_blind_index,
                   birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                   rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by
            FROM workforce.employees
            WHERE user_id = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (user_id,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching employee by user {user_id}: {e}", exc_info=True)
        return None


    def list_all(self) -> List[Employee]:
        query = """
            SELECT id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                   phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                   email_ciphertext, email_nonce, email_tag, email_blind_index,
                   birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                   rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by
            FROM workforce.employees
            WHERE deleted_at IS NULL;
        """
        employees = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    for row in cur.fetchall():
                        employees.append(self._row_to_entity(row))
        except Exception as e:
            logger.error(f"Error listing employees: {e}", exc_info=True)
        return employees

    def create(self, emp: Employee, created_by_user_id: Optional[str] = None) -> Employee:
        # Encrypt PII columns before inserting
        phone_cipher, phone_nonce, phone_tag = encrypt_value(emp.phone)
        email_cipher, email_nonce, email_tag = encrypt_value(emp.personal_email)
        bd_cipher, bd_nonce, bd_tag = encrypt_value(emp.birthdate)

        phone_hash = generate_blind_index(emp.phone)
        email_hash = generate_blind_index(emp.personal_email)

        query = """
            INSERT INTO workforce.employees (
                id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name,
                phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                email_ciphertext, email_nonce, email_tag, email_blind_index,
                birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                rank, position, service_type, status, created_by, updated_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            ) RETURNING id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                      phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                      email_ciphertext, email_nonce, email_tag, email_blind_index,
                      birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                      rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by;
        """

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        emp.id, emp.user_id, emp.commander_id, emp.org_unit_id, emp.employee_number,
                        emp.first_name, emp.last_name,
                        phone_cipher, phone_nonce, phone_tag, phone_hash,
                        email_cipher, email_nonce, email_tag, email_hash,
                        bd_cipher, bd_nonce, bd_tag,
                        emp.rank, emp.position, emp.service_type, emp.status,
                        created_by_user_id, created_by_user_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to create employee record.")

    def update(self, employee_id: str, emp: Employee, updated_by_user_id: Optional[str] = None) -> Optional[Employee]:
        # Encrypt updated PII values
        phone_cipher, phone_nonce, phone_tag = encrypt_value(emp.phone)
        email_cipher, email_nonce, email_tag = encrypt_value(emp.personal_email)
        bd_cipher, bd_nonce, bd_tag = encrypt_value(emp.birthdate)

        phone_hash = generate_blind_index(emp.phone)
        email_hash = generate_blind_index(emp.personal_email)

        query = """
            UPDATE workforce.employees
            SET user_id = %s, commander_id = %s, org_unit_id = %s, employee_number = %s, 
                first_name = %s, last_name = %s,
                phone_ciphertext = %s, phone_nonce = %s, phone_tag = %s, phone_blind_index = %s,
                email_ciphertext = %s, email_nonce = %s, email_tag = %s, email_blind_index = %s,
                birthdate_ciphertext = %s, birthdate_nonce = %s, birthdate_tag = %s,
                rank = %s, position = %s, service_type = %s, status = %s, 
                updated_at = CURRENT_TIMESTAMP, updated_by = %s
            WHERE id = %s AND deleted_at IS NULL
            RETURNING id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                      phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                      email_ciphertext, email_nonce, email_tag, email_blind_index,
                      birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                      rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by;
        """

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        emp.user_id, emp.commander_id, emp.org_unit_id, emp.employee_number,
                        emp.first_name, emp.last_name,
                        phone_cipher, phone_nonce, phone_tag, phone_hash,
                        email_cipher, email_nonce, email_tag, email_hash,
                        bd_cipher, bd_nonce, bd_tag,
                        emp.rank, emp.position, emp.service_type, emp.status,
                        updated_by_user_id, employee_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        return None

    def delete(self, employee_id: str, deleted_by_user_id: Optional[str] = None) -> bool:
        query = """
            UPDATE workforce.employees
            SET deleted_at = CURRENT_TIMESTAMP, status = 'INACTIVE', updated_by = %s
            WHERE id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (deleted_by_user_id, employee_id))
                rows_updated = cur.rowcount
                conn.commit()
                return rows_updated > 0

    def search_by_email_hash(self, email_hash: str) -> Optional[Employee]:
        query = """
            SELECT id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                   phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                   email_ciphertext, email_nonce, email_tag, email_blind_index,
                   birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                   rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by
            FROM workforce.employees
            WHERE email_blind_index = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (email_hash,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error searching by email blind index: {e}", exc_info=True)
        return None

    def search_by_phone_hash(self, phone_hash: str) -> Optional[Employee]:
        query = """
            SELECT id, user_id, commander_id, org_unit_id, employee_number, first_name, last_name, 
                   phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                   email_ciphertext, email_nonce, email_tag, email_blind_index,
                   birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                   rank, position, service_type, status, created_at, updated_at, deleted_at, created_by, updated_by
            FROM workforce.employees
            WHERE phone_blind_index = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (phone_hash,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error searching by phone blind index: {e}", exc_info=True)
        return None


class EmployeeHistoryRepository:
    """Repository recording immutable event history snapshots to workforce.employee_history."""

    def create(self, history: EmployeeHistory) -> EmployeeHistory:
        query = """
            INSERT INTO workforce.employee_history (
                id, employee_id, change_type, org_unit_id, commander_id, 
                rank, position, service_type, status, snapshot_json, recorded_by
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            ) RETURNING id, employee_id, change_type, org_unit_id, commander_id, 
                      rank, position, service_type, status, snapshot_json, effective_from, recorded_by, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        history.id,
                        history.employee_id,
                        history.change_type,
                        history.org_unit_id,
                        history.commander_id,
                        history.rank,
                        history.position,
                        history.service_type,
                        history.status,
                        json.dumps(history.snapshot_json),
                        history.recorded_by
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return EmployeeHistory(
                        id=row[0],
                        employee_id=row[1],
                        change_type=row[2],
                        org_unit_id=row[3],
                        commander_id=row[4],
                        rank=row[5],
                        position=row[6],
                        service_type=row[7],
                        status=row[8],
                        snapshot_json=row[9] if isinstance(row[9], dict) else json.loads(row[9]),
                        effective_from=row[10],
                        recorded_by=row[11],
                        created_at=row[12]
                    )
        raise RuntimeError("Failed to create employee history snapshot.")
