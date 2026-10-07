from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from app.models.idempotency import IdempotencyKey
from app.models.order import Order

from app.exceptions.handlers import BadRequestException
from app.services.audit_service import create_audit_log


from app.core.config import settings
import json 
from fastapi.responses import JSONResponse
from app.models.order import PaymentStatus, OrderStatus
from app.models.refund import Refund, RefundStatus
from app.models.audit_outbox import AuditOutbox
from app.services.inngest.dispatch import send_refund_job
from datetime import datetime, timedelta, timezone

from decimal import Decimal


REFUND_WINDOW = timedelta(days=30)

def _as_utc(value: datetime) -> datetime:
    """Treat naive database timestamps as UTC for consistent deadline checks."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class RefundService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _existing_refund_response(
        self,
        *,
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
                "message": "Refund request is being processed" if is_processing else "Refund request already exists",
                "order_id": order_id,
                "idempotency_key": key,
            },
        )

    

    # Refund Logic 
    async def refund_logic(
        self,
        key: str,
        user_id: int,
        order_id: int
    ):

        request_path = f"/orders/refund/{order_id}"

        # Idempotency key validation  
        result = await self.session.execute(
            select(IdempotencyKey).where(
                IdempotencyKey.key == key,
                IdempotencyKey.user_id == user_id,
                IdempotencyKey.request_path == request_path
            )
        )

        existing = result.scalar_one_or_none()

        if existing and existing.response_body is not None:
            await create_audit_log(
                db=self.session,
                user_id=user_id,
                event="USER_REFUND_ORDER",
                status="SUCCESS"
            )

            response_body = json.loads(existing.response_body)
            response_body["message"] = "User refunded successfully"
            response_body["success"] = True
            return response_body

        if existing is not None:
            refund_result = await self.session.execute(
                select(Refund).where(Refund.order_id == order_id)
            )
            existing_refund = refund_result.scalar_one_or_none()
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
                    "idempotency_key": key
                }
            )

        if existing is None:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.IDEMPOTENCY_KEY_TTL_HOURS)

            new_key = IdempotencyKey(
                key=key,
                user_id=user_id,
                request_path=request_path,
                expires_at=expires_at
            )

            self.session.add(new_key)
            await self.session.flush()
        
        # Lock the order so requests with different API idempotency keys serialize.
        order_exist = await self.session.execute(
            select(Order)
            .where(
                Order.id == order_id,
                Order.user_id == user_id,
            )
            .with_for_update()
        )

        order = order_exist.scalar_one_or_none()

        if not order:
            raise BadRequestException("Order not found")

        # The order-level unique constraint is the final guard; this lookup
        # returns the already-created refund for later requests with new keys.
        refund_result = await self.session.execute(
            select(Refund)
            .where(Refund.order_id == order.id)
            .with_for_update()
        )
        existing_refund = refund_result.scalar_one_or_none()
        if existing_refund is not None:
            return await self._existing_refund_response(
                refund=existing_refund,
                order_id=order.id,
                key=key,
            )

        if order.status != OrderStatus.CONFIRMED or order.payment_status != PaymentStatus.PAID:
            raise BadRequestException("Only confirmed, paid orders can be refunded")

        # Refund Policy
        #   - < 30 days? 
        #   - refundable?
        #   - Calculate 80% 
        now = datetime.now(timezone.utc)
        deadline = _as_utc(order.created_at) + REFUND_WINDOW

        if now >= deadline:
            raise BadRequestException("The 30-day refund period has expired")
        if order.payment_status != PaymentStatus.PAID or not order.payment_id:
            raise BadRequestException("Only paid orders can be refunded")

        order_after_dedact = order.total * Decimal("0.80")
        refund = Refund(
            order_id=order.id,
            amount=order_after_dedact,
            status=RefundStatus.PROCESSING,
        )
        outbox_event = AuditOutbox(
            organization_id=settings.WORKOS_ORGANIZATION_ID,
            event_type="ORDER_REFUND_REQUESTED",
            payload={
                "order_id": order.id,
                "refund_amount": str(order_after_dedact),
                "payment_id": order.payment_id,
                "user_id": user_id,
            },
            status="pending",
            idempotency_key=f"order-refund:{order.id}",
        )

        self.session.add_all([refund, outbox_event])
        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            # The row lock serializes normal requests. The unique constraint is
            # still the final guard if the database/driver races the insert.
            await self.session.rollback()
            duplicate_result = await self.session.execute(
                select(Refund).where(Refund.order_id == order.id)
            )
            duplicate_refund = duplicate_result.scalar_one_or_none()
            if duplicate_refund is None:
                raise
            return await self._existing_refund_response(
                refund=duplicate_refund,
                order_id=order.id,
                key=key,
            )
        await send_refund_job(str(outbox_event.id))

        response = {
            "success": True,
            "message": "Refund request accepted",
            "status": "processing",
            "order_id": order.id,
            # "order_number": order.order_number,
            # "user_id": order.user_id,
            # "payment_status": order.payment_status.value,
            # "total": str(order.total),
            # "total_after_20": str(order_after_dedact),
            # "deadline": deadline.isoformat(),
            "idempotency_key": key,
        }
        return JSONResponse(status_code=202, content=response)
