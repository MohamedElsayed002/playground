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
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    failure_reason: Mapped[str | None] = mapped_column(Text)

    # created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(
        "User", back_populates="report_jobs", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<ReportJob id={self.id} user_id={self.user_id} status={self.status}>"
