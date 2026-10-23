import json
from decimal import Decimal
from random import choice

from fastapi.responses import JSONResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    OutOfStockError,
)
from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.models.idempotency import IdempotencyKey
from app.models.order import OrderItem
from app.models.product import Product
from app.repositories.idempotency import IdempotencyRepository
from app.schemas.flash_sale import (
    CreateFlashSale,
    PaymentResult,
)
from app.services.audit_service import create_audit_log
from app.services.flash_sale.rules import sale_window_is_open
from app.services.inngest.dispatch import send_flash_sale_payment_job
from app.services.order_factory import create_pending_order

class FlashSaleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.idempotency_repo = IdempotencyRepository(session)

    async def create_flash_sale(
        self,
        user_id: int,
        data: CreateFlashSale,
    ) -> FlashSale:
        product = await self._get_owned_active_product(user_id, data.product_id)
        await self._ensure_product_has_no_flash_sale(data.product_id)
        if product.stock_quantity < data.sale_quantity:
            raise BadRequestException(
                "sale quantity is bigger than products in the stock"
            )

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

    async def _get_owned_active_product(
        self,
        user_id: int,
        product_id: int,
    ) -> Product:
        result = await self.session.execute(
            select(Product).where(
                Product.id == product_id,
                Product.owner_id == user_id,
                Product.is_active.is_(True),
                Product.is_deleted.is_(False),
            )
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise NotFoundException("Owned active product", product_id)
        return product

    async def _ensure_product_has_no_flash_sale(self, product_id: int) -> None:
        result = await self.session.execute(
            select(FlashSale).where(FlashSale.product_id == product_id)
        )
        if result.scalar_one_or_none() is not None:
            raise ConflictException("This product already has a flash sale")

    async def redeem_sale(
        self,
        flash_sale_id: int,
        user_id: int,
        idempotency_key: str,
    ) -> FlashSalePurchase | JSONResponse | dict:
        request_path = f"/flash-sale/{flash_sale_id}/purchase"
        async with self.session.begin_nested():
            existing_key = await self.idempotency_repo.get_by_key(
                idempotency_key,
                user_id=user_id,
                request_path=request_path,
            )
            if existing_key is not None:
                return await self._response_for_existing_key(
                    existing_key,
                    user_id,
                    idempotency_key,
                )

            await self.idempotency_repo.create_lock(
                key=idempotency_key,
                user_id=user_id,
                request_path=request_path,
            )
            purchase = await self._create_sale_purchase(
                flash_sale_id=flash_sale_id,
                user_id=user_id,
            )

        await self.session.commit()
        await send_flash_sale_payment_job(
            flash_sale_purchase_id=purchase.id,
        )
        return purchase

    async def _response_for_existing_key(
        self,
        existing_key: IdempotencyKey,
        user_id: int,
        idempotency_key: str,
    ) -> dict | JSONResponse:
        if existing_key.response_body is None:
            return JSONResponse(
                status_code=202,
                content={
                    "success": True,
                    "status": "processing",
                    "message": "might take a while to checkout",
                    "idempotency_key": idempotency_key,
                },
            )

        await create_audit_log(
            db=self.session,
            user_id=user_id,
            event="USER_REDEEMED_SALE",
            status="SUCCESS",
        )
        response_payload = json.loads(existing_key.response_body)
        response_payload["message"] = "User already redeemed discount successfully"
        response_payload["success"] = True
        return response_payload

    async def _create_sale_purchase(
        self,
        flash_sale_id: int,
        user_id: int,
    ) -> FlashSalePurchase:
        flash_sale = await self._get_locked_flash_sale(flash_sale_id)
        await self._ensure_user_has_not_redeemed(flash_sale_id, user_id)
        if flash_sale.remaining_quantity <= 0:
            raise OutOfStockError("This flash sale is sold out")
        if not sale_window_is_open(flash_sale):
            raise BadRequestException("This flash sale is not currently active")

        product = await self._get_locked_sale_product(flash_sale.product_id)
        if product.stock_quantity <= 0:
            raise OutOfStockError("Product out of the stock. Sorry :'( ")

        discounted_price = product.price * (
            Decimal("1")
            - Decimal(flash_sale.discount_percentage) / Decimal("100")
        )
        await self._reserve_sale_inventory(flash_sale, product)

        purchase = FlashSalePurchase(
            flash_sale_id=flash_sale.id,
            user_id=user_id,
            product_id=product.id,
            order_id=None,
            price_paid=discounted_price,
            quantity=1,
            status=PurchaseStatus.PROCESSING,
        )
        order = create_pending_order(
            user_id=user_id,
            subtotal=discounted_price,
        )
        self.session.add(order)
        await self.session.flush()
        purchase.order_id = order.id

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=1,
            unit_price=discounted_price,
            total_price=discounted_price,
            flash_sale_id=flash_sale.id,
            flash_sale_quantity=1,
        )
        self.session.add_all([purchase, order_item])
        await self.session.flush()
        await self.session.refresh(purchase)
        await create_audit_log(
            db=self.session,
            user_id=user_id,
            event="FLASH_SALE_PURCHASE_CREATED",
            status=PurchaseStatus.PROCESSING.value,
            metadata={
                "purchase_id": purchase.id,
                "flash_sale_id": flash_sale.id,
                "product_id": product.id,
                "price_paid": str(discounted_price),
            },
        )
        return purchase

    async def _get_locked_flash_sale(self, flash_sale_id: int) -> FlashSale:
        result = await self.session.execute(
            select(FlashSale)
            .where(FlashSale.id == flash_sale_id)
            .with_for_update()
        )
        flash_sale = result.scalar_one_or_none()
        if flash_sale is None:
            raise BadRequestException("Flash sale not found")
        return flash_sale

    async def _ensure_user_has_not_redeemed(
        self,
        flash_sale_id: int,
        user_id: int,
    ) -> None:
        result = await self.session.execute(
            select(FlashSalePurchase)
            .where(
                FlashSalePurchase.flash_sale_id == flash_sale_id,
                FlashSalePurchase.user_id == user_id,
            )
            .with_for_update()
        )
        if result.scalar_one_or_none() is not None:
            raise ConflictException(
                "User already redeemed the discount need to pay full price"
            )

    async def _get_locked_sale_product(self, product_id: int) -> Product:
        result = await self.session.execute(
            select(Product)
            .where(
                Product.id == product_id,
                Product.is_deleted.is_(False),
                Product.is_active.is_(True),
            )
            .with_for_update()
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise BadRequestException("Product not found")
        return product

    async def _reserve_sale_inventory(
        self,
        flash_sale: FlashSale,
        product: Product,
    ) -> None:
        sale_update = await self.session.execute(
            update(FlashSale)
            .where(
                FlashSale.id == flash_sale.id,
                FlashSale.remaining_quantity >= 1,
            )
            .values(remaining_quantity=FlashSale.remaining_quantity - 1)
            .returning(FlashSale.remaining_quantity)
        )
        sale_remaining = sale_update.scalar_one_or_none()
        if sale_remaining is None:
            raise OutOfStockError("This flash sale is sold out")
        flash_sale.remaining_quantity = sale_remaining

        product_update = await self.session.execute(
            update(Product)
            .where(
                Product.id == product.id,
                Product.stock_quantity >= 1,
            )
            .values(stock_quantity=Product.stock_quantity - 1)
            .returning(Product.stock_quantity)
        )
        product_remaining = product_update.scalar_one_or_none()
        if product_remaining is None:
            raise OutOfStockError("Product out of the stock. Sorry :'( ")
        product.stock_quantity = product_remaining

    async def get_payment_status(self, payment_id: int):
        result = await self.session.execute(
            select(
                FlashSalePurchase.id,
                FlashSalePurchase.payment_id,
                FlashSalePurchase.status,
                FlashSalePurchase.stripe_client_secret,
            ).where(FlashSalePurchase.id == payment_id)
        )
        payment = result.mappings().one_or_none()
        if payment is None:
            raise BadRequestException("Payment not found")
        return payment

    async def check_user_redeemed(
        self,
        user_id: int,
        flash_sale_id: int,
    ) -> bool:
        result = await self.session.execute(
            select(FlashSalePurchase.id).where(
                FlashSalePurchase.flash_sale_id == flash_sale_id,
                FlashSalePurchase.user_id == user_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def charge_customer(self) -> PaymentResult:
        return choice(list(PaymentResult))
