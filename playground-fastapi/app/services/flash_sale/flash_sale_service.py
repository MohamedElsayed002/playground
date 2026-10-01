from datetime import datetime, timezone
from decimal import Decimal
from random import choice
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
import logging

from app.exceptions.handlers import BadRequestException, ConflictException, NotFoundException, OutOfStockError

from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.models.product import Product
from app.models.idempotency import IdempotencyKey
from app.models.audit_outbox import AuditOutbox
from app.models.order import OrderItem, Order

from app.schemas.flash_sale import CreateFlashSale, FlashSalePurchaseResponse, PaymentResult


from app.services.checkout.create_checkout.checkout_service_2 import _generate_order_number
from app.models.order import OrderStatus , PaymentStatus

from app.services.audit_service import create_audit_log
from app.services.inngest.dispatch import send_flash_sale_payment_job

import json
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, timezone


logger = logging.getLogger(__name__)
class FlashSaleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session



    """
        Create Flash Sale 

        1- Authenticate User
        2- Get Product By ID 
        3- Verify Product exists
        4- Verify authenticated user owns the product 
        5- Validate Input
        6- Check whether the product is already in a flash sale
        7- Create Flash Sale
    """

    async def create_flash_sale(
            self,
            user_id: int,
        data: CreateFlashSale,
    ) -> FlashSale:
        product_result = await self.session.execute(
            select(Product).where(
                Product.id == data.product_id,
                Product.owner_id == user_id,
                Product.is_active == True,
                Product.is_deleted == False
            )
        )

        product = product_result.scalar_one_or_none()

        if not product:
            raise NotFoundException("Owned active product", data.product_id)

        flash_sale_exist = await self.session.execute(select(FlashSale).where(FlashSale.product_id == data.product_id))

        already_exist = flash_sale_exist.scalar_one_or_none()

        if already_exist:
            raise ConflictException("This product already has a flash sale")

        if product.stock_quantity < data.sale_quantity:
            raise BadRequestException("sale quantity is bigger than products in the stock")

        flash_sale = FlashSale(
            product_id=data.product_id,
            starts_at=data.starts_at.isoformat(),
            ends_at=data.ends_at.isoformat(),
            discount_percentage=data.discount_percentage,
            sale_quantity=data.sale_quantity,
            remaining_quantity=data.sale_quantity,
            status="scheduled",
        )

        self.session.add(flash_sale)
        await self.session.flush()
        await self.session.refresh(flash_sale)
        return flash_sale



    """
            Purchase

            1. Authenticate User  ✅     
            2. Idempotency check   
            3. Begin Database Transaction
            4. Select Flash Sale "Lock the Row" ✅  
            5. Check flash if doesn't exist ✅  
            6. Check ends/starts at and status if sale is cancelled ✅  
            7. Check if the user redeemed or used the sale before ✅  
            8. Check Inventory✅  
            9. Calculate discounted price ✅  
            10. decrement the product ✅  
            11. Create FlashSalePurchase✅  
            12. Create Order
            13. Create Order Item Snapshot
            14. Commit ✅  

                POST /flash-sales/123/purchase
                │
                ▼
        Authenticate user
                │
                ▼
        BEGIN TRANSACTION
                │
                ▼
    SELECT flash_sale FOR UPDATE
                │
        ┌─────┴─────┐
        │           │
        doesn't      exists
        exist         │
        │           ▼
        404       Check time
                    │
                    ▼
                Check duplicate
                    │
                    ▼
                Check remaining
                    │
                ┌─────┴──────┐
                │            │
            0 units      > 0
                │            │
            SOLD OUT        ▼
                        decrement by 1
                            │
                            ▼
                    create purchase
                            │
                            ▼
                        COMMIT
                            │
                            ▼
                        SUCCESS
    """
    async def redeem_sale(
        self, flash_sale_id: int, user_id: int, idempotency_key: str
    ) -> FlashSalePurchase:
        async with self.session.begin_nested():
            request_path = f"/flash-sale/{flash_sale_id}/purchase"

            result = await self.session.execute(
                select(IdempotencyKey).where(
                    IdempotencyKey.key == idempotency_key,
                    IdempotencyKey.user_id == user_id,
                    IdempotencyKey.request_path == request_path,
                )
            )

            existing = result.scalar_one_or_none()
            if existing and existing.response_body is not None:
                await create_audit_log(
                    db=self.session,
                    user_id=user_id,
                    event="USER_REDEEMED_SALE",
                    status="SUCCESS"
                )

                response_payload = json.loads(existing.response_body)
                response_payload["message"] = "User already redeemed discount successfully"
                response_payload["success"] = True
                return response_payload

            if existing is not None:
                return JSONResponse(
                    status_code=202,
                    content={
                        "success": True,
                        "status": "processing",
                        "message": "might take a while to checkout",
                        "idempotency_key": idempotency_key
                    }
                )


            if existing is None:
                expires_at = datetime.now(timezone.utc) + timedelta(
                    hours=settings.IDEMPOTENCY_KEY_TTL_HOURS
                )

                new_key = IdempotencyKey(
                    key=idempotency_key,
                    user_id=user_id,
                    request_path=request_path,
                    expires_at=expires_at
                )

                self.session.add(new_key)
                await self.session.flush()


            # Flash Sale Check
            flash_sale_exist = await self.session.execute(
                select(FlashSale).where(FlashSale.id == flash_sale_id).with_for_update()
            )
            flash_sale = flash_sale_exist.scalar_one_or_none()

            if not flash_sale:
                raise BadRequestException("Flash sale not found")

            # Check whether the user redeemed the coupon or not
            user_redeemed_exist = await self.session.execute(
                select(FlashSalePurchase).where(
                    FlashSalePurchase.flash_sale_id == flash_sale_id,
                    FlashSalePurchase.user_id == user_id
                )
                .with_for_update()
            )

            user_redeemed = user_redeemed_exist.scalar_one_or_none()

            if user_redeemed is not None:
                raise ConflictException("User already redeemed the discount need to pay full price")

            if flash_sale.remaining_quantity <= 0:
                raise OutOfStockError("This flash sale is sold out")

            # Calculate starts/ends at 
            now = datetime.now(timezone.utc)
            starts_at = datetime.fromisoformat(flash_sale.starts_at.replace("Z", "+00:00"))
            ends_at = datetime.fromisoformat(flash_sale.ends_at.replace("Z", "+00:00"))

            if now < starts_at or now > ends_at:
                raise BadRequestException("This flash sale is not currently active")

            if flash_sale.remaining_quantity <= 0:
                raise OutOfStockError("This flash sale is sold out")

            # Check the product exist
            product_exist = await self.session.execute(
                select(Product).where(
                    Product.id == flash_sale.product_id,
                    Product.is_deleted == False,
                    Product.is_active == True
                )
                .with_for_update()
            )

            product = product_exist.scalar_one_or_none()

            if product is None:
                raise BadRequestException("Product not found")
            
            if product.stock_quantity <= 0:
                raise OutOfStockError("Product out of the stock. Sorry :'( ")

            price_paid = product.price * (
                Decimal("1") - Decimal(flash_sale.discount_percentage) / Decimal("100")
            )

            # Decrement the quantity.
            # It is inside transaction if it failed will rollback 
            flash_sale.remaining_quantity -= 1
            product.stock_quantity -=1

            # redeem the coupon
            purchase = FlashSalePurchase(
                flash_sale_id=flash_sale.id,
                user_id=user_id,
                product_id=product.id,
                order_id=None,
                price_paid=price_paid,
                quantity=1,
                status=PurchaseStatus.PROCESSING,
            )

            order = Order(
                order_number=_generate_order_number(),
                user_id=user_id,
                status=OrderStatus.PENDING,
                payment_status=PaymentStatus.PENDING,
                subtotal=price_paid,
                tax=0,
                shipping_cost=0,
                total=price_paid,
            )
            self.session.add(order)
            await self.session.flush()

            purchase.order_id = order.id

            order_item = OrderItem(
                order_id=order.id,
                product_id=flash_sale.product_id,
                product_name=product.name,
                quantity=1,
                unit_price=price_paid,
                total_price=price_paid,
                flash_sale_id=flash_sale_id,
                flash_sale_quantity=1
            )

            self.session.add_all([purchase, order_item])
            await self.session.flush()
            await self.session.refresh(purchase)

            # self.session.add(
            #     AuditOutbox(
            #         organization_id=settings.WORKOS_ORGANIZATION_ID,
            #         event_type="FLASH_SALE_PURCHASE_CREATED",
            #         payload={
            #             "purchase_id": purchase.id,
            #             "flash_sale_id": flash_sale.id,
            #             "user_id": user_id,
            #             "product_id": product.id,
            #             "price_paid": str(price_paid),
            #             "status": PurchaseStatus.PROCESSING.value,
            #         },
            #         status=PurchaseStatus.PROCESSING.value,
            #         idempotency_key=f"flash-sale-purchase:{purchase.id}",
            #     )
            # )

            await create_audit_log(
                db=self.session,
                user_id=user_id,
                event="FLASH_SALE_PURCHASE_CREATED",
                status=PurchaseStatus.PROCESSING.value,
                metadata={
                    "purchase_id": purchase.id,
                    "flash_sale_id": flash_sale.id,
                    "product_id": product.id,
                    "price_paid": str(price_paid),
                },
            )

        # Commit first so the worker can query the purchase in another session.
        await self.session.commit()

        # From this Point Background job starts outbox/worker or inngest 
        await send_flash_sale_payment_job(
            flash_sale_purchase_id=purchase.id,
        )
        
        return purchase

    async def get_payment_status(self, payment_id: int):
        payment_exist = await self.session.execute(
            select(
                FlashSalePurchase.id,
                FlashSalePurchase.payment_id,
                FlashSalePurchase.status,
                FlashSalePurchase.stripe_client_secret
            ).where(FlashSalePurchase.id == payment_id)
        )

        payment = payment_exist.mappings().one_or_none()

        if not payment:
            raise BadRequestException("Payment not found")

        return payment

    async def check_user_redeemed(self, user_id: int, flash_sale_id: int):
        redeemed_exist = await self.session.execute(
            select(FlashSalePurchase.id).where(
                FlashSalePurchase.flash_sale_id == flash_sale_id,
                FlashSalePurchase.user_id == user_id,
            )
        )

        redeemed = redeemed_exist.scalar_one_or_none()

        return redeemed is not None

    async def charge_customer(self) -> PaymentResult:
        return choice(list(PaymentResult))