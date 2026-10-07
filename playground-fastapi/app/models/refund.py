import enum
from decimal import Decimal

from sqlalchemy import CheckConstraint, Enum as SAEnum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RefundStatus(str, enum.Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    REFUNDED = "refunded"
    FAILED = "failed"
    EXPIRED = "expired"


class Refund(Base):
    __tablename__ = "refunds"
    __table_args__ = (
        UniqueConstraint("order_id", name="uq_refunds_order_id"),
        UniqueConstraint("stripe_refund_id", name="uq_refunds_stripe_refund_id"),
        CheckConstraint("amount > 0", name="ck_refunds_amount_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[RefundStatus] = mapped_column(
        SAEnum(RefundStatus), default=RefundStatus.IDLE, nullable=False
    )
    stripe_refund_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # created_at and updated_at are inherited from Base.
    order: Mapped["Order"] = relationship("Order", back_populates="refund")
