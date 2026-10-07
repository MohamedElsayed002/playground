import asyncio
from decimal import Decimal
from uuid import UUID

import inngest
import stripe
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.audit_outbox import AuditOutbox
from app.models.order import Order
from app.models.refund import Refund, RefundStatus
from app.services.inngest.client import inngest_client
from app.services.refund.refund_state import apply_stripe_refund_state


@inngest_client.create_function(
    fn_id="process-order-refund",
    trigger=inngest.TriggerEvent(event="order/refund.requested"),
    retries=3,
)
async def process_order_refund(ctx: inngest.Context):
    outbox_id = UUID(ctx.event.data["outbox_id"])

    async def load_refund_context():
        async with AsyncSessionLocal() as db:
            outbox_result = await db.execute(
                select(AuditOutbox)
                .where(AuditOutbox.id == outbox_id)
                .with_for_update()
            )
            outbox_event = outbox_result.scalar_one_or_none()
            if outbox_event is None:
                raise ValueError(f"Refund outbox event {outbox_id} not found")
            if outbox_event.status == "processed":
                return {"already_processed": True}

            order_id = int(outbox_event.payload["order_id"])
            refund_result = await db.execute(
                select(Refund).where(Refund.order_id == order_id).with_for_update()
            )
            refund = refund_result.scalar_one_or_none()
            order_result = await db.execute(
                select(Order).where(Order.id == order_id).with_for_update()
            )
            order = order_result.scalar_one_or_none()
            if refund is None or order is None:
                raise ValueError(f"Refund or order {order_id} not found")
            if refund.status == RefundStatus.REFUNDED:
                return {"already_refunded": True, "refund_id": refund.stripe_refund_id}
            if refund.status != RefundStatus.PROCESSING:
                raise ValueError(f"Refund {refund.id} is not processing")
            if not order.payment_id:
                raise ValueError(f"Order {order_id} has no payment intent")

            return {
                "already_processed": False,
                "already_refunded": False,
                "refund_id": refund.id,
                "order_id": order.id,
                "payment_id": order.payment_id,
                "amount": str(refund.amount),
            }

    context = await ctx.step.run("load-refund-context", load_refund_context)
    if context.get("already_processed"):
        return {"status": "already_processed", "outbox_id": str(outbox_id)}

    if context.get("already_refunded"):
        stripe_refund_id = context.get("refund_id")
        stripe_status = "succeeded"
        failure_reason = None
    else:
        async def create_stripe_refund():
            if not settings.STRIPE_SECRET_KEY:
                raise ValueError("STRIPE_SECRET_KEY is not configured")
            stripe.api_key = settings.STRIPE_SECRET_KEY
            refund = await asyncio.to_thread(
                stripe.Refund.create,
                payment_intent=context["payment_id"],
                amount=int(Decimal(context["amount"]) * 100),
                reason="requested_by_customer",
                idempotency_key=f"order-refund:{context['order_id']}",
            )
            return {
                "stripe_refund_id": refund.id,
                "stripe_status": refund.status,
                "failure_reason": getattr(refund, "failure_reason", None),
            }

        stripe_result = await ctx.step.run("create-stripe-refund", create_stripe_refund)
        stripe_refund_id = stripe_result["stripe_refund_id"]
        stripe_status = stripe_result["stripe_status"]
        failure_reason = stripe_result.get("failure_reason")

    async def mark_refund_complete():
        async with AsyncSessionLocal() as db:
            outbox_result = await db.execute(
                select(AuditOutbox)
                .where(AuditOutbox.id == outbox_id)
                .with_for_update()
            )
            outbox_event = outbox_result.scalar_one_or_none()
            if outbox_event is None:
                raise ValueError(f"Refund outbox event {outbox_id} not found")
            if outbox_event.status == "processed":
                return {"status": "already_processed"}

            refund_result = await db.execute(
                select(Refund)
                .where(Refund.order_id == outbox_event.payload["order_id"])
                .with_for_update()
            )
            refund = refund_result.scalar_one_or_none()
            if refund is None:
                raise ValueError(f"Refund for order {outbox_event.payload['order_id']} not found")
            order_result = await db.execute(
                select(Order)
                .where(Order.id == outbox_event.payload["order_id"])
                .with_for_update()
            )
            order = order_result.scalar_one_or_none()
            if order is None:
                raise ValueError(f"Order {outbox_event.payload['order_id']} not found")

            state = apply_stripe_refund_state(
                refund=refund,
                order=order,
                outbox_event=outbox_event,
                stripe_refund_id=stripe_refund_id,
                stripe_status=stripe_status,
                failure_reason=failure_reason,
            )
            await db.commit()
            return {"status": state, "stripe_refund_id": stripe_refund_id}

    result = await ctx.step.run("mark-refund-complete", mark_refund_complete)
    return {"outbox_id": str(outbox_id), **result}
