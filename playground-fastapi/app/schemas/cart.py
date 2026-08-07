from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.product import ProductResponse


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemResponse(BaseModel):
    id: int
    quantity: int
    product: ProductResponse

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: list[CartItemResponse] = Field(default_factory=list)
    subtotal: Decimal | None = None

    model_config = {"from_attributes": True}
