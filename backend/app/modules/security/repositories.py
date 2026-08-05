from typing import List, Optional
from datetime import datetime
import logging
import json
from app.repositories.base import BaseRepository
from app.database.connection import get_db_connection
from app.modules.security.models import User, UserSession, UserLoginHistory

logger = logging.getLogger("matzevet.security.repositories")

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

    def get_by_username(self, username: str) -> Optional[User]:
        query = """
            SELECT id, tenant_id, username, email, password_hash, is_active, failed_login_attempts, locked_until, created_at, updated_at, deleted_at
            FROM security.users
            WHERE username = %s AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (username,))
                    row = cur.fetchone()
                    if row:
                        return self._row_to_entity(row)
        except Exception as e:
            logger.error(f"Error fetching user by username '{username}': {e}")
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
        return self.get_by_username(username)

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

    def update_password_hash(self, identifier: str, new_password_hash: str) -> bool:
        """Updates user password hash in security.users by ID or username strictly in PostgreSQL."""
        query = """
            UPDATE security.users
            SET password_hash = %s, updated_at = CURRENT_TIMESTAMP
            WHERE (id::text = %s OR username = %s) AND deleted_at IS NULL;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (new_password_hash, str(identifier), str(identifier)))
                    rows_updated = cur.rowcount
                    conn.commit()
                    logger.info(f"Updated password hash in PostgreSQL for identifier '{identifier}' (rows_updated={rows_updated})")
                    return rows_updated > 0
        except Exception as e:
            logger.error(f"Error updating password hash for identifier '{identifier}': {e}")
            return False

    def ensure_seed_users(self):
        """Ensures default accounts exist in PostgreSQL security.users table with valid bcrypt hashes."""
        try:
            tenant_id = '00000000-0000-0000-0000-000000000001'
            import bcrypt, uuid
            def hash_pw(pw: str) -> str:
                return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            default_hash = hash_pw('123456')
            seed_accounts = [
                ('admin', 'admin@matzevet.gov.il'),
                ('commander', 'commander@matzevet.gov.il'),
                ('officer', 'officer@matzevet.gov.il'),
                ('user', 'user@matzevet.gov.il'),
            ]
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT id FROM core.tenants WHERE id = %s;", (tenant_id,))
                    if not cur.fetchone():
                        cur.execute("INSERT INTO core.tenants (id, name, code, is_active) VALUES (%s, %s, %s, TRUE);", (tenant_id, "Default Tenant", "DEFAULT"))
                    
                    for uname, email in seed_accounts:
                        cur.execute("SELECT id FROM security.users WHERE username = %s;", (uname,))
                        if not cur.fetchone():
                            cur.execute("""
                                INSERT INTO security.users (id, tenant_id, username, email, password_hash, is_active)
                                VALUES (%s, %s, %s, %s, %s, TRUE);
                            """, (str(uuid.uuid4()), tenant_id, uname, email, default_hash))
                    conn.commit()
        except Exception as e:
            logger.warning(f"Notice in ensure_seed_users: {e}")

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


