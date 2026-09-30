import json 
import logging
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.models.user import User
from app.models.product import Product
from app.models.cart import Cart
from app.models.cart_item import CartItem

from app.exceptions.handlers import ConflictException, NotFoundException, InactiveProductError, OutOfStockError
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus 
from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.repositories.idempotency import IdempotencyRepository
from app.repositories.order import OrderRepository 
from app.repositories.product import ProductRepository
from app.schemas.order import OrderCheckoutCreate, OrderResponse
from app.services.audit_service import create_audit_log

from decimal import Decimal

logger = logging.getLogger(__name__)

LOW_STOCK_THRESHOLD = 5

def _generate_order_number() -> str:

    import random
    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = random.randint(1000, 9999)
    return f"ORD-{ts}-{suffix}"


"""
1. Receive checkout request
2. Start DB transaction
3. Lock inventory row 
4. Verify stock > 0
5. Reserve/decrement stock
6. Create order 
7. Commit 
8. return success
9. Background jobs afterward

v2

1. Begin transactions
2. Load cart + cart items
3. validate products
4. validate flash sale 
    - is sale active?
    - does flash-sale inventory remain?
    - has this user already redeemed it?
5. calculate final price 
6. atomically reserve/decrement inventory
7. atomically claim flash-sale purchase 
    - flash_sale_purchase
8. create order 
9. create order items
    - snapshot original price
    - actual unit price
    - flash_sale_id
    - flash_sale_quantity
10. create payment/outbox record
11. commit 
12. Background job 
"""


