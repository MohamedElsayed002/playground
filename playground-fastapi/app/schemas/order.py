from datetime import datetime
from decimal import Decimal 
from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated

from app.models.order import OrderStatus, PaymentStatus

AddressLine = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=250),
]
CityName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
]
CountryName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
]
PostalCode = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=32),
]
OrderNotes = Annotated[str, StringConstraints(max_length=2000)]


class OrderItemCreate(BaseModel):
    """
        A single line item when placing an order
    """
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=100)


class OrderItemResponse(BaseModel):
    id: int 
    product_id: int | None
    product_name: str 
    quantity: int 
    unit_price: Decimal 
    total_price: Decimal

    model_config = {"from_attributes": True}



# Order Schemas
class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1,max_length=50)
    shipping_address_line1: AddressLine | None = None
    shipping_address_line2: AddressLine | None = None
    shipping_city: CityName | None = None
    shipping_country: CountryName | None = None
    shipping_postal_code: PostalCode | None = None
    notes: OrderNotes | None = None


class OrderCheckoutCreate(BaseModel):
    """
    Checkout payload for cart-based orders.
    Items come from the user's cart, not the request body.
    """
    shipping_address_line1: AddressLine | None = None
    shipping_address_line2: AddressLine | None = None
    shipping_city: CityName | None = None
    shipping_country: CountryName | None = None
    shipping_postal_code: PostalCode | None = None
    notes: OrderNotes | None = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    payment_status: PaymentStatus | None = None


class OrderPaymentStatusResponse(BaseModel):
    order_id: int
    order_status: OrderStatus
    payment_status: PaymentStatus
    payment_ready: bool
    stripe_client_secret: str | None = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: Decimal
    shipping_cost: Decimal
    tax: Decimal
    total: Decimal
    shipping_address_line1: str | None
    shipping_address_line2: str | None
    shipping_city: str | None
    shipping_country: str | None
    shipping_postal_code: str | None
    notes: str | None
    user_id: int
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
