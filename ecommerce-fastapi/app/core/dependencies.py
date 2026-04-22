"""
Reusable FastAPI dependencies - injected via Depends 

NestJS equivalent -> Guards + Interceptors + custom providers
FastAPI approach -> Functions decorated with Depends()

- get_db -> database session per request (like request-scoped provided)
- get_current_user -> auth guard (like AuthGuard('jwt'))
- require_admin -> role guard (like RolesGuard)
"""

from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status 
from fastapi.security import OAuth2PasswordBearer 
from jose import JWTError 
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import select 

from app.core.security import decode_token 
from app.db.session import AsyncSessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


oauth2_schema = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_schema),
    db: AsyncSession = Depends(get_db),):

    """
        Auth guard - extract and validates the JWT token, then load the user from DB

        Raises 401 if:
            - Token is missing / malformed 
            - Token is expired 
            - User no longer exists in DB 
    """

    from app.models.user import User 

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentails",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)

        # Guard: make sure it's an access token, not a refresh token
        if payload.get('type') != "access":
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
    except JWTError:
        raise credentials_exception
    
    # Load user from DB 
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactived"
        )
    
    return user 
    

async def get_current_active_user(
    current_user=Depends(get_current_user)
):
    """
        Alias for routes that just need 'any logged-in active user'
    """
    return current_user

async def require_admin(
    current_user=Depends(get_current_user)
):
    """
        Role guard - only allows users with role="admin"

        NestJS equivalent -> @Roles('admin') + RolesGuard 
    """

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user