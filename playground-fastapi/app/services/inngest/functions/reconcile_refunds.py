import asyncio
from uuid import uuid4

import inngest
import stripe
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.audit_outbox import AuditOutbox
from app.models.order import Order
from app.models.refund import Refund, RefundStatus
from app.services.inngest.client import inngest_client, logger
from app.services.inngest.dispatch import send_refund_job
from app.services.refund.refund_state import apply_stripe_refund_state


@inngest_client.create_function(
    fn_id="reconcile-order-refunds",
    trigger=inngest.TriggerCron(cron="*/5 * * * *"),
    retries=3,
)
async def reconcile_order_refunds(ctx: inngest.Context):
    """Recheck pending Stripe refunds and redispatch requests lacking a Stripe ID."""

    async def find_pending_refunds():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Refund.id, Refund.order_id, Refund.stripe_refund_id)
                .where(Refund.status == RefundStatus.PROCESSING)
                .order_by(Refund.created_at, Refund.id)
                .limit(100)
            )
            return [
                {
                    "refund_id": refund_id,
                    "order_id": order_id,
                    "stripe_refund_id": stripe_refund_id,
                }
                for refund_id, order_id, stripe_refund_id in result.all()
            ]

    candidates = await ctx.step.run("find-pending-refunds", find_pending_refunds)
    succeeded = failed = pending = deferred = redispatched = 0

    for candidate in candidates:
        refund_id = candidate["refund_id"]
        order_id = candidate["order_id"]
        stripe_refund_id = candidate["stripe_refund_id"]

        if not stripe_refund_id:
            async def redispatch_missing_stripe_id(order_id=order_id):
                async with AsyncSessionLocal() as db:
                    result = await db.execute(
                        select(AuditOutbox).where(
                            AuditOutbox.idempotency_key == f"order-refund:{order_id}"
                        )
                    )
                    outbox_event = result.scalar_one_or_none()
                    if outbox_event is None or outbox_event.status in {"processed", "failed"}:
                        return {"redispatched": False}

                    # A fresh event ID lets recovery run after an earlier Inngest
                    # execution exhausted retries. Stripe's stable idempotency key
                    # prevents this from creating a second refund.
                    await send_refund_job(
                        str(outbox_event.id),
                        event_id=f"refund-reconcile-{outbox_event.id}-{uuid4()}",
                    )
                    return {"redispatched": True}

            result = await ctx.step.run(
                f"redispatch-refund-{refund_id}", redispatch_missing_stripe_id
            )
            redispatched += int(result["redispatched"])
            continue

        async def retrieve_stripe_refund(stripe_refund_id=stripe_refund_id):
            if not settings.STRIPE_SECRET_KEY:
                raise ValueError("STRIPE_SECRET_KEY is not configured")
            stripe.api_key = settings.STRIPE_SECRET_KEY
            try:
                stripe_refund = await asyncio.to_thread(
                    stripe.Refund.retrieve, stripe_refund_id
                )
            except stripe.error.StripeError as exc:
                # This is a lookup/transport/API failure, not a Stripe refund
                # outcome. Keep local rows untouched so the next run retries.
                logger.warning(
                    "Could not retrieve Stripe refund %s during reconciliation: %s",
                    stripe_refund_id,
                    exc,
                )
                return {"unavailable": True}

            return {
                "unavailable": False,
                "stripe_refund_id": stripe_refund.id,
                "stripe_status": stripe_refund.status,
                "failure_reason": getattr(stripe_refund, "failure_reason", None),
            }

        stripe_state = await ctx.step.run(
            f"retrieve-refund-{refund_id}-stripe-state", retrieve_stripe_refund
        )
        if stripe_state["unavailable"]:
            deferred += 1
            continue

        async def apply_stripe_state(
            refund_id=refund_id,
            order_id=order_id,
            stripe_state=stripe_state,
        ):
            async with AsyncSessionLocal() as db:
                refund_result = await db.execute(
                    select(Refund).where(Refund.id == refund_id).with_for_update()
                )
                refund = refund_result.scalar_one_or_none()
                if refund is None or refund.status != RefundStatus.PROCESSING:
                    return {"status": "already_handled"}

                outbox_result = await db.execute(
                    select(AuditOutbox)
                    .where(AuditOutbox.idempotency_key == f"order-refund:{order_id}")
                    .with_for_update()
                )
                outbox_event = outbox_result.scalar_one_or_none()
                order_result = await db.execute(
                    select(Order).where(Order.id == order_id).with_for_update()
                )
                order = order_result.scalar_one_or_none()
                if outbox_event is None or order is None:
                    raise ValueError(f"Refund records for order {order_id} are incomplete")

                state = apply_stripe_refund_state(
                    refund=refund,
                    order=order,
                    outbox_event=outbox_event,
                    stripe_refund_id=stripe_state["stripe_refund_id"],
                    stripe_status=stripe_state["stripe_status"],
                    failure_reason=stripe_state.get("failure_reason"),
                )
                await db.commit()
                return {"status": state}

        applied = await ctx.step.run(
            f"apply-refund-{refund_id}-stripe-state", apply_stripe_state
        )
        if applied["status"] == "refunded":
            succeeded += 1
        elif applied["status"] == "failed":
            failed += 1
        else:
            pending += 1

    return {
        "checked": len(candidates),
        "succeeded": succeeded,
        "failed": failed,
        "still_pending": pending,
        "deferred_stripe_errors": deferred,
        "redispatched_without_stripe_id": redispatched,
    }
