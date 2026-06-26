from datetime import date
import uuid

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NormalizedProduct(Base):
    __tablename__ = "normalized_products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("report_jobs.id"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    last_restock_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    job: Mapped["ReportJob"] = relationship("ReportJob", back_populates="products")
