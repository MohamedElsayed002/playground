
from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_admin
from app.schemas.user import UserResponse, UserAdminResponse, UserUpdate, PasswordChange
from app.schemas.common import PaginatedResponse
from app.schemas.file import FileUploadResponse
from app.services import user_service, file_service

router = APIRouter(prefix="/users", tags=["Users"])


# ── Own Profile ───────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user=Depends(get_current_user)):
    """Get the logged-in user's own profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    data: UserUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update own profile (partial update — only send fields you want to change).
    
    NestJS equivalent:
        @Patch('me')
        @UseGuards(JwtAuthGuard)
        async updateProfile(@Body() dto: UpdateUserDto, @CurrentUser() user: User) { ... }
    """
    return await user_service.update_user_profile(db, current_user, data)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: PasswordChange,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change own password. Requires the current password for verification."""
    await user_service.change_password(db, current_user, data)


@router.post("/me/avatar", response_model=FileUploadResponse)
async def upload_avatar(
    file: UploadFile = File(..., description="Profile image (JPEG, PNG, WebP)"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a profile avatar image.
    
    FastAPI UploadFile = NestJS's FileInterceptor('file').
    We validate type and size in the service.
    """
    result = await file_service.upload_image(file, subfolder="avatars")
    # Save the URL to the user's profile
    await user_service.update_avatar(db, current_user, result.url)
    return result


# ── Admin Routes ──────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=PaginatedResponse[UserAdminResponse],
    dependencies=[Depends(require_admin)],  # Inline guard — cleaner than per-param Depends
)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """[Admin] List all users with pagination."""
    return await user_service.list_users(db, page=page, page_size=page_size)


@router.get(
    "/{user_id}",
    response_model=UserAdminResponse,
    dependencies=[Depends(require_admin)],
)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """[Admin] Get any user's full profile by ID."""
    return await user_service.get_user_by_id(db, user_id)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def deactivate_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """[Admin] Soft-deactivate a user account."""
    await user_service.deactivate_user(db, user_id)
