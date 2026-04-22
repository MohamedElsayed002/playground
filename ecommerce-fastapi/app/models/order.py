"""
app/models/order.py
───────────────────
Order and OrderItem models.

Demonstrates a many-to-many-like relationship between Order and Product
via the OrderItem join table — this is the standard e-commerce pattern.

Order (1) ──< OrderItem (N) >── Product (1)
"""

from decimal import Decimal
import enum

from sqlalchemy import String, Numeric, Integer, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    """Order lifecycle states."""
    PENDING = "pending"           # Just placed, payment not confirmed
    CONFIRMED = "confirmed"       # Payment confirmed
    PROCESSING = "processing"     # Being packed
    SHIPPED = "shipped"           # Out for delivery
    DELIVERED = "delivered"       # Successfully delivered
    CANCELLED = "cancelled"       # Cancelled by user or admin
    REFUNDED = "refunded"         # Money returned


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Human-readable order reference (e.g., "ORD-20240101-0042")
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Status enums
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False
    )

    # Price snapshot at order time (prices can change later!)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Shipping address (JSON-like denormalized — avoids complex address normalization)
    shipping_address_line1: Mapped[str | None] = mapped_column(String(255))
    shipping_address_line2: Mapped[str | None] = mapped_column(String(255))
    shipping_city: Mapped[str | None] = mapped_column(String(100))
    shipping_country: Mapped[str | None] = mapped_column(String(100))
    shipping_postal_code: Mapped[str | None] = mapped_column(String(20))

    notes: Mapped[str | None] = mapped_column(Text)  # Customer notes

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship(  # type: ignore # noqa: F821
        "User", back_populates="orders", lazy="selectin"
    )
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order",
        lazy="selectin", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} number={self.order_number} status={self.status}>"


class OrderItem(Base):
    """
    A single line item in an order.
    We SNAPSHOT the price at purchase time — if the product price changes
    later, the order history remains accurate.
    """
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    # Price snapshot — critical to store what the customer actually paid
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Product name snapshot too (product might be deleted later)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product | None"] = relationship(  # type: ignore # noqa: F821
        "Product", back_populates="order_items", lazy="selectin"
    )
