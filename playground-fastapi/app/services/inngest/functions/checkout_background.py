from decimal import Decimal

import inngest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.order import Order
from app.models.user import User
from app.services.audit_service import create_audit_log
from app.services.inngest.client import inngest_client, logger


@inngest_client.create_function(
    fn_id="checkout-background-jobs",
    trigger=inngest.TriggerEvent(event="checkout/background.requested"),
    retries=3,
)
async def checkout_background_jobs(ctx: inngest.Context):
    """Post-checkout async tasks (invoice email, notifications, analytics)."""
    step = ctx.step
    data = ctx.event.data

    order_id = data["order_id"]
    user_id = data["user_id"]
    order_number = data["order_number"]
    payment_status = data["payment_status"]
    total = data["total"]

    async def build_invoice_context():
        logger.info("[inngest] checkout step 1: build invoice context order=%s", order_id)
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.id == order_id)
            )
            order = result.scalars().first()
            if order is None:
                raise ValueError(f"Order {order_id} not found")

            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalars().first()
            if user is None:
                raise ValueError(f"User {user_id} not found")

            items = [
                {
                    "name": item.product_name,
                    "qty": item.quantity,
                    "unit_price": str(item.unit_price),
                    "line_total": str(item.total_price),
                }
                for item in order.items
            ]

            return {
                "order_id": order.id,
                "order_number": order.order_number,
                "payment_status": order.payment_status.value,
                "to_email": user.email,
                "customer_name": (user.first_name or user.username or "Customer"),
                "items": items,
                "subtotal": str(order.subtotal),
                "tax": str(order.tax),
                "shipping_cost": str(order.shipping_cost),
                "total": str(order.total),
                "shipping_city": order.shipping_city,
                "shipping_country": order.shipping_country,
            }

    invoice_context = await step.run("checkout-build-invoice-context", build_invoice_context)

    async def send_invoice_email():
        try:
            import resend
            from resend.exceptions import ResendError
        except ModuleNotFoundError as exc:
            logger.warning(
                "[inngest] resend package not installed, skipping invoice email order=%s: %s",
                order_id,
                exc,
            )
            return {
                "email_sent": False,
                "reason": "resend_not_installed",
                "mode": "development",
                "error": str(exc),
            }

        logger.info("[inngest] checkout step 2: send invoice email order=%s", order_id)
        if payment_status != "paid":
            logger.info("[inngest] skip invoice email: payment not paid order=%s", order_id)
            return {"email_sent": False, "reason": "payment_not_paid"}

        resend.api_key = settings.RESEND_API_KEY

        item_rows = "".join(
            [
                (
                    "<tr>"
                    f"<td style='padding:8px;border-bottom:1px solid #eee'>{item['name']}</td>"
                    f"<td style='padding:8px;border-bottom:1px solid #eee'>{item['qty']}</td>"
                    f"<td style='padding:8px;border-bottom:1px solid #eee'>${item['unit_price']}</td>"
                    f"<td style='padding:8px;border-bottom:1px solid #eee'>${item['line_total']}</td>"
                    "</tr>"
                )
                for item in invoice_context["items"]
            ]
        )

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#222">
          <h2>Invoice - Order {invoice_context["order_number"]}</h2>
          <p>Hello {invoice_context["customer_name"]}, thanks for your order.</p>
          <p>Payment status: <b>{invoice_context["payment_status"]}</b></p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            <thead>
              <tr>
                <th align="left" style="padding:8px;border-bottom:2px solid #ddd">Product</th>
                <th align="left" style="padding:8px;border-bottom:2px solid #ddd">Qty</th>
                <th align="left" style="padding:8px;border-bottom:2px solid #ddd">Unit Price</th>
                <th align="left" style="padding:8px;border-bottom:2px solid #ddd">Line Total</th>
              </tr>
            </thead>
            <tbody>{item_rows}</tbody>
          </table>
          <div style="margin-top:16px">
            <p>Subtotal: <b>${invoice_context["subtotal"]}</b></p>
            <p>Tax: <b>${invoice_context["tax"]}</b></p>
            <p>Shipping: <b>${invoice_context["shipping_cost"]}</b></p>
            <p>Total: <b>${invoice_context["total"]}</b></p>
          </div>
          <p style="margin-top:18px;color:#666">Shipping: {invoice_context["shipping_city"] or "-"}, {invoice_context["shipping_country"] or "-"}</p>
        </div>
        """

        # Dev mode (no verified domain): use Resend test sender.
        # Prod mode: use a verified sender/domain.
        is_prod = settings.APP_ENV == "production"
        sender_email = "billing@yourdomain.com" if is_prod else "onboarding@resend.dev"
        recipient_email = invoice_context["to_email"]

        payload = {
            "from": sender_email,
            # "to": [recipient_email],
            # I hard coded it because the email is not verified yet.
            "to": "mohammadelsayed002@gmail.com",
            "subject": f"Your invoice - {invoice_context['order_number']}",
            "html": html,
        }
    

        try:
            response = resend.Emails.send(payload)
            return {
                "email_sent": True,
                "provider_response": response,
                "mode": "production" if is_prod else "development",
                "recipient_email": recipient_email,
            }
        except ResendError as exc:
            # In development we don't want checkout side-effects to fail the flow.
            if not is_prod:
                logger.warning("[inngest] dev email send failed: %s", exc)
                return {
                    "email_sent": False,
                    "reason": "dev_send_failed",
                    "mode": "development",
                    "error": str(exc),
                }
            raise

    email_result = await step.run("checkout-send-invoice-email", send_invoice_email)

    async def audit_email_result():
        await create_audit_log(
            db=None,
            event="CHECKOUT_INVOICE_EMAIL_SENT" if email_result.get("email_sent") else "CHECKOUT_INVOICE_EMAIL_SKIPPED",
            status="SUCCESS" if email_result.get("email_sent") else "FAILED",
            user_id=user_id,
            metadata={
                "order_id": order_id,
                "order_number": order_number,
                "payment_status": payment_status,
                "email_to": invoice_context.get("to_email"),
                "email_result": email_result,
                "event_total": str(total),
            },
        )
        return {"audited": True}

    await step.run("checkout-audit-email-result", audit_email_result)


    return {"status": "completed", "order_id": order_id, "invoice_context": invoice_context}
