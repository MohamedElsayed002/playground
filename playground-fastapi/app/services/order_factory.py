from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from app.models.order import Order, OrderStatus, PaymentStatus
from app.schemas.order import OrderCheckoutCreate


def generate_order_number() -> str:
    date_stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = uuid4().hex[:6].upper()
    return f"ORD-{date_stamp}-{suffix}"


def create_pending_order(
    *,
    user_id: int,
    subtotal: Decimal,
    tax: Decimal = Decimal("0"),
    shipping_cost: Decimal = Decimal("0"),
    checkout_details: OrderCheckoutCreate | None = None,
) -> Order:
    return Order(
        order_number=generate_order_number(),
        user_id=user_id,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        subtotal=subtotal,
        tax=tax,
        shipping_cost=shipping_cost,
        total=subtotal + tax + shipping_cost,
        shipping_address_line1=(
            checkout_details.shipping_address_line1
            if checkout_details is not None
            else None
        ),
        shipping_address_line2=(
            checkout_details.shipping_address_line2
            if checkout_details is not None
            else None
        ),
        shipping_city=(
            checkout_details.shipping_city if checkout_details is not None else None
        ),
        shipping_country=(
            checkout_details.shipping_country if checkout_details is not None else None
        ),
        shipping_postal_code=(
            checkout_details.shipping_postal_code
            if checkout_details is not None
            else None
        ),
        notes=checkout_details.notes if checkout_details is not None else None,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
    )
