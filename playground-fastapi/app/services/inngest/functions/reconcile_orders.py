import asyncio
from datetime import datetime, timezone

import inngest
import stripe
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.flash_sale import FlashSale, FlashSalePurchase, PurchaseStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.product import Product
from app.services.inngest.client import inngest_client, logger
from app.services.inngest.dispatch import send_order_payment_succeeded_job


@inngest_client.create_function(
    fn_id="reconcile-expired-pending-orders",
    trigger=inngest.TriggerCron(cron="*/5 * * * *"),
    retries=3,
)
async def reconcile_expired_pending_orders(ctx: inngest.Context):
    
    """
    Reconcile expired pending orders with Stripe and release safe reservations.
    """

    async def find_candidates():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Order.id)
                .where(
                    Order.status == OrderStatus.PENDING,
                    Order.payment_status == PaymentStatus.PENDING,
                    Order.expires_at <= datetime.now(timezone.utc),
                )
                .order_by(Order.expires_at, Order.id)
                .limit(100)
            )
            return list(result.scalars().all())

    order_ids = await ctx.step.run("find-expired-pending-orders", find_candidates)
    
    reconciled = 0
    paid = 0
    expired = 0
    still_pending = 0

    for order_id in order_ids:
        async def retrieve_stripe_state(order_id=order_id):
            if not settings.STRIPE_SECRET_KEY:
                raise ValueError("STRIPE_SECRET_KEY is not configured")

            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Order.payment_id).where(Order.id == order_id)
                )
                payment_id = result.scalar_one_or_none()
                if not payment_id:
                    purchase_result = await db.execute(
                        select(FlashSalePurchase.payment_id)
                        .where(FlashSalePurchase.order_id == order_id)
                        .where(FlashSalePurchase.payment_id.is_not(None))
                        .limit(1)
                    )
                    payment_id = purchase_result.scalar_one_or_none()

            if not payment_id:
                return {"stripe_status": "missing_payment_intent"}

            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = await asyncio.to_thread(stripe.PaymentIntent.retrieve, payment_id)
            if intent.status in {"succeeded", "canceled", "processing"}:
                return {"stripe_status": intent.status}

            # Stop any still-confirmable payment before releasing reserved inventory.
            # If Stripe reports a race, retrieve again and trust the resulting state.
            try:
                intent = await asyncio.to_thread(stripe.PaymentIntent.cancel, payment_id)
            except stripe.error.StripeError:
                intent = await asyncio.to_thread(stripe.PaymentIntent.retrieve, payment_id)
            return {"stripe_status": intent.status}

        stripe_state = await ctx.step.run(
            f"reconcile-order-{order_id}-stripe-state", retrieve_stripe_state
        )

        async def apply_reconciled_state(order_id=order_id, stripe_state=stripe_state):
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Order)
                    .options(selectinload(Order.items))
                    .where(Order.id == order_id)
                    .with_for_update()
                )
                order = result.scalar_one_or_none()
                if order is None:
                    return {"result": "missing"}

                if (
                    order.status != OrderStatus.PENDING
                    or order.payment_status != PaymentStatus.PENDING
                ):
                    return {
                        "result": "already_handled",
                        "paid": order.payment_status == PaymentStatus.PAID,
                    }

                if stripe_state["stripe_status"] == "succeeded":
                    order.payment_status = PaymentStatus.PAID
                    order.status = OrderStatus.CONFIRMED
                    purchase_result = await db.execute(
                        select(FlashSalePurchase)
                        .where(FlashSalePurchase.order_id == order.id)
                        .with_for_update()
                    )
                    for purchase in purchase_result.scalars():
                        if purchase.status == PurchaseStatus.PROCESSING:
                            purchase.status = PurchaseStatus.COMPLETED
                    await db.commit()
                    return {"result": "paid", "dispatch_paid_event": True}

                if stripe_state["stripe_status"] not in {
                    "canceled",
                    "missing_payment_intent",
                }:
                    await db.rollback()
                    return {"result": "still_pending"}

                if order.expires_at > datetime.now(timezone.utc):
                    await db.rollback()
                    return {"result": "not_expired"}

                # The order row lock and pending-state check make this release
                # idempotent with webhook handling and overlapping cron runs.
                for item in order.items:
                    if item.product_id is not None:
                        product_result = await db.execute(
                            select(Product)
                            .where(Product.id == item.product_id)
                            .with_for_update()
                        )
                        product = product_result.scalar_one_or_none()
                        if product is not None:
                            product.stock_quantity += item.quantity

                    if item.flash_sale_id is not None and item.flash_sale_quantity > 0:
                        sale_result = await db.execute(
                            select(FlashSale)
                            .where(FlashSale.id == item.flash_sale_id)
                            .with_for_update()
                        )
                        sale = sale_result.scalar_one_or_none()
                        if sale is not None:
                            sale.remaining_quantity = min(
                                sale.sale_quantity,
                                sale.remaining_quantity + item.flash_sale_quantity,
                            )

                purchase_result = await db.execute(
                    select(FlashSalePurchase)
                    .where(FlashSalePurchase.order_id == order.id)
                    .with_for_update()
                )
                for purchase in purchase_result.scalars():
                    if purchase.status == PurchaseStatus.PROCESSING:
                        purchase.status = PurchaseStatus.FAILED

                order.status = OrderStatus.EXPIRED
                order.payment_status = PaymentStatus.EXPIRED
                await db.commit()
                return {"result": "expired"}

        applied = await ctx.step.run(
            f"reconcile-order-{order_id}-apply-state", apply_reconciled_state
        )
        reconciled += 1
        if applied.get("result") == "expired":
            expired += 1
        elif applied.get("result") == "still_pending":
            still_pending += 1
        elif applied.get("result") == "paid" or applied.get("paid"):
            paid += 1
            async def dispatch_paid_event(order_id=order_id):
                await send_order_payment_succeeded_job(
                    order_id=order_id,
                    stripe_event_id="reconciliation",
                )
                return {"dispatched": True}

            await ctx.step.run(
                f"reconcile-order-{order_id}-dispatch-paid-event", dispatch_paid_event
            )

    return {
        "checked": reconciled,
        "paid": paid,
        "expired": expired,
        "still_pending": still_pending,
    }
