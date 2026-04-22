from datetime import datetime, timedelta, timezone 
from typing import Any 

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(plain_password: str) -> str:
    """
        Hash a plain-text password. Store this hash in the DB, never the plain text.
    """
    password_bytes = plain_password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
        Compare a plain password against a stored hash. Returns True if the match
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )

def create_access_token(subject: str | Any, extra_data: dict = {}) -> str:
    """
        Create a short-lived access token.
        `subject` is typically the user's UUID or ID (the 'sub' claim in JWT spec)
    """

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
        **extra_data
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def create_refresh_token(subject: str | Any) -> str:
    """
        Create a long-lived refresh token.
        Used to get a new access token without re-logging in
    """

    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )

    payload = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh"
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str) -> dict: 
    """
    Decode and validate a JWT token 
    Raises JWTError if the toekn is invalid or expired 
    The router's dependency (get_current_user) catches this and returns 401
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM]
    )