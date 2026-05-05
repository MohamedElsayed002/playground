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
