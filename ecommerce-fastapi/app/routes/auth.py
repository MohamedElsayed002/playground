from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.schemas.user import UserCreate, UserResponse, TokenResponse
from app.schemas.user import RefreshTokenRequest 
from app.services import auth_service

router = APIRouter(prefix="/auth",tags=["Authentication"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
        Register a new user. Returns the created user profile (no password).        
    """
    user = await auth_service.register_user(db,data)
    return user


@router.post('/login', response_model=TokenResponse, summary="Login and get JWT tokens")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
        Login using email/password
        Returns JWT access + refresh tokens on success
    """
    token = await auth_service.login_user(db, form_data.username, form_data.password)
    return token


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_me(
    current_user=Depends(get_current_user),
):
    """
    Returns the logged-in user's profile.
    Depends(get_current_user) acts as the auth guard — returns 401 if no valid token.
    """
    return current_user
