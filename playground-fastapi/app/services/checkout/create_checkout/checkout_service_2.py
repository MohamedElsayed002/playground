import json 
import logging
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.product import Product

from app.exceptions.handlers import ConflictException, NotFoundException, InactiveProductError, OutOfStockError
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus 
from app.repositories.idempotency import IdempotencyRepository
from app.repositories.order import OrderRepository 
from app.repositories.product import ProductRepository
from app.schemas.order import OrderItemCreate, OrderCreate, OrderResponse
from app.services.audit_service import create_audit_log

from decimal import Decimal

logger = logging.getLogger(__name__)

LOW_STOCK_THRESHOLD = 5

def _generate_order_number() -> str:

    import random
    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = random.randint(1000, 9999)
    return f"ORD-{ts}-{suffix}"


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
            request: OrderCreate

    ):
        async def audit_checkout_step(event: str, status: str, **metadata) -> None:
            await create_audit_log(
                db=None,
                event=event,
                status=status,
                user_id=int(user_id) if str(user_id).isdigit() else None,
                metadata={
                    "idempotency_key": idempotency_key,
                    "items_count": len(request.items),
                    **metadata,
                },
            )

        await audit_checkout_step(
            event="CHECKOUT_2_REQUEST_RECEIVED",
            status="SUCCESS",
        )

        # Step 1 check the user is in the data
        user = await self.session.execute(select(User).where(User.id == user_id))
        user_obj = user.scalar_one_or_none()
        if user_obj is None:
            await audit_checkout_step(
                event="CHECKOUT_2_USER_NOT_FOUND",
                status="FAILED",
                checkout_error="User not found",
            )
            raise NotFoundException("User not found")
        
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

        # Step 3 Load & Validate Cart
        # Cart exists? not empty? also database validate the cart min is 1
        if len(request.items) == 0:
            await audit_checkout_step(
                event="CHECKOUT_2_EMPTY_CART",
                status="FAILED",
                checkout_error="No items in the cart",
            )
            raise NotFoundException('No items in the cart')
        
        # Already done below 
        # # Step 4 Pre-check outside transaction 
        #     # - calculate total
        #     #  - validate basic data
        #     #  - Product exists?
        # order_items_data: list[tuple[OrderItemCreate,object]] = []
        # subtotal = Decimal("0")
        
        # for item in request.items:
        #     product = await self.product_repo.get_by_id(item.product_id)
        #     if product is None:
        #         raise NotFoundException(f"Product {item.product_id} not found")
        #     if not product.is_active:
        #         raise InactiveProductError(f"Product {item.product_id} is inactive")
        #     if product.stock_quantity < item.quantity:
        #         raise OutOfStockError(f"Insufficient stock for product {item.product_id}")
        #     if item.quantity <= 0:
        #         raise ValueError("Quantity must be positive")
        #     subtotal += product.price * item.quantity
        
        # Step 5 Transaction starts now + acquire idempotency lock
        idem_record = None
        if idempotency_key is not None:
            try:
                idem_record = await self.idempotency_repo.create_lock(
                    key=idempotency_key,
                    user_id=user_obj.id,
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
                user_id=user_obj.id,
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
            else:
                # Compensation on payment failure:
                # restore stock to keep inventory consistent.
                for item in order.items:
                    if item.product_id is None:
                        continue
                    product = await self.product_repo.get_by_id(item.product_id)
                    if product is not None:
                        product.stock_quantity += item.quantity
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
            request: OrderCreate,
            user_id: int,
    ) -> OrderResponse:
        """
            Core business logic - must be called inside an open transaction
            All DB operations here participate in a single atomic unit work. 
            !! ALL OR NOTHING !! 
            any error here are not acceptable rollback immediately 
        """
        order_items_data: list[tuple[OrderItemCreate, Product]] = []
        sorted_items = sorted(request.items, key=lambda x: x.product_id)
        low_stock_alerts = []
        subtotal = Decimal("0")

        # Step 6 Lock products (SELECT ... FOR UPDATE) in stable order.
        for item_req in sorted_items:
            result = await self.session.execute(
                select(Product)
                .where(Product.id == item_req.product_id)
                .with_for_update()
            )
            product = result.scalars().first()
            if product is None:
                raise NotFoundException(f"Product {item_req.product_id} not found")
            if not product.is_active:
                raise InactiveProductError(f"Product {item_req.product_id} is inactive")
            if product.stock_quantity < item_req.quantity:
                raise OutOfStockError(f"Insufficient stock for product {item_req.product_id}")
            subtotal += product.price * item_req.quantity
            order_items_data.append((item_req, product))

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
        for item_req, product in order_items_data:
            line_total = product.price * item_req.quantity
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=item_req.quantity,
                unit_price=product.price,
                total_price=line_total,
            )
            self.session.add(order_item)

            product.stock_quantity -= item_req.quantity
            if product.stock_quantity <= LOW_STOCK_THRESHOLD:
                low_stock_alerts.append(
                    {"product_id": product.id, "stock_remaining": product.stock_quantity}
                )

        

        await self.session.flush()
        await self.session.refresh(order, attribute_names=["items"])
        return OrderResponse.model_validate(order)

    async def _process_payment(self, order_id: int, amount: Decimal) -> bool:
        """
            Simulate external payment call outside DB transaction.
            Replace this with provider SDK/API integration later.
        """
        logger.info("Processing payment for order=%s amount=%s", order_id, amount)
        return True





    # Old Version

    # async def checkout(
    #         self,
    #         request: OrderCreate,
    #         user_id: int,
    #         user_email: str,
    #         idempotency_key: str,
    #         request_path: str
    # ) -> OrderResponse:
        
    #     # Step 1 Check Idempotency key
    #     existing = await self.idempotency_repo.get_by_key(idempotency_key)
    #     if existing is not None:
    #         if existing.is_complete():
    #             logger.info("Already exist and ordered")
    #             return OrderResponse(**json.loads(existing.response_body))
    #         else:
    #             raise ConflictException("A request with this Idempotency-Key is already being processed. Please wait and retry")
            
    #     # Step 2: Acquire Idempotency lock
    #     try:
    #         idem_record = await self.idempotency_repo.create_lock(
    #             key=idempotency_key,
    #             user_id=user_id,
    #             request_path=request_path
    #         )

    #         # to get unique constraint inside the transaction
    #         await self.session.flush()
    #     except IntegrityError:
    #         await self.session.rollback()
    #         raise ConflictException("Duplicate Idempotency Key detected")
        
    #     # Step 3~8 : Transactional Checkout
    #     try:
    #         response = await self._execute_checkout(request,user_id)
    #     except Exception:
    #         # Roll back again: ALL OR NOTHING
    #         await self.session.rollback()
    #         raise
            
    #     # Step 9 
    #     await self.idempotency_repo.complete(
    #         idem_record,
    #         response_body=response.model_dump_json(),
    #         status_code=201
    #     )
    #     await self.session.commit()

    #     return response
    
    # async def _execute_checkout(
    #         self,
    #         request: OrderCreate,
    #         user_id: int
    # ) -> OrderResponse:
    #     """
    #         Core business logic - must be called inside an open transaction
    #         All DB operations here participate in a single atomic unit work. ALL OR NOTHING
    #     """

    #     order_items_data: list[tuple[OrderItemCreate,object]] = []
    #     subtotal = Decimal("0")

    #     sorted_items = sorted(request.items, key=lambda x: x.product_id)

    #     low_stock_alerts = []

    #     for item_req, product in order_items_data:
    #         product.stock_quantity -= item_req.quantity
    #         if product.stock_quantity <= LOW_STOCK_THRESHOLD:
    #             low_stock_alerts.append({
    #                 "product_id": product.id,
    #                 "stock_remaining": product.stock_quantity
    #             })
        
    #     # Create the order
    #     tax = subtotal * Decimal("0.49") # Fair enough?
    #     shipping_cost = Decimal("0")
    #     total = subtotal + tax + shipping_cost

    #     order = Order(
    #                     order_number=_generate_order_number(),
    #         user_id=user_id,
    #         status=OrderStatus.PENDING,
    #         payment_status=PaymentStatus.PENDING,
    #         subtotal=subtotal,
    #         tax=tax,
    #         shipping_cost=shipping_cost,
    #         total=total,
    #         shipping_address_line1=request.shipping_address_line1,
    #         shipping_address_line2=request.shipping_address_line2,
    #         shipping_city=request.shipping_city,
    #         shipping_country=request.shipping_country,
    #         shipping_postal_code=request.shipping_postal_code,
    #         notes=request.notes,
    #     ) 

    #     self.order_repo(order)
    #     await self.session.flush()

    #     # Snapshot
    #     for item_req, product in order_items_data:
    #         line_total = product.price * item_req.quantity
    #         snapy = OrderItem(
    #             order_id=order.id,
    #             product_name=product.name,
    #             quantity=item_req.quantity,
    #             unit_price=product.price,
    #             total_price=line_total
    #         )
    #         self.session.add(snapy)
    #     await self.session.flush()

    #     return OrderResponse(
    #         order_id=order.id,
    #         order_number=order.order_number,
    #         status=order.status.value,
    #         payment_status=order.payment_status.value,
    #         subtotal=subtotal,
    #         tax=tax,
    #         shipping_cost=shipping_cost,
    #         total=total,
    #     )