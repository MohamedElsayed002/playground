from decimal import Decimal

import inngest

from app.services.inngest.client import inngest_client


async def send_checkout_background_jobs(
    order_id: int,
    user_id: int,
    order_number: str,
    payment_status: str,
    total: str | Decimal,
) -> None:
    await inngest_client.send(
        inngest.Event(
            name="checkout/background.requested",
            data={
                "order_id": order_id,
                "user_id": user_id,
                "order_number": order_number,
                "payment_status": payment_status,
                "total": str(total),
            },
        )
    )


async def send_flash_sale_payment_job(
    flash_sale_purchase_id: int,
) -> None:
    await inngest_client.send(
        inngest.Event(
            name="flash-sale/payment.requested",
            data={
                "flash_sale_purchase_id": flash_sale_purchase_id,
            },
        )
    )


async def send_order_payment_succeeded_job(
    order_id: int,
    stripe_event_id: str,
) -> None:
    await inngest_client.send(
        inngest.Event(
            id=f"order-payment-succeeded-{order_id}",
            name="order/payment.succeeded",
            data={"order_id": order_id, "stripe_event_id": stripe_event_id},
        )
    )
