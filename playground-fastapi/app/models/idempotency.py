from datetime import datetime
from app.db.base import Base 
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id",ondelete="SET NULL"), nullable=True
    )

    # the endpoint that created this key (for debugging / conflict detection)
    request_path: Mapped[str] = mapped_column(String(500), nullable=False)

    # Serialised response body (JSON string). NULL means the operation is in flight.
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),nullable=False)

    def is_complete(self) -> bool:
        return self.response_body is not None

    def __repr__(self) -> str:
        return f"<IdempotencyKey key={self.key} complete={self.is_complete()}>"