class CheckoutService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.product_repo = ProductRepository(session)
        self.order_repo = OrderRepository(session)
        self.idempotency_repo = IdempotencyRepository(session)


    async def checkout_2(
            self,
            idempotency_key: str | None,
            user_id: str,
            request: OrderCheckoutCreate

    ):
        items_count = 0

        async def audit_checkout_step(event: str, status: str, **metadata) -> None:
            await create_audit_log(
                db=None,
                event=event,
                status=status,
                user_id=user_id,
                metadata={
                    "idempotency_key": idempotency_key,
                    "items_count": items_count,
                    **metadata,
                },
            )

        await audit_checkout_step(
            event="CHECKOUT_2_REQUEST_RECEIVED",
            status="SUCCESS",
        )


        # Load the current user's cart from the database
        cart_result = await self.session.execute(
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
        )

        cart = cart_result.scalar_one_or_none()

        if cart is None or not cart.items:
            await audit_checkout_step(
                event="CHECKOUT_2_EMPTY_CART",
                status="FAILED",
                checkout_error="No items in the cart",
            )
            raise NotFoundException("No items in the cart")
        
        items_count = len(cart.items)

        # Step 2 Check idempotency key
        if idempotency_key is not None:
            existing = await self.idempotency_repo.get_by_key(idempotency_key)

            if existing is not None and existing.is_complete():
                logger.info("Already exist and ordered successfully")
                await audit_checkout_step(
                    event="CHECKOUT_2_IDEMPOTENT_HIT",
                    status="SUCCESS",
                    idempotent_replay=True,
                )
                return OrderResponse(**json.loads(existing.response_body))
            # else:
                # raise ConflictException("A request with this Idempotency-Key is already being processed. Please wait mate")

        # Step 5 Transaction starts now + acquire idempotency lock
        idem_record = None
        if idempotency_key is not None:
            try:
                idem_record = await self.idempotency_repo.create_lock(
                    key=idempotency_key,
                    user_id=user_id,
                    request_path="/checkout"
                )
            except IntegrityError:
                await self.session.rollback()
                await audit_checkout_step(
                    event="CHECKOUT_2_IDEMPOTENCY_CONFLICT",
                    status="FAILED",
                    checkout_error="Duplicate Idempotency key detected",
                )
                raise ConflictException("Duplicate Idempotency key detected")

        # Step 6~9 Database transaction (short and atomic)
        # - Lock product rows
        # - Revalidate stock with locked rows
        # - Create order (PENDING) + order items snapshots
        # - Decrement stock
        try:
            response = await self._execute_checkout_2(
                request=request,
                user_id=user_id,
                cart=cart,
            )
            await self.session.commit()
            await audit_checkout_step(
                event="CHECKOUT_2_DB_TRANSACTION_COMMITTED",
                status="SUCCESS",
                order_id=response.id,
                order_number=response.order_number,
                total=str(response.total),
            )
        except Exception:
            await self.session.rollback()
            await audit_checkout_step(
                event="CHECKOUT_2_DB_TRANSACTION_FAILED",
                status="FAILED",
                checkout_error="Transactional checkout failed",
            )
            raise

        # Step 10 Outside transaction: process payment with external provider
        payment_ok = await self._process_payment(response.id, response.total)
        await audit_checkout_step(
            event="CHECKOUT_2_PAYMENT_RESULT",
            status="SUCCESS" if payment_ok else "FAILED",
            order_id=response.id,
            payment_ok=payment_ok,
            amount=str(response.total),
        )

        # Step 11~12 Finalize order status in a second short transaction
        order = await self.order_repo.get_with_items(response.id)
        if order is None:
            raise NotFoundException("Order not found after checkout")

        try:
            if payment_ok:
                order.payment_status = PaymentStatus.PAID
                order.status = OrderStatus.CONFIRMED
            elif order.status != OrderStatus.CANCELLED:
                # Compensation on payment failure:
                # Restore product stock and any claimed flash-sale quantity.
                for item in order.items:
                    if item.product_id is not None:
                        product_result = await self.session.execute(
                            select(Product)
                            .where(Product.id == item.product_id)
                            .with_for_update()
                        )
                        product = product_result.scalar_one_or_none()
                        if product is not None:
                            product.stock_quantity += item.quantity

                    if item.flash_sale_id is not None and item.flash_sale_quantity > 0:
                        sale_result = await self.session.execute(
                            select(FlashSale)
                            .where(FlashSale.id == item.flash_sale_id)
                            .with_for_update()
                        )
                        flash_sale = sale_result.scalar_one_or_none()
                        if flash_sale is not None:
                            flash_sale.remaining_quantity = min(
                                flash_sale.sale_quantity,
                                flash_sale.remaining_quantity + item.flash_sale_quantity,
                            )

                purchase_result = await self.session.execute(
                    select(FlashSalePurchase)
                    .where(FlashSalePurchase.order_id == order.id)
                    .with_for_update()
                )
                for purchase in purchase_result.scalars():
                    purchase.status = PurchaseStatus.FAILED

                order.payment_status = PaymentStatus.FAILED
                order.status = OrderStatus.CANCELLED
                await audit_checkout_step(
                    event="CHECKOUT_2_COMPENSATION_APPLIED",
                    status="SUCCESS",
                    order_id=order.id,
                    compensation="stock_restored",
                )

            if idem_record is not None:
                await self.idempotency_repo.complete(
                    idem_record,
                    response_body=OrderResponse.model_validate(order).model_dump_json(),
                    status_code=201 if payment_ok else 402,
                )

            await self.session.commit()
            await audit_checkout_step(
                event="CHECKOUT_2_FINALIZED",
                status="SUCCESS",
                order_id=order.id,
                order_status=order.status.value,
                payment_status=order.payment_status.value,
            )
        except Exception:
            await self.session.rollback()
            await audit_checkout_step(
                event="CHECKOUT_2_FINALIZATION_FAILED",
                status="FAILED",
                order_id=getattr(order, "id", None),
                checkout_error="Final order status update failed",
            )
            raise

        # Step 12 Return final response
        final_order = await self.order_repo.get_with_items(order.id)
        if final_order is None:
            await audit_checkout_step(
                event="CHECKOUT_2_FINAL_ORDER_NOT_FOUND",
                status="FAILED",
                order_id=order.id,
            )
            raise NotFoundException("Order not found")

        # Step 13 Trigger background jobs (email, invoice, analytics, alerts).
        try:
            from app.services.inngest import send_checkout_background_jobs

            await send_checkout_background_jobs(
                order_id=final_order.id,
                user_id=final_order.user_id,
                order_number=final_order.order_number,
                payment_status=final_order.payment_status.value,
                total=str(final_order.total),
            )
            await audit_checkout_step(
                event="CHECKOUT_2_BACKGROUND_JOBS_DISPATCHED",
                status="SUCCESS",
                order_id=final_order.id,
            )
        except Exception:
            # Non-critical path: checkout already succeeded, do not fail response.
            await audit_checkout_step(
                event="CHECKOUT_2_BACKGROUND_JOBS_DISPATCH_FAILED",
                status="FAILED",
                order_id=final_order.id,
            )

        return OrderResponse.model_validate(final_order)
    
    async def _execute_checkout_2(
            self,
            request: OrderCheckoutCreate,
            user_id: int,
            cart: Cart,
    ) -> OrderResponse:
        """
        Core business logic - must be called inside an open transaction
        All DB operations here participate in a single atomic unit work. 
        !! ALL OR NOTHING !! 
        any error here are not acceptable rollback immediately 
        """
        order_items_data: list[tuple[CartItem, Product, FlashSale | None, bool]] = []
        sorted_items = sorted(cart.items, key=lambda x: x.product_id)
        subtotal = Decimal("0")

        # Step 6 Lock products (SELECT ... FOR UPDATE) in stable order.
        for cart_item in sorted_items:
            result = await self.session.execute(
                select(Product)
                .where(Product.id == cart_item.product_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
            product = result.scalars().first()
            if product is None:
                raise NotFoundException(f"Product {cart_item.product_id} not found")
            if not product.is_active or product.is_deleted: 
                raise InactiveProductError(f"Product {cart_item.product_id} is inactive")
            if product.stock_quantity < cart_item.quantity:
                raise OutOfStockError(f"Insufficient stock for product {cart_item.product_id}")

            sale_result = await self.session.execute(
                select(FlashSale)
                .where(FlashSale.product_id == product.id)
                .with_for_update()
            )
            flash_sale = sale_result.scalar_one_or_none()
            discounted = False

            if flash_sale is not None and self._flash_sale_is_active(flash_sale):
                purchase_result = await self.session.execute(
                    select(FlashSalePurchase).where(
                        FlashSalePurchase.flash_sale_id == flash_sale.id,
                        FlashSalePurchase.user_id == user_id,
                    )
                )
                already_redeemed = purchase_result.scalar_one_or_none() is not None
                discounted = not already_redeemed and flash_sale.remaining_quantity > 0

            discounted_quantity = 1 if discounted else 0
            sale_price = product.price
            if discounted:
                sale_price = product.price * (
                    Decimal("1") - Decimal(flash_sale.discount_percentage) / Decimal("100")
                )

            subtotal += sale_price * discounted_quantity
            subtotal += product.price * (cart_item.quantity - discounted_quantity)
            order_items_data.append((cart_item, product, flash_sale if discounted else None, discounted))

        # Step 7 Create order row as PENDING (before payment).
        tax = subtotal * Decimal("0.10")
        shipping_cost = Decimal("0")
        total = subtotal + tax + shipping_cost

        order = Order(
            order_number=_generate_order_number(),
            user_id=user_id,
            status=OrderStatus.PENDING,
            payment_status=PaymentStatus.PENDING,
            subtotal=subtotal,
            tax=tax,
            shipping_cost=shipping_cost,
            total=total,
            shipping_address_line1=request.shipping_address_line1,
            shipping_address_line2=request.shipping_address_line2,
            shipping_city=request.shipping_city,
            shipping_country=request.shipping_country,
            shipping_postal_code=request.shipping_postal_code,
            notes=request.notes,
        )
        self.order_repo.add(order)
        await self.session.flush()

        # Step 8 Create immutable order-item snapshots + decrement stock.
        for cart_item, product, flash_sale, discounted in order_items_data:
            discounted_quantity = 1 if discounted else 0
            if discounted_quantity:
                sale_price = product.price * (
                    Decimal("1") - Decimal(flash_sale.discount_percentage) / Decimal("100")
                )
                self.session.add(OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=1,
                    unit_price=sale_price,
                    total_price=sale_price,
                    flash_sale_id=flash_sale.id,
                    flash_sale_quantity=1,
                ))

                flash_sale.remaining_quantity -= 1
                self.session.add(FlashSalePurchase(
                    flash_sale_id=flash_sale.id,
                    user_id=user_id,
                    order_id=order.id,
                    product_id=product.id,
                    price_paid=sale_price,
                    quantity=1,
                    status=PurchaseStatus.PROCESSING,
                ))

            full_price_quantity = cart_item.quantity - discounted_quantity
            if full_price_quantity:
                self.session.add(OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=full_price_quantity,
                    unit_price=product.price,
                    total_price=product.price * full_price_quantity,
                    flash_sale_quantity=0,
                ))

            stock_update = await self.session.execute(
                update(Product)
                .where(
                    Product.id == product.id,
                    Product.stock_quantity >= cart_item.quantity,
                )
                .values(stock_quantity=Product.stock_quantity - cart_item.quantity)
                .returning(Product.stock_quantity)
            )
            stock_remaining = stock_update.scalar_one_or_none()
            if stock_remaining is None:
                raise OutOfStockError(
                    f"Insufficient stock for product {product.id}"
                )

            product.stock_quantity = stock_remaining
        for cart_item in list(cart.items):
            await self.session.delete(cart_item)

        

        await self.session.flush()
        await self.session.refresh(order, attribute_names=["items"])
        return OrderResponse.model_validate(order)

    @staticmethod
    def _flash_sale_is_active(flash_sale: FlashSale) -> bool:
        now = datetime.now(timezone.utc)
        starts_at = datetime.fromisoformat(flash_sale.starts_at.replace("Z", "+00:00"))
        ends_at = datetime.fromisoformat(flash_sale.ends_at.replace("Z", "+00:00"))
        return (
            flash_sale.status in {"active", "scheduled"}
            and starts_at <= now <= ends_at
            and flash_sale.remaining_quantity > 0
        )

    async def _process_payment(self, order_id: int, amount: Decimal) -> bool:
        """
            Simulate external payment call outside DB transaction.
            Replace this with provider SDK/API integration later.
        """
        logger.info("Processing payment for order=%s amount=%s", order_id, amount)
        return True
