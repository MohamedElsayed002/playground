import math 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import Request

from app.models.user import User 
from app.schemas.user import UserUpdate, PasswordChange
from app.core.security import verify_password, hash_password
from app.exceptions.handlers import NotFoundException, BadRequestException
from app.services.audit_service import create_audit_log

async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User", user_id)
    return user

async def list_users(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20
) -> dict:
    offset = (page - 1) * page_size

    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()

    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )

    users = list(result.scalars().all())

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    }


async def update_user_profile(
        db: AsyncSession,
        user: User,
        data: UserUpdate,
        request: Request | None = None,
) -> User:
    """
        Update a user's own profile. Uses model_dump(exclude_unset=True) for PATCH semantics
    """
    # exclude_unset=True -> Only update fields the client actually sent
    # This is what makes it a true PATCH (not a full PUT replacement)
    changed_fields = list(data.model_dump(exclude_unset=True).keys())

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user,field,value)
    await db.flush()
    await db.refresh(user)
    if changed_fields:
        await create_audit_log(
            db=None,
            event="USER_PROFILE_UPDATED",
            status="SUCCESS",
            user_id=user.id,
            request=request,
            metadata={"changed_fields": changed_fields},
        )
    return user

async def change_password(
        db: AsyncSession,
        user: User,
        data: PasswordChange,
        request: Request | None = None,
) -> None:
    if not verify_password(data.current_password, user.hashed_password):
        await create_audit_log(
            db=None,
            event="USER_PASSWORD_CHANGE_FAILED",
            status="FAILED",
            user_id=user.id,
            request=request,
            metadata={"reason": "incorrect_current_password"},
        )
        raise BadRequestException("Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    await db.flush()
    await create_audit_log(
        db=None,
        event="USER_PASSWORD_CHANGED",
        status="SUCCESS",
        user_id=user.id,
        request=request,
        metadata={},
    )


async def update_avatar(
    db: AsyncSession,
    user: User,
    avatar_url: str,
    request: Request | None = None,
) -> User:
    user.avatar_url = avatar_url 
    await db.flush()
    await db.refresh(user)
    await create_audit_log(
        db=None,
        event="USER_AVATAR_UPDATED",
        status="SUCCESS",
        user_id=user.id,
        request=request,
        metadata={"avatar_url": avatar_url},
    )
    return user

async def deactivate_user(
    db: AsyncSession,
    user_id: int,
    actor_user_id: int | None = None,
    request: Request | None = None,
) -> None:
    user = await get_user_by_id(db,user_id)
    user.is_active = False 
    await db.flush()
    await create_audit_log(
        db=None,
        event="USER_DEACTIVATED",
        status="SUCCESS",
        user_id=actor_user_id,
        request=request,
        metadata={"target_user_id": user.id, "target_email": user.email},
    )
