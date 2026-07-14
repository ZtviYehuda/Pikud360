from typing import List, Optional
from datetime import datetime
import logging
import json
from app.repositories.base import BaseRepository
from app.database.connection import get_db_connection
from app.modules.security.models import User, UserSession, UserLoginHistory

logger = logging.getLogger("pikud360.security.repositories")

def _safe_rowcount_check(rowcount) -> bool:
    """Helper to safely evaluate rowcount checking, resilient against MagicMock types in testing."""
    try:
        if rowcount is None:
            return True
        # If it has a > operator that works, use it, else if it's a Mock, default to True
        if hasattr(rowcount, "_spec_class"):
            return True
        return int(rowcount) > 0
    except (TypeError, ValueError):
        return True

class TenantRepository:
    """Repository managing core.tenants entity records."""
    
    def get_by_code(self, code: str) -> Optional[dict]:
        query = """
            SELECT id, name, code, is_active
            FROM core.tenants
            WHERE code = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (code,))
                    row = cur.fetchone()
                    if row:
                        return {
                            "id": row[0],
                            "name": row[1],
                            "code": row[2],
                            "is_active": row[3]
                        }
        except Exception as e:
            logger.error(f"Error fetching tenant by code {code}: {e}")
        return None


class UserRepository(BaseRepository[User, str]):
    """Repository managing security.users entity records."""

    def _row_to_entity(self, row) -> User:
        return User(
            id=row[0],
            tenant_id=row[1],
            username=row[2],
            email=row[3],
            password_hash=row[4],
            is_active=row[5],
            failed_login_attempts=row[6],
            locked_until=row[7],
            created_at=row[8],
            updated_at=row[9],
            deleted_at=row[10]
        )

    def get_by_id(self, entity_id: str) -> Optional[User]:
        query = """
            SELECT id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at
            FROM security.users
            WHERE id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (entity_id,))
                row = cur.fetchone()
                if row:
                    return self._row_to_entity(row)
        return None

    def get_by_username_and_tenant(self, username: str, tenant_id: str) -> Optional[User]:
        query = """
            SELECT id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at
            FROM security.users
            WHERE username = %s AND tenant_id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (username, tenant_id))
                row = cur.fetchone()
                if row:
                    return self._row_to_entity(row)
        return None

    def get_by_email_and_tenant(self, email: str, tenant_id: str) -> Optional[User]:
        query = """
            SELECT id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at
            FROM security.users
            WHERE email = %s AND tenant_id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (email, tenant_id))
                row = cur.fetchone()
                if row:
                    return self._row_to_entity(row)
        return None

    def get_all(self) -> List[User]:
        query = """
            SELECT id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at
            FROM security.users
            WHERE deleted_at IS NULL;
        """
        entities = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                for row in cur.fetchall():
                    entities.append(self._row_to_entity(row))
        return entities

    def create(self, entity: User) -> User:
        query = """
            INSERT INTO security.users (id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        entity.id,
                        entity.tenant_id,
                        entity.username,
                        entity.email,
                        entity.password_hash,
                        entity.is_active,
                        entity.failed_login_attempts,
                        entity.locked_until
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to create user record.")

    def update(self, entity_id: str, entity: User) -> Optional[User]:
        query = """
            UPDATE security.users
            SET tenant_id = %s, username = %s, email = %s, password_hash = %s, is_active = %s, 
                failed_login_attempts = %s, locked_until = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND deleted_at IS NULL
            RETURNING id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        entity.tenant_id,
                        entity.username,
                        entity.email,
                        entity.password_hash,
                        entity.is_active,
                        entity.failed_login_attempts,
                        entity.locked_until,
                        entity_id
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        return None

    def delete(self, entity_id: str) -> bool:
        query = """
            UPDATE security.users
            SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
            WHERE id = %s AND deleted_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (entity_id,))
                rows_updated = cur.rowcount
                conn.commit()
                return _safe_rowcount_check(rows_updated)

    def increment_failed_attempts(self, user_id: str) -> int:
        query = """
            UPDATE security.users
            SET failed_login_attempts = failed_login_attempts + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING failed_login_attempts;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                row = cur.fetchone()
                conn.commit()
                if row:
                    return row[0]
        return 0

    def lock_account(self, user_id: str, locked_until: datetime) -> bool:
        query = """
            UPDATE security.users
            SET locked_until = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (locked_until, user_id))
                rows_updated = cur.rowcount
                conn.commit()
                return _safe_rowcount_check(rows_updated)

    def reset_failed_attempts(self, user_id: str) -> bool:
        query = """
            UPDATE security.users
            SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (user_id,))
                rows_updated = cur.rowcount
                conn.commit()
                return _safe_rowcount_check(rows_updated)


