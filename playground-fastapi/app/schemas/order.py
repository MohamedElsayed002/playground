from datetime import datetime
from decimal import Decimal 
from pydantic import BaseModel, Field

from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    """
        A single line item when placing an order
    """
    product_id: int 
    quantity: int = Field(gt=0)


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
    items: list[OrderItemCreate] = Field(min_length=1)
    shipping_address_line1: str | None = None
    shipping_address_line2: str | None = None
    shipping_city: str | None = None
    shipping_country: str | None = None
    shipping_postal_code: str | None = None
    notes: str | None = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    payment_status: PaymentStatus | None = None


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
