import json
import logging

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload

from app.exceptions.handlers import ConflictException, NotFoundException
from app.models.cart import Cart
from app.models.idempotency import IdempotencyKey
from app.models.order import Order
from app.repositories.idempotency import IdempotencyRepository
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCheckoutCreate, OrderResponse
from app.services.audit_service import create_audit_log
from app.services.inngest import send_checkout_background_jobs
from app.services.checkout.create_checkout.checkout_transaction import (
    execute_checkout_transaction,
)

logger = logging.getLogger(__name__)


class CheckoutService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.order_repo = OrderRepository(session)
        self.idempotency_repo = IdempotencyRepository(session)

    async def checkout(
        self,
        idempotency_key: str | None,
        user_id: int,
        request: OrderCheckoutCreate,
    ) -> OrderResponse:
        items_count = 0
        await self._audit_checkout_step(
            user_id=user_id,
            idempotency_key=idempotency_key,
            items_count=items_count,
            event="CHECKOUT_2_REQUEST_RECEIVED",
            status="SUCCESS",
        )

        cart = await self._load_cart(
            user_id=user_id,
            idempotency_key=idempotency_key,
            items_count=items_count,
        )
        existing_response = await self._get_idempotent_response(
            idempotency_key=idempotency_key,
            user_id=user_id,
            items_count=items_count,
        )
        if existing_response is not None:
            return existing_response

        idempotency_record = await self._create_idempotency_lock(
            idempotency_key=idempotency_key,
            user_id=user_id,
            items_count=items_count,
        )
        checkout_response = await self._commit_checkout(
            request=request,
            user_id=user_id,
            cart=cart,
            idempotency_key=idempotency_key,
            items_count=items_count,
        )
        items_count = _count_checkout_products(checkout_response)
        final_order = await self._load_final_order(
            order_id=checkout_response.id,
            user_id=user_id,
            idempotency_key=idempotency_key,
            items_count=items_count,
        )
        await self._dispatch_background_jobs(
            order=final_order,
            user_id=user_id,
            idempotency_key=idempotency_key,
            items_count=items_count,
        )

        if idempotency_record is not None:
            await self._complete_idempotency_record(
                record=idempotency_record,
                order=final_order,
            )

        return OrderResponse.model_validate(final_order)

    async def checkout_2(
        self,
        idempotency_key: str | None,
        user_id: int,
        request: OrderCheckoutCreate,
    ) -> OrderResponse:
        """Backward-compatible alias for the checkout use case."""
        return await self.checkout(idempotency_key, user_id, request)

    async def _audit_checkout_step(
        self,
        user_id: int,
        idempotency_key: str | None,
        items_count: int,
        event: str,
        status: str,
        **metadata: object,
    ) -> None:
        await create_audit_log(
            db=self.session,
            event=event,
            status=status,
            user_id=user_id,
            metadata={
                "idempotency_key": idempotency_key,
                "items_count": items_count,
                **metadata,
            },
        )

    async def _load_cart(
        self,
        user_id: int,
        idempotency_key: str | None,
        items_count: int,
    ) -> Cart:
        result = await self.session.execute(
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(noload(Cart.items))
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        cart = result.scalar_one_or_none()
        if cart is None:
            await self._audit_checkout_step(
                user_id=user_id,
                idempotency_key=idempotency_key,
                items_count=items_count,
                event="CHECKOUT_2_EMPTY_CART",
                status="FAILED",
                checkout_error="No items in the cart",
            )
            raise NotFoundException("No items in the cart")
        return cart

    async def _get_idempotent_response(
        self,
        idempotency_key: str | None,
        user_id: int,
        items_count: int,
    ) -> OrderResponse | None:
        if idempotency_key is None:
            return None

        existing = await self.idempotency_repo.get_by_key(
            idempotency_key,
            user_id=user_id,
            request_path="/checkout",
        )
        if existing is None or not existing.is_complete():
            return None

        await self._audit_checkout_step(
            user_id=user_id,
            idempotency_key=idempotency_key,
            items_count=items_count,
            event="CHECKOUT_2_IDEMPOTENT_HIT",
            status="SUCCESS",
            idempotent_replay=True,
        )
        return OrderResponse(**json.loads(existing.response_body))

    async def _create_idempotency_lock(
        self,
        idempotency_key: str | None,
        user_id: int,
        items_count: int,
    ) -> IdempotencyKey | None:
        if idempotency_key is None:
            return None

        try:
            return await self.idempotency_repo.create_lock(
                key=idempotency_key,
                user_id=user_id,
                request_path="/checkout",
            )
        except IntegrityError as error:
            await self.session.rollback()
            await self._audit_checkout_step(
                user_id=user_id,
                idempotency_key=idempotency_key,
                items_count=items_count,
                event="CHECKOUT_2_IDEMPOTENCY_CONFLICT",
                status="FAILED",
                checkout_error="Duplicate Idempotency key detected",
            )
            raise ConflictException("Duplicate Idempotency key detected") from error

    async def _commit_checkout(
        self,
        request: OrderCheckoutCreate,
        user_id: int,
        cart: Cart,
        idempotency_key: str | None,
        items_count: int,
    ) -> OrderResponse:
        try:
            response = await self._execute_checkout_2(
                request=request,
                user_id=user_id,
                cart=cart,
            )
            items_count = _count_checkout_products(response)
            await self.session.commit()
            await self._audit_checkout_step(
                user_id=user_id,
                idempotency_key=idempotency_key,
                items_count=items_count,
                event="CHECKOUT_2_DB_TRANSACTION_COMMITTED",
                status="SUCCESS",
                order_id=response.id,
                order_number=response.order_number,
                total=str(response.total),
            )
            return response
        except Exception:
            await self.session.rollback()
            await self._audit_checkout_step(
                user_id=user_id,
                idempotency_key=idempotency_key,
                items_count=items_count,
                event="CHECKOUT_2_DB_TRANSACTION_FAILED",
                status="FAILED",
                checkout_error="Transactional checkout failed",
            )
            raise

    async def _execute_checkout_2(
        self,
        request: OrderCheckoutCreate,
        user_id: int,
        cart: Cart,
    ) -> OrderResponse:
        return await execute_checkout_transaction(
            session=self.session,
            order_repository=self.order_repo,
            request=request,
            user_id=user_id,
            cart=cart,
        )

    async def _load_final_order(
        self,
        order_id: int,
        user_id: int,
        idempotency_key: str | None,
        items_count: int,
    ) -> Order:
        order = await self.order_repo.get_with_items(order_id)
        if order is None:
            await self._audit_checkout_step(
                user_id=user_id,
                idempotency_key=idempotency_key,
                items_count=items_count,
                event="CHECKOUT_2_FINAL_ORDER_NOT_FOUND",
                status="FAILED",
                order_id=order_id,
            )
            raise NotFoundException("Order not found")
        return order

    async def _dispatch_background_jobs(
        self,
        order: Order,
        user_id: int,
        idempotency_key: str | None,
        items_count: int,
    ) -> None:
        try:
            await send_checkout_background_jobs(
                order_id=order.id,
                user_id=order.user_id,
                order_number=order.order_number,
                payment_status=order.payment_status.value,
                total=str(order.total),
            )
        except Exception:
            logger.exception(
                "Checkout background jobs could not be dispatched for order %s",
                order.id,
            )
            await self._audit_checkout_step(
                user_id=user_id,
                idempotency_key=idempotency_key,
                items_count=items_count,
                event="CHECKOUT_2_BACKGROUND_JOBS_DISPATCH_FAILED",
                status="FAILED",
                order_id=order.id,
            )
            return

        await self._audit_checkout_step(
            user_id=user_id,
            idempotency_key=idempotency_key,
            items_count=items_count,
            event="CHECKOUT_2_BACKGROUND_JOBS_DISPATCHED",
            status="SUCCESS",
            order_id=order.id,
        )

    async def _complete_idempotency_record(
        self,
        record: IdempotencyKey,
        order: Order,
    ) -> None:
        try:
            await self.idempotency_repo.complete(
                record,
                response_body=OrderResponse.model_validate(order).model_dump_json(),
                status_code=201,
            )
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise


def _count_checkout_products(response: OrderResponse) -> int:
    return len({
        item.product_id
        for item in response.items
        if item.product_id is not None
    })
