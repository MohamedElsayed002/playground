from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.services.flash_sale import FlashSaleService
from app.models.flash_sale import FlashSale
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.flash_sale import CreateFlashSale, FlashSaleResponse
router = APIRouter(prefix="/flash-sale", tags=["Flash Sale"])


@router.post(
        "/",
        response_model=FlashSaleResponse,
        )
async def create_flash_sale(
        data: CreateFlashSale,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user),
):
        service = FlashSaleService(db)
        return await service.create_flash_sale(user_id=user.id, data=data)