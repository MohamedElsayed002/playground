from decimal import Decimal
import enum

from sqlalchemy import String, Numeric, Integer, ForeignKey, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from datetime import datetime

# I don't use this all status though 
class OrderStatus(str, enum.Enum):
    """Order lifecycle states."""
    PENDING = "pending"          
    CONFIRMED = "confirmed"     
    PROCESSING = "processing"    
    SHIPPED = "shipped"          
    DELIVERED = "delivered"      
    CANCELLED = "cancelled"     
    REFUNDED = "refunded"         # Money returned
    EXPIRED = "expired"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    EXPIRED = "expired"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_pending_expiration", "status", "payment_status", "expires_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False
    )
    payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    stripe_secret_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    shipping_address_line1: Mapped[str | None] = mapped_column(String(255))
    shipping_address_line2: Mapped[str | None] = mapped_column(String(255))
    shipping_city: Mapped[str | None] = mapped_column(String(100))
    shipping_country: Mapped[str | None] = mapped_column(String(100))
    shipping_postal_code: Mapped[str | None] = mapped_column(String(20))

    notes: Mapped[str | None] = mapped_column(Text)  # Customer notes

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

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
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    product_name: Mapped[str] = mapped_column(String(255), nullable=False)

    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    flash_sale_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("flash_sale.id", ondelete="SET NULL"), nullable=True
    )

    flash_sale_quantity: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product | None"] = relationship( 
        "Product", back_populates="order_items", lazy="selectin"
    )
