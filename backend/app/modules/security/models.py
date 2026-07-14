from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class User:
    id: str
    tenant_id: str
    username: str
    email: str
    password_hash: Optional[str]
    is_active: bool = True
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

@dataclass
class UserSession:
    id: str
    user_id: str
    refresh_token_hash: str
    device_name: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

@dataclass
class UserLoginHistory:
    id: str
    user_id: str
    tenant_id: Optional[str] = None
    session_id: Optional[str] = None
    login_method: str = "PASSWORD" # PASSWORD, WEBAUTHN
    login_time: Optional[datetime] = None
    ip_address: str = ""
    device_information: Optional[str] = None
    user_agent: str = ""
    is_successful: bool = False
    failure_reason: Optional[str] = None
