from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select 
from fastapi import Request

from app.models.user import User 
from app.schemas.user  import UserCreate, TokenResponse 
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.exceptions.handlers import ConflictException, BadRequestException, NotFoundException
from jose import JWTError
from app.services.audit_service import create_audit_log

async def register_user(db: AsyncSession, data: UserCreate, request: Request | None = None) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))

    if existing.scalar_one_or_none():
        await create_audit_log(
            db=None,
            event="AUTH_REGISTER_FAILED",
            status="FAILED",
            request=request,
            metadata={"email": data.email, "reason": "email_exists"},
        )
        raise ConflictException("An account with this email already exists")

    # Check username uniqueness
    existing_username = await db.execute(select(User).where(User.username == data.username))

    if existing_username.scalar_one_or_none():
        await create_audit_log(
            db=None,
            event="AUTH_REGISTER_FAILED",
            status="FAILED",
            request=request,
            metadata={"email": data.email, "username": data.username, "reason": "username_exists"},
        )
        raise ConflictException("This username is already taken")
    
    user = User(
        email=data.email,
        username = data.username,
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone
    )

    db.add(user)
    await db.flush()
    await db.refresh(user)
    await create_audit_log(
        db=None,
        event="AUTH_REGISTER_SUCCESS",
        status="SUCCESS",
        user_id=user.id,
        request=request,
        metadata={"email": user.email, "username": user.username},
    )
    return user


async def login_user(db: AsyncSession, email: str, password: str, request: Request | None = None) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password,user.hashed_password):
        await create_audit_log(
            db=None,
            event="AUTH_LOGIN_FAILED",
            status="FAILED",
            request=request,
            metadata={"email": email, "reason": "invalid_credentials"},
        )
        raise BadRequestException("Invalid email or password")
    
    if not user.is_active:
        await create_audit_log(
            db=None,
            event="AUTH_LOGIN_FAILED",
            status="FAILED",
            user_id=user.id,
            request=request,
            metadata={"email": email, "reason": "account_deactivated"},
        )
        raise BadRequestException("Account is deactivated. Please contact support.")
    
    access_token = create_access_token(
        subject=user.id,
        extra_data={"role": user.role.value}
    )

    refresh_token = create_refresh_token(subject=user.id)
    await create_audit_log(
        db=None,
        event="AUTH_LOGIN_SUCCESS",
        status="SUCCESS",
        user_id=user.id,
        request=request,
        metadata={"email": user.email, "role": user.role.value},
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


async def refresh_access_token(
    db: AsyncSession,
    refresh_token: str,
    request: Request | None = None,
) -> TokenResponse:
    """
        Exchange a valid refresh token for a new access token 
        This is the standard OAuth2 refresh token flow
    """

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            await create_audit_log(
                db=None,
                event="AUTH_REFRESH_FAILED",
                status="FAILED",
                request=request,
                metadata={"reason": "invalid_token_type"},
            )
            raise BadRequestException("Invalid token type")
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        await create_audit_log(
            db=None,
            event="AUTH_REFRESH_FAILED",
            status="FAILED",
            request=request,
            metadata={"reason": "invalid_or_expired_refresh_token"},
        )
        raise BadRequestException("Invalid or expired refresh token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        await create_audit_log(
            db=None,
            event="AUTH_REFRESH_FAILED",
            status="FAILED",
            user_id=user_id,
            request=request,
            metadata={"reason": "user_not_found_or_inactive"},
        )
        raise NotFoundException("User")

    await create_audit_log(
        db=None,
        event="AUTH_REFRESH_SUCCESS",
        status="SUCCESS",
        user_id=user.id,
        request=request,
        metadata={"role": user.role.value},
    )
    
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id)
    )
