from app.db.base import Base 
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from decimal import Decimal
from enum import Enum

class PurchaseStatus(str,Enum):
    PROCESSING = "processing"
    FAILED = "failed"
    COMPLETED = "completed"
    UNKNOWN = "unknown"

class FlashSale(Base):
    __tablename__ = "flash_sale"

    id: Mapped[int] = mapped_column(primary_key=True)

    product_id: Mapped[int] = mapped_column(Integer,ForeignKey("products.id", ondelete="CASCADE"),nullable=False, unique=True)

    starts_at: Mapped[datetime] = mapped_column(String(50), nullable=False)

    ends_at: Mapped[datetime] = mapped_column(String(50), nullable=False)

    discount_percentage: Mapped[int] = mapped_column(Integer, nullable=False)

    sale_quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    remaining_quantity : Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(String(50), nullable=False)


class FlashSalePurchase(Base):
    __tablename__ ="flash_sale_purchase"
    __table_args__ = (
        UniqueConstraint("flash_sale_id", "user_id", name="uq_flash_sale_purchase_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    flash_sale_id: Mapped[int] = mapped_column(Integer, ForeignKey("flash_sale.id", ondelete="CASCADE"), nullable=False)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    price_paid: Mapped[Decimal] = mapped_column(Numeric(10,2),nullable=False)

    payment_id: Mapped[str] = mapped_column(String(255),nullable=True)

    status: Mapped[PurchaseStatus] = mapped_column(
        SAEnum(PurchaseStatus),
        nullable=False,
        default=PurchaseStatus.PROCESSING,
        server_default=PurchaseStatus.PROCESSING.name,
    )

