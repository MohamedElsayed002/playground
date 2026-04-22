from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select 

from app.models.user import User 
from app.schemas.user  import UserCreate, TokenResponse 
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.exceptions.handlers import ConflictException, BadRequestException, NotFoundException
from jose import JWTError

async def register_user(db: AsyncSession, data: UserCreate) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))

    if existing.scalar_one_or_none():
        raise ConflictException("An account with this email already exists")

    # Check username uniqueness
    existing_username = await db.execute(select(User).where(User.username == data.username))

    if existing_username.scalar_one_or_none():
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
    return user


async def login_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password,user.hashed_password):
        raise BadRequestException("Invalid email or password")
    
    if not user.is_active:
        raise BadRequestException("Account is deactivated. Please contact support.")
    
    access_token = create_access_token(
        subject=user.id,
        extra_data={"role": user.role.value}
    )

    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """
        Exchange a valid refresh token for a new access token 
        This is the standard OAuth2 refresh token flow
    """

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise BadRequestException("Invalid token type")
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise BadRequestException("Invalid or expired refresh token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise NotFoundException("User")
    
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id)
    )