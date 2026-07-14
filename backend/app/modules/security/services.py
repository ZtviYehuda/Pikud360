import uuid
import bcrypt
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from app.modules.security.models import User, UserSession, UserLoginHistory
from app.modules.security.repositories import (
    UserRepository, 
    UserSessionRepository, 
    UserLoginHistoryRepository,
    TenantRepository,
    AuditLogRepository
)

logger = logging.getLogger("pikud360.security.services")

class SecurityService:
    """Authentication and session management controller layer."""

    def __init__(
        self,
        user_repo: UserRepository,
        session_repo: UserSessionRepository,
        login_history_repo: UserLoginHistoryRepository,
        tenant_repo: TenantRepository,
        audit_repo: AuditLogRepository
    ):
        self._user_repo = user_repo
        self._session_repo = session_repo
        self._login_history_repo = login_history_repo
        self._tenant_repo = tenant_repo
        self._audit_repo = audit_repo

    def hash_password(self, password: str) -> str:
        """Hashes plain text credentials using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Matches input password against saved hash."""
        if not hashed:
            return False
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception as e:
            logger.error(f"Error checking password hashing signature: {e}")
            return False

    def is_rate_limited(self, username: str, ip_address: str) -> bool:
        """Rate limit: blocks if more than 10 failed login attempts occurred in 15 minutes."""
        since = datetime.utcnow() - timedelta(minutes=15)
        failed_count = self._login_history_repo.count_failed_attempts(username, ip_address, since)
        return failed_count >= 10

    def resolve_tenant(self, tenant_code: str) -> Optional[dict]:
        """Resolves tenant ID and metadata from core catalogs."""
        return self._tenant_repo.get_by_code(tenant_code)

    def authenticate_user(
        self, 
        username: str, 
        password: str, 
        tenant_id: str
    ) -> Tuple[Optional[User], Optional[str]]:
        """
        Authenticates user profile.
        Returns (User object or None, Error message or None)
        """
        user = self._user_repo.get_by_username_and_tenant(username, tenant_id)
        if not user:
            user = self._user_repo.get_by_email_and_tenant(username, tenant_id)

        if not user:
            return None, "Invalid username or password"

        if not user.is_active:
            return None, "User account is deactivated"

        # Check account lockout
        if user.locked_until:
            # Ensure proper timezone aware comparison if DB has timezone
            locked_until = user.locked_until
            if locked_until.tzinfo is not None:
                now = datetime.now(locked_until.tzinfo)
            else:
                now = datetime.utcnow()

            if locked_until > now:
                return None, "Account is temporarily locked due to multiple failed attempts"
            else:
                # Lockout duration passed, reset counter
                self._user_repo.reset_failed_attempts(user.id)
                user.failed_login_attempts = 0
                user.locked_until = None

        if self.verify_password(password, user.password_hash):
            return user, None

        return None, "Invalid username or password"

    def create_session(
        self,
        user_id: str,
        refresh_token: str,
        expires_in_seconds: int,
        device_name: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> UserSession:
        """Registers a refresh session token in the database."""
        token_hash = self.hash_token(refresh_token)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)

        session = UserSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            refresh_token_hash=token_hash,
            device_name=device_name,
            ip_address=ip_address,
            expires_at=expires_at
        )
        return self._session_repo.create(session)

    def verify_refresh_token(self, refresh_token: str) -> Optional[UserSession]:
        """Loads and verifies a session token from the repository."""
        token_hash = self.hash_token(refresh_token)
        session = self._session_repo.get_by_token_hash(token_hash)
        
        if not session:
            return None

        # Check expiration
        expires_at = session.expires_at
        if expires_at and expires_at.tzinfo is not None:
            now = datetime.now(expires_at.tzinfo)
        else:
            now = datetime.utcnow()

        if expires_at and expires_at < now:
            logger.warning(f"Session token expired for user_id={session.user_id}")
            self.revoke_session(refresh_token)
            return None

        return session

    def revoke_session(self, refresh_token: str) -> bool:
        """Sets revoked timestamp on target session."""
        token_hash = self.hash_token(refresh_token)
        return self._session_repo.revoke(token_hash)

    def log_login_attempt(
        self,
        user_id: Optional[str],
        tenant_id: Optional[str],
        session_id: Optional[str],
        ip_address: str,
        user_agent: str,
        is_successful: bool,
        failure_reason: Optional[str] = None,
        login_method: str = "PASSWORD"
    ) -> UserLoginHistory:
        """Records sign-in audits in core logs."""
        target_user = user_id or "00000000-0000-0000-0000-000000000000"
        
        history = UserLoginHistory(
            id=str(uuid.uuid4()),
            user_id=target_user,
            tenant_id=tenant_id,
            session_id=session_id,
            login_method=login_method,
            ip_address=ip_address,
            device_information=None,
            user_agent=user_agent,
            is_successful=is_successful,
            failure_reason=failure_reason
        )
        return self._login_history_repo.create(history)

    def create_audit_log(
        self,
        tenant_id: str,
        user_id: Optional[str],
        session_id: Optional[str],
        request_id: str,
        event_type: str,
        action: str,
        table_name: str,
        record_id: str,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: str = "",
        user_agent: str = "",
        severity: str = "INFO"
    ) -> bool:
        """Saves a structured system action event to the partitioning audit logs."""
        log_entry = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "user_id": user_id,
            "session_id": session_id,
            "request_id": str(request_id),
            "event_type": event_type,
            "action": action,
            "table_name": table_name,
            "record_id": record_id,
            "old_values": old_values,
            "new_values": new_values,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "severity": severity
        }
        return self._audit_repo.create(log_entry)

    def hash_token(self, token: str) -> str:
        """Returns standard SHA256 hashed signature of token."""
        return hashlib.sha256(token.encode('utf-8')).hexdigest()

    # User Lockout Wrappers
    def increment_failed_attempts(self, user: User) -> int:
        count = self._user_repo.increment_failed_attempts(user.id)
        if count >= 5:
            # Lockout account for 15 minutes
            lock_until = datetime.utcnow() + timedelta(minutes=15)
            self._user_repo.lock_account(user.id, lock_until)
            logger.warning(f"User account locked: user_id={user.id} until={lock_until}")
        return count

    def reset_failed_attempts(self, user_id: str) -> bool:
        return self._user_repo.reset_failed_attempts(user_id)
