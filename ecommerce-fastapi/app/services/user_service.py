import math 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User 
from app.schemas.user import UserUpdate, PasswordChange
from app.core.security import verify_password, hash_password
from app.exceptions.handlers import NotFoundException, BadRequestException

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
        data: UserUpdate
) -> User:
    """
        Update a user's own profile. Uses model_dump(exclude_unset=True) for PATCH semantics
    """
    # exclude_unset=True -> Only update fields the client actually sent
    # This is what makes it a true PATCH (not a full PUT replacement)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user,field,value)
    await db.flush()
    await db.refresh(user)
    return user

async def change_password(
        db: AsyncSession,
        user: User,
        data: PasswordChange
) -> None:
    if not verify_password(data.current_password, user.hashed_password):
        raise BadRequestException("Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    await db.flush()


async def update_avatar(db: AsyncSession, user: User, avatar_url: str) -> User:
    user.avatar_url = avatar_url 
    await db.flush()
    await db.refresh(user)
    return user

async def deactivate_user(db: AsyncSession, user_id: int) -> None:
    user = await get_user_by_id(db,user_id)
    user.is_active = False 
    await db.flush()
