from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CreateFlashSale(BaseModel):
    product_id: int = Field(gt=0)
    starts_at: datetime
    ends_at: datetime
    discount_percentage: int = Field(ge=1, le=100)
    sale_quantity: int = Field(gt=0)

    @model_validator(mode="after")
    def validate_time_window(self) -> "CreateFlashSale":
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be later than starts_at")
        return self


class FlashSaleResponse(BaseModel):
    id: int
    product_id: int
    starts_at: datetime
    ends_at: datetime
    discount_percentage: int
    sale_quantity: int
    remaining_quantity: int
    status: str

    model_config = ConfigDict(from_attributes=True)
