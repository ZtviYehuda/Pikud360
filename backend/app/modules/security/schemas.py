from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=4)
    tenant_code: str = Field(..., min_length=2, max_length=50)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    tenant_id: str
    is_active: bool

    class Config:
        from_attributes = True
