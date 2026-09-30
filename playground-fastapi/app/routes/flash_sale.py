from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_db
from app.services.flash_sale import FlashSaleService
from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.flash_sale import CreateFlashSale, FlashSalePurchaseResponse, FlashSaleResponse,FlashSaleGetStatus

import stripe
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


@router.post(
        "/stripe/webhook",
        include_in_schema=False,
)
async def stripe_webhook(
        request: Request,
        db: AsyncSession = Depends(get_db),
):
        payload = await request.body()
        signature = request.headers.get("stripe-signature")

        if not signature:
                raise HTTPException(status_code=400, detail="Missing stripe-signature header")

        try:
                event = stripe.Webhook.construct_event(
                        payload=payload,
                        sig_header=signature,
                        secret=settings.STRIPE_WEBHOOK_SECRET,
                )
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
                print("Stripe webhook signature verification failed:", exc)
                raise HTTPException(status_code=400, detail="Invalid Stripe signature")


        event_type = event.type
        payment_intent = event.data.object
        payment_id = getattr(payment_intent, "id", None)

        if payment_id and event_type in {
                "payment_intent.succeeded",
                "payment_intent.payment_failed",
                "payment_intent.canceled",
        }:
                result = await db.execute(
                        select(FlashSalePurchase).where(
                                FlashSalePurchase.payment_id == payment_id
                        ).with_for_update()
                )
                purchase = result.scalar_one_or_none()

                if purchase is not None and purchase.status == PurchaseStatus.PROCESSING:
                        order = None
                        if purchase.order_id is not None:
                                order_result = await db.execute(
                                        select(Order)
                                        .where(Order.id == purchase.order_id)
                                        .with_for_update()
                                )
                                order = order_result.scalar_one_or_none()

                        if event_type == "payment_intent.succeeded":
                                purchase.status = PurchaseStatus.COMPLETED
                                if order is not None:
                                        order.payment_status = PaymentStatus.PAID
                                        order.status = OrderStatus.CONFIRMED
                        elif event_type == "payment_intent.payment_failed":
                                # A failed attempt can be retried on this PaymentIntent.
                                if order is not None:
                                        order.payment_status = PaymentStatus.FAILED
                        else:
                                quantity = purchase.quantity or 1
                                sale_result = await db.execute(
                                        select(FlashSale)
                                        .where(FlashSale.id == purchase.flash_sale_id)
                                        .with_for_update()
                                )
                                sale = sale_result.scalar_one_or_none()
                                if sale is not None:
                                        sale.remaining_quantity = min(
                                                sale.sale_quantity,
                                                sale.remaining_quantity + quantity,
                                        )

                                product_result = await db.execute(
                                        select(Product)
                                        .where(Product.id == purchase.product_id)
                                        .with_for_update()
                                )
                                product = product_result.scalar_one_or_none()
                                if product is not None:
                                        product.stock_quantity += quantity

                                purchase.status = PurchaseStatus.FAILED
                                if order is not None:
                                        order.payment_status = PaymentStatus.FAILED
                                        order.status = OrderStatus.CANCELLED

                        await db.commit()


        return JSONResponse({"received": True})


@router.get(
                "/{payment_id}/check-status",
                response_model=FlashSaleGetStatus,
                status_code=200
)
async def check_status(
        payment_id: int,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user),
):
        service = FlashSaleService(db)
        return await service.get_payment_status(payment_id)


@router.get(
                "/{flash_sale_id}/check-redeemed",
        response_model=bool,
        status_code=200,
)
async def check_redeemed(
        flash_sale_id: int,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user),
):
        service = FlashSaleService(db)
        return await service.check_user_redeemed(user_id=user.id, flash_sale_id=flash_sale_id)