"""

Pydantic schemas for users and authentication 

NestJS equivalent -> CreateUserDto, LoginDto, UserResponseDto

KEY PATTERN: Separate schemas for different operations
    - UserCreate -> What the client sends to register
    - UserUpdate -> What the client sends to update profile 
    - UserResponse -> What we send back

This is the same as having separate Request/Response DTOs in NestJS
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re 

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    """
        Response after successful login
    """
    access_token: str 
    refresh_token: str 
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str


# User Schemas

class UserCreate(BaseModel):
    """
        Registration request body.
        Pydantic validates types and constraints automatically 
        NestJS equivalent -> CreateUserDto with class-validator decorators
    """

    email: EmailStr 
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8,max_length=128)
    first_name: str | None = Field(None,max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = None

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls,v:str) -> str:
        """
            Custom validator - usernames can only contain letters, numbers, underscores
        """
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce basic password strength."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v
    

class UserUpdate(BaseModel):
    """
        PATCH /user/me - partial update (all fields optional)
    """
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = None


class PasswordChange(BaseModel):
    """
        POST /user/me/change-password
    """

    current_password: str 
    new_password: str = Field(min_length=8)

class UserResponse(BaseModel):
    """
        What we return to the client no password

        model_config with from_attributes=True allows Pydantic to read from 
        SQLAlchemy model instances directly (like @Exclude() in NestJS serialization) 
    """
    id: int 
    email: str 
    username: str 
    first_name: str | None
    last_name: str | None
    phone: str | None
    avatar_url: str | None
    role: str 
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True} # Read from SQLAlchemy ORM objects


class UserAdminResponse(UserResponse):
    """
        Extended user info from admin endpoints - includes all fields
    """
    updated_at: datetime