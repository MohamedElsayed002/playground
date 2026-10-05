from decimal import Decimal

import inngest
import stripe
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import httpx

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.user import User
from app.services.audit_service import create_audit_log
from app.services.inngest.client import inngest_client, logger

@inngest_client.create_function(
    fn_id="checkout-create-payment-intent",
    trigger=inngest.TriggerEvent(event="checkout/background.requested"),
    retries=3,
)
async def checkout_background_jobs(ctx: inngest.Context):
    """Create and persist an order's PaymentIntent; webhook settles the order."""
    data = ctx.event.data
    order_id = int(data["order_id"])
    user_id = int(data["user_id"])

    async def create_payment_intent():
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("STRIPE_SECRET_KEY is not configured")

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Order).where(Order.id == order_id).with_for_update()
            )
            order = result.scalar_one_or_none()
            if order is None:
                raise ValueError(f"Order {order_id} not found")
            if order.status != OrderStatus.PENDING:
                return {"status": "order_not_pending", "order_id": order_id}
            if order.payment_id:
                return {"status": "ready", "payment_id": order.payment_id}
            total = order.total

        intent = stripe.PaymentIntent.create(
            amount=int(Decimal(total) * 100),
            currency="usd",
            automatic_payment_methods={"enabled": True},
            metadata={"order_id": str(order_id), "user_id": str(user_id)},
            idempotency_key=f"order:{order_id}",
        )

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Order).where(Order.id == order_id).with_for_update()
            )
            order = result.scalar_one_or_none()
            if order is None:
                stripe.PaymentIntent.cancel(intent.id)
                raise ValueError(f"Order {order_id} not found after creating PaymentIntent")
            if order.status != OrderStatus.PENDING:
                stripe.PaymentIntent.cancel(intent.id)
                return {"status": "order_not_pending", "order_id": order_id}

            order.payment_id = intent.id
            order.stripe_secret_key = intent.client_secret
            await db.commit()

        return {"status": "ready", "payment_id": intent.id}

    result = await ctx.step.run("create-stripe-payment-intent", create_payment_intent)
    return {"order_id": order_id, **result}


