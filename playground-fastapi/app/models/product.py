"""
Product model with images (one-to-many) and category (many-to-one)

Demonstrates:
- NUMERIC column for prices (avoids floating-point rounding issues)
- One-to-many relation with ProductImage
- Many-to-one relationship with Category
"""

from decimal import Decimal
from sqlalchemy import String, Text, Numeric, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(280), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    short_description: Mapped[str | None] = mapped_column(String(500))

    # NUMERIC(10,2) stores exact decimals - critical for money values
    # Never use FLOAT prices
    price: Mapped[Decimal] = mapped_column(Numeric(10,2), nullable=False)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(10,2))

    # Inventory
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100), unique=True)

    # Visibility 
    is_active: Mapped[bool] = mapped_column(Boolean, default=True,nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Soft-delete flag 
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    category: Mapped["Category | None"] = relationship(
        "Category", back_populates="products", lazy="selectin"
    )

    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage", back_populates="product",
        lazy="selectin", cascade="all, delete-orphan"
    )

    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="product", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name} price={self.price}>"


class ProductImage(Base):
    """
        Product images - one product can have multiple images
        NestJS equivalent -> a separate @Entity() for ProductImage with @ManyToOne(Product)
    """

    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )

    product: Mapped["Product"] = relationship("Product", back_populates="images")