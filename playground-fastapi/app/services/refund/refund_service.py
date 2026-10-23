import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.datetime_utils import as_utc_datetime
from app.exceptions.handlers import BadRequestException
from app.models.audit_outbox import AuditOutbox
from app.models.idempotency import IdempotencyKey
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.refund import Refund, RefundStatus
from app.repositories.idempotency import IdempotencyRepository
from app.services.audit_service import create_audit_log
from app.services.inngest.dispatch import send_refund_job

REFUND_WINDOW = timedelta(days=30)


class RefundService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.idempotency_repo = IdempotencyRepository(session)

    async def request_refund(
        self,
        key: str,
        user_id: int,
        order_id: int,
    ) -> JSONResponse | dict:
        request_path = f"/orders/refund/{order_id}"
        existing_key = await self.idempotency_repo.get_by_key(
            key,
            user_id=user_id,
            request_path=request_path,
        )
        existing_response = await self._handle_existing_request(
            existing_key=existing_key,
            key=key,
            user_id=user_id,
            order_id=order_id,
        )
        if existing_response is not None:
            return existing_response

        await self.idempotency_repo.create_lock(
            key=key,
            user_id=user_id,
            request_path=request_path,
        )
        order = await self._get_locked_order(order_id, user_id)
        existing_refund = await self._get_order_refund(order.id, lock=True)
        if existing_refund is not None:
            return await self._existing_refund_response(
                refund=existing_refund,
                order_id=order.id,
                key=key,
            )

        refund_amount = self._validate_and_calculate_refund(order)
        outbox_event = self._create_refund_outbox_event(
            order=order,
            refund_amount=refund_amount,
            user_id=user_id,
        )
        refund = Refund(
            order_id=order.id,
            amount=refund_amount,
            status=RefundStatus.PROCESSING,
        )
        self.session.add_all([refund, outbox_event])
        duplicate_response = await self._commit_refund(
            order_id=order.id,
            key=key,
        )
        if duplicate_response is not None:
            return duplicate_response

        await send_refund_job(str(outbox_event.id))
        return JSONResponse(
            status_code=202,
            content={
                "success": True,
                "message": "Refund request accepted",
                "status": "processing",
                "order_id": order.id,
                "idempotency_key": key,
            },
        )

    async def refund_logic(
        self,
        key: str,
        user_id: int,
        order_id: int,
    ) -> JSONResponse | dict:
        """Backward-compatible alias for the refund request use case."""
        return await self.request_refund(key, user_id, order_id)

    async def _handle_existing_request(
        self,
        existing_key: IdempotencyKey | None,
        key: str,
        user_id: int,
        order_id: int,
    ) -> JSONResponse | dict | None:
        if existing_key is None:
            return None

        if existing_key.response_body is not None:
            await create_audit_log(
                db=self.session,
                user_id=user_id,
                event="USER_REFUND_ORDER",
                status="SUCCESS",
            )
            response_body = json.loads(existing_key.response_body)
            response_body["message"] = "User refunded successfully"
            response_body["success"] = True
            return response_body

        existing_refund = await self._get_order_refund(order_id)
        if existing_refund is not None:
            return await self._existing_refund_response(
                refund=existing_refund,
                order_id=order_id,
                key=key,
            )

        return JSONResponse(
            status_code=202,
            content={
                "success": True,
                "status": "processing",
                "message": "might take a while to refund",
                "idempotency_key": key,
            },
        )

    async def _existing_refund_response(
        self,
        refund: Refund,
        order_id: int,
        key: str,
    ) -> JSONResponse:
        outbox_result = await self.session.execute(
            select(AuditOutbox).where(
                AuditOutbox.idempotency_key == f"order-refund:{order_id}"
            )
        )
        outbox_event = outbox_result.scalar_one_or_none()
        if (
            refund.status == RefundStatus.PROCESSING
            and outbox_event is not None
            and outbox_event.status in {"pending", "processing"}
        ):
            await send_refund_job(str(outbox_event.id))

        is_processing = refund.status == RefundStatus.PROCESSING
        return JSONResponse(
            status_code=202 if is_processing else 200,
            content={
                "success": refund.status != RefundStatus.FAILED,
                "status": refund.status.value,
                "message": (
                    "Refund request is being processed"
                    if is_processing
                    else "Refund request already exists"
                ),
                "order_id": order_id,
                "idempotency_key": key,
            },
        )

    async def _get_locked_order(self, order_id: int, user_id: int) -> Order:
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id, Order.user_id == user_id)
            .with_for_update()
        )
        order = result.scalar_one_or_none()
        if order is None:
            raise BadRequestException("Order not found")
        return order

    async def _get_order_refund(
        self,
        order_id: int,
        lock: bool = False,
    ) -> Refund | None:
        query = select(Refund).where(Refund.order_id == order_id)
        if lock:
            query = query.with_for_update()
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    def _validate_and_calculate_refund(order: Order) -> Decimal:
        if (
            order.status != OrderStatus.CONFIRMED
            or order.payment_status != PaymentStatus.PAID
        ):
            raise BadRequestException(
                "Only confirmed, paid orders can be refunded"
            )

        deadline = as_utc_datetime(order.created_at) + REFUND_WINDOW
        if datetime.now(timezone.utc) >= deadline:
            raise BadRequestException("The 30-day refund period has expired")
        if not order.payment_id:
            raise BadRequestException("Only paid orders can be refunded")

        return order.total * Decimal("0.80")

    @staticmethod
    def _create_refund_outbox_event(
        order: Order,
        refund_amount: Decimal,
        user_id: int,
    ) -> AuditOutbox:
        return AuditOutbox(
            organization_id=settings.WORKOS_ORGANIZATION_ID,
            event_type="ORDER_REFUND_REQUESTED",
            payload={
                "order_id": order.id,
                "refund_amount": str(refund_amount),
                "payment_id": order.payment_id,
                "user_id": user_id,
            },
            status="pending",
            idempotency_key=f"order-refund:{order.id}",
        )

    async def _commit_refund(
        self,
        order_id: int,
        key: str,
    ) -> JSONResponse | None:
        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            duplicate_refund = await self._get_order_refund(order_id)
            if duplicate_refund is None:
                raise
            return await self._existing_refund_response(
                refund=duplicate_refund,
                order_id=order_id,
                key=key,
            )
        return None