@inngest_client.create_function(
    fn_id="checkout-send-paid-invoice",
    trigger=inngest.TriggerEvent(event="order/payment.succeeded"),
    retries=3,
)
async def send_paid_order_invoice(ctx: inngest.Context):
    """Send and audit the invoice only after the webhook commits payment success."""
    order_id = int(ctx.event.data["order_id"])

    async def build_invoice_context():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == order_id)
            )
            order = result.scalar_one_or_none()
            if order is None:
                raise ValueError(f"Order {order_id} not found")
            if (
                order.payment_status != PaymentStatus.PAID
                or order.status not in {OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
                                        OrderStatus.SHIPPED, OrderStatus.DELIVERED}
            ):
                return {"eligible": False, "order_id": order_id}

            user_result = await db.execute(select(User).where(User.id == order.user_id))
            user = user_result.scalar_one_or_none()
            if user is None:
                raise ValueError(f"User {order.user_id} not found")

            return {
                "eligible": True,
                "order_id": order.id,
                "order_number": order.order_number,
                "user_id": order.user_id,
                "to_email": user.email,
                "customer_name": user.first_name or user.username or "Customer",
                "items": [
                    {
                        "name": item.product_name,
                        "qty": item.quantity,
                        "unit_price": str(item.unit_price),
                        "line_total": str(item.total_price),
                    }
                    for item in order.items
                ],
                "subtotal": str(order.subtotal),
                "tax": str(order.tax),
                "shipping_cost": str(order.shipping_cost),
                "total": str(order.total),
                "shipping_city": order.shipping_city,
                "shipping_country": order.shipping_country,
            }

    invoice = await ctx.step.run("checkout-build-paid-invoice-context", build_invoice_context)
    if not invoice.get("eligible"):
        return {"status": "skipped_order_not_paid", "order_id": order_id}

    async def send_invoice_email():
        try:
            import resend
            from resend.exceptions import ResendError
        except ModuleNotFoundError as exc:
            logger.warning("[inngest] resend unavailable; invoice skipped for order=%s", order_id)
            return {"email_sent": False, "reason": "resend_not_installed", "error": str(exc)}

        resend.api_key = settings.RESEND_API_KEY
        item_rows = "".join(
            f"<tr><td>{item['name']}</td><td>{item['qty']}</td>"
            f"<td>${item['unit_price']}</td><td>${item['line_total']}</td></tr>"
            for item in invoice["items"]
        )
        html = (
            f"<h2>Invoice - Order {invoice['order_number']}</h2>"
            f"<p>Hello {invoice['customer_name']}, thanks for your order.</p>"
            "<table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th>"
            f"<th>Total</th></tr></thead><tbody>{item_rows}</tbody></table>"
            f"<p>Subtotal: ${invoice['subtotal']}</p><p>Tax: ${invoice['tax']}</p>"
            f"<p>Shipping: ${invoice['shipping_cost']}</p><p>Total: ${invoice['total']}</p>"
        )
        sender = "mohammadelsayed002@gmail.com"

        try:
            response = resend.Emails.send({
                "from": sender,
                "to": invoice["to_email"],
                "subject": f"Your invoice - {invoice['order_number']}",
                "html": html,
            })
            return {"email_sent": True, "provider_response": response}
        except ResendError as exc:
            if settings.APP_ENV != "production":
                logger.warning("[inngest] development invoice email failed: %s", exc)
                return {"email_sent": False, "reason": "dev_send_failed", "error": str(exc)}
            raise

    email_result = await ctx.step.run("checkout-send-paid-invoice-email", send_invoice_email)

    async def send_order_to_discord():

        items = "\n".join(
            f"- {item['name']} x {item['qty']} - ${item['line_total']}"
            for item in invoice["items"]
        )
        embed = {
            "title": f"Paid order {invoice['order_number']}",
            "description": items or "No line items",
            "color": 0x2ECC71,
            "fields": [
                {"name": "Customer", "value": invoice["customer_name"], "inline": True},
                {"name": "Email", "value": invoice["to_email"], "inline": True},
                {"name": "Subtotal", "value": f"${invoice['subtotal']}", "inline": True},
                {"name": "Tax", "value": f"${invoice['tax']}", "inline": True},
                {"name": "Shipping", "value": f"${invoice['shipping_cost']}", "inline": True},
                {"name": "Total", "value": f"${invoice['total']}", "inline": True},
                {
                    "name": "Ship to",
                    "value": ", ".join(
                        part for part in (invoice["shipping_city"], invoice["shipping_country"])
                        if part
                    ) or "Not provided",
                    "inline": True,
                },
            ],
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.DISCORD_ORDER_WEBHOOK_URL,
                json={"embeds": [embed]},
            )
            response.raise_for_status()
        return {"discord_sent": True}

    discord_result = await ctx.step.run(
        "checkout-send-paid-order-to-discord", send_order_to_discord
    )

    async def audit_email_result():
        await create_audit_log(
            db=None,
            event="CHECKOUT_INVOICE_EMAIL_SENT" if email_result.get("email_sent") else "CHECKOUT_INVOICE_EMAIL_SKIPPED",
            status="SUCCESS" if email_result.get("email_sent") else "FAILED",
            user_id=invoice["user_id"],
            metadata={
                "order_id": order_id,
                "order_number": invoice["order_number"],
                "email_to": invoice["to_email"],
                "email_result": email_result,
            },
        )
        return {"audited": True}

    await ctx.step.run("checkout-audit-paid-invoice-email", audit_email_result)
    return {
        "status": "completed",
        "order_id": order_id,
        "email_result": email_result,
        "discord_result": discord_result,
    }
