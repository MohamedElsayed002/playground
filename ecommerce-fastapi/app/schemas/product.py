"""
Pydantic schemas for Categories and Products
"""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel , Field, field_validator
import re 

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1,max_length=100)
    description: str | None = None
    image_url: str | None = None
    parent_id: int | None = None

    @field_validator("name")
    @classmethod
    def generate_slug(cls, v:str) -> str:
        return v

class CategoryUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = None
    image_url: str | None = None
    parent_id: int | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str 
    slug: str 
    description: str | None
    image_url: str | None
    parent_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}

class CategoryWithChildren(CategoryResponse):
    """
        Includes nested children categories (for tree view)
    """
    children: list["CategoryResponse"] = []

# Product Image Schema

class ProductImageResponse(BaseModel):
    id: int 
    url: str 
    alt_text: str | None
    is_primary: bool 
    sort_order: int

    model_config = {"from_attributes": True}


# Product Schemas

class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    short_description: str | None = Field(None, max_length=500)
    price: Decimal = Field(gt=0, decimal_places=2)            # Must be positive
    compare_at_price: Decimal | None = Field(None, gt=0)
    stock_quantity: int = Field(default=0, ge=0)              # Must be >= 0
    sku: str | None = Field(None, max_length=100)
    category_id: int | None = None
    is_active: bool = True
    is_featured: bool = False


class ProductUpdate(BaseModel):
    """All fields optional for PATCH semantics."""
    name: str | None = Field(None, max_length=255)
    description: str | None = None
    short_description: str | None = None
    price: Decimal | None = Field(None, gt=0)
    compare_at_price: Decimal | None = None
    stock_quantity: int | None = Field(None, ge=0)
    sku: str | None = None
    category_id: int | None = None
    is_active: bool | None = None
    is_featured: bool | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    short_description: str | None
    price: Decimal
    compare_at_price: Decimal | None
    stock_quantity: int
    sku: str | None
    is_active: bool
    is_featured: bool
    category_id: int | None
    images: list[ProductImageResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}

class ProductListResponse(BaseModel):
    """Lightweight product card for listing pages."""
    id: int
    name: str
    slug: str
    price: Decimal
    compare_at_price: Decimal | None
    stock_quantity: int
    is_featured: bool
    images: list[ProductImageResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
