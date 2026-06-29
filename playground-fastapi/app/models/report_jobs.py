from sqlalchemy import String, Integer, Text, DateTime, UUID, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
import uuid

from app.db.base import Base


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IngestionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportJob(Base):
    __tablename__ = "report_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    original_filename: Mapped[str] = mapped_column(String(100))
    file_s3_key: Mapped[str] = mapped_column(String(100))

    file_url: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus),
        default=JobStatus.QUEUED,
        nullable=False
    )

    current_step: Mapped[str | None] = mapped_column(String(100))

    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_rows : Mapped[int] = mapped_column(Integer, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, default=0)
    invalid_rows: Mapped[int] = mapped_column(Integer, default=0)
    invalid_price: Mapped[int] = mapped_column(Integer,default=0)
    invalid_quantity: Mapped[int] = mapped_column(Integer, default=0)
    invalid_dates: Mapped[int] = mapped_column(Integer, default=0)
    normalized_rows_count: Mapped[int] = mapped_column(Integer, default=0)
    normalized_file_s3_key: Mapped[str | None] = mapped_column(String(255))
    quality_score: Mapped[int] = mapped_column(Integer, default=0)
    normalized_file_url: Mapped[str | None] = mapped_column(Text)
    ingested_rows: Mapped[int] = mapped_column(Integer, default=0)
    ingestion_status: Mapped[IngestionStatus] = mapped_column(
        SAEnum(IngestionStatus),
        default=IngestionStatus.PENDING,
        nullable=False,
    )
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    failure_reason: Mapped[str | None] = mapped_column(Text)



    user: Mapped["User"] = relationship(
        "User", back_populates="report_jobs", lazy="selectin"
    )

    products: Mapped[list["NormalizedProduct"]] = relationship("NormalizedProduct", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        state = self.__dict__
        return f"<ReportJob id={state.get('id')} user_id={state.get('user_id')} status={state.get('status')}>"