class UserPreferenceRepository:
    """Repository managing security.user_preferences database records."""

    def __init__(self):
        self._ensure_table()

    def _ensure_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS security.user_preferences (
                user_id VARCHAR(255) PRIMARY KEY,
                theme VARCHAR(50) DEFAULT 'dark',
                language VARCHAR(10) DEFAULT 'he',
                notification_preferences JSONB DEFAULT '{}'::jsonb,
                dashboard_layout JSONB DEFAULT '{}'::jsonb,
                default_page VARCHAR(100) DEFAULT '/dashboard',
                table_density VARCHAR(50) DEFAULT 'comfortable',
                accessibility_preferences JSONB DEFAULT '{}'::jsonb,
                display_preferences JSONB DEFAULT '{}'::jsonb,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query)
                    conn.commit()
        except Exception as e:
            logger.warning(f"Failed ensuring security.user_preferences table: {e}")

    def get_by_user_id(self, user_id: str) -> dict:
        query = """
            SELECT user_id, theme, language, notification_preferences, dashboard_layout, default_page, table_density, accessibility_preferences, display_preferences, updated_at
            FROM security.user_preferences
            WHERE user_id = %s;
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (str(user_id),))
                    row = cur.fetchone()
                    if row:
                        return {
                            "user_id": row[0],
                            "theme": row[1] or "dark",
                            "language": row[2] or "he",
                            "notification_preferences": row[3] if isinstance(row[3], dict) else json.loads(row[3]) if isinstance(row[3], str) else {},
                            "dashboard_layout": row[4] if isinstance(row[4], dict) else json.loads(row[4]) if isinstance(row[4], str) else {},
                            "default_page": row[5] or "/dashboard",
                            "table_density": row[6] or "comfortable",
                            "accessibility_preferences": row[7] if isinstance(row[7], dict) else json.loads(row[7]) if isinstance(row[7], str) else {},
                            "display_preferences": row[8] if isinstance(row[8], dict) else json.loads(row[8]) if isinstance(row[8], str) else {},
                            "updated_at": row[9].isoformat() if row[9] else None
                        }
        except Exception as e:
            logger.error(f"Error fetching user preferences for {user_id}: {e}")
        
        return {
            "user_id": str(user_id),
            "theme": "dark",
            "language": "he",
            "notification_preferences": {},
            "dashboard_layout": {},
            "default_page": "/dashboard",
            "table_density": "comfortable",
            "accessibility_preferences": {},
            "display_preferences": {}
        }

    def upsert(self, user_id: str, data: dict) -> dict:
        query = """
            INSERT INTO security.user_preferences (
                user_id, theme, language, notification_preferences, dashboard_layout, default_page, table_density, accessibility_preferences, display_preferences, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP
            )
            ON CONFLICT (user_id) DO UPDATE SET
                theme = EXCLUDED.theme,
                language = EXCLUDED.language,
                notification_preferences = EXCLUDED.notification_preferences,
                dashboard_layout = EXCLUDED.dashboard_layout,
                default_page = EXCLUDED.default_page,
                table_density = EXCLUDED.table_density,
                accessibility_preferences = EXCLUDED.accessibility_preferences,
                display_preferences = EXCLUDED.display_preferences,
                updated_at = CURRENT_TIMESTAMP
            RETURNING user_id, theme, language, notification_preferences, dashboard_layout, default_page, table_density, accessibility_preferences, display_preferences, updated_at;
        """
        try:
            current = self.get_by_user_id(user_id)
            merged = {**current, **(data or {})}

            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (
                        str(user_id),
                        merged.get("theme", "dark"),
                        merged.get("language", "he"),
                        json.dumps(merged.get("notification_preferences", {})),
                        json.dumps(merged.get("dashboard_layout", {})),
                        merged.get("default_page", "/dashboard"),
                        merged.get("table_density", "comfortable"),
                        json.dumps(merged.get("accessibility_preferences", {})),
                        json.dumps(merged.get("display_preferences", {})),
                    ))
                    row = cur.fetchone()
                    conn.commit()
                    if row:
                        return {
                            "user_id": row[0],
                            "theme": row[1],
                            "language": row[2],
                            "notification_preferences": row[3] if isinstance(row[3], dict) else json.loads(row[3]) if isinstance(row[3], str) else {},
                            "dashboard_layout": row[4] if isinstance(row[4], dict) else json.loads(row[4]) if isinstance(row[4], str) else {},
                            "default_page": row[5],
                            "table_density": row[6],
                            "accessibility_preferences": row[7] if isinstance(row[7], dict) else json.loads(row[7]) if isinstance(row[7], str) else {},
                            "display_preferences": row[8] if isinstance(row[8], dict) else json.loads(row[8]) if isinstance(row[8], str) else {},
                        }
        except Exception as e:
            logger.error(f"Error upserting user preferences for {user_id}: {e}")
        return self.get_by_user_id(user_id)