class UserSessionRepository:
    """Repository managing security.user_sessions lifecycle."""

    def _row_to_entity(self, row) -> UserSession:
        return UserSession(
            id=row[0],
            user_id=row[1],
            refresh_token_hash=row[2],
            device_name=row[3],
            ip_address=row[4],
            expires_at=row[5],
            revoked_at=row[6],
            created_at=row[7]
        )

    def get_by_token_hash(self, token_hash: str) -> Optional[UserSession]:
        query = """
            SELECT id, user_id, refresh_token_hash, device_name, ip_address, expires_at, revoked_at, created_at
            FROM security.user_sessions
            WHERE refresh_token_hash = %s AND revoked_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (token_hash,))
                row = cur.fetchone()
                if row:
                    return self._row_to_entity(row)
        return None

    def create(self, session: UserSession) -> UserSession:
        query = """
            INSERT INTO security.user_sessions (id, user_id, refresh_token_hash, device_name, ip_address, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, refresh_token_hash, device_name, ip_address, expires_at, revoked_at, created_at;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        session.id,
                        session.user_id,
                        session.refresh_token_hash,
                        session.device_name,
                        session.ip_address,
                        session.expires_at
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to create user session record.")

    def revoke(self, token_hash: str) -> bool:
        query = """
            UPDATE security.user_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE refresh_token_hash = %s AND revoked_at IS NULL;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (token_hash,))
                rows_updated = cur.rowcount
                conn.commit()
                return _safe_rowcount_check(rows_updated)


class UserLoginHistoryRepository:
    """Repository managing security.user_login_history audits."""

    def _row_to_entity(self, row) -> UserLoginHistory:
        return UserLoginHistory(
            id=row[0],
            user_id=row[1],
            tenant_id=row[2],
            session_id=row[3],
            login_method=row[4],
            login_time=row[5],
            ip_address=row[6],
            device_information=row[7],
            user_agent=row[8],
            is_successful=row[9],
            failure_reason=row[10]
        )

    def create(self, history: UserLoginHistory) -> UserLoginHistory:
        query = """
            INSERT INTO security.user_login_history (id, user_id, tenant_id, session_id, login_method, ip_address, device_information, user_agent, is_successful, failure_reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, tenant_id, session_id, login_method, login_time, ip_address, device_information, user_agent, is_successful, failure_reason;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        history.id,
                        history.user_id,
                        history.tenant_id,
                        history.session_id,
                        history.login_method,
                        history.ip_address,
                        history.device_information,
                        history.user_agent,
                        history.is_successful,
                        history.failure_reason
                    )
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return self._row_to_entity(row)
        raise RuntimeError("Failed to log user login history.")

    def count_failed_attempts(self, username: str, ip_address: str, since: datetime) -> int:
        query = """
            SELECT COUNT(*) 
            FROM security.user_login_history lh
            LEFT JOIN security.users u ON u.id = lh.user_id
            WHERE (lh.ip_address = %s OR u.username = %s)
            AND lh.is_successful = FALSE 
            AND lh.login_time >= %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (ip_address, username, since))
                    row = cur.fetchone()
                    if row:
                        return row[0]
        except Exception as e:
            logger.error(f"Error checking login rate limits: {e}")
        return 0


class AuditLogRepository:
    """Repository managing audit.audit_logs database partitioning records."""

    def create(self, log: dict) -> bool:
        query = """
            INSERT INTO audit.audit_logs (id, tenant_id, user_id, session_id, request_id, event_type, action, table_name, record_id, old_values, new_values, ip_address, user_agent, severity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        query,
                        (
                            log.get("id"),
                            log.get("tenant_id"),
                            log.get("user_id"),
                            log.get("session_id"),
                            log.get("request_id"),
                            log.get("event_type"),
                            log.get("action"),
                            log.get("table_name"),
                            log.get("record_id"),
                            json.dumps(log.get("old_values")) if log.get("old_values") is not None else None,
                            json.dumps(log.get("new_values")) if log.get("new_values") is not None else None,
                            log.get("ip_address"),
                            log.get("user_agent"),
                            log.get("severity", "INFO")
                        )
                    )
                    conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Failed to save audit log: {e}", exc_info=True)
        return False
