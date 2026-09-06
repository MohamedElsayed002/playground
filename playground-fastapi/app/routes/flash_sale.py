from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.services.flash_sale import FlashSaleService
from app.models.flash_sale import FlashSale
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.flash_sale import CreateFlashSale, FlashSalePurchaseResponse, FlashSaleResponse,FlashSaleGetStatus

import uuid
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


@router.post(
        "/{flash_sale_id}/purchase",
        response_model=FlashSalePurchaseResponse,
        status_code=201,
)
async def redeem_sale(
        flash_sale_id: int,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user),
        idempotency_key: str | None = Header(
                None,
                description="Unique identifier for request idempotency."
        ) 
):
                service = FlashSaleService(db)
                idempotency_key = idempotency_key or str(uuid.uuid4())
                return await service.redeem_sale(flash_sale_id=flash_sale_id, user_id=user.id,idempotency_key=idempotency_key)



@router.get(
                "/{payment_id}/check-status",
                response_model=FlashSaleGetStatus,
                status_code=200
)
async def check_status(
        payment_id: str,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user),
):
        service = FlashSaleService(db)
        return await service.get_payment_status(payment_id)