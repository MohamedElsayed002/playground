import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, UUID
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class AuditOutbox(Base):
    __tablename__ = "audit_outbox"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    event_type = Column(String, nullable=False)

    payload = Column(JSONB, nullable=True)
    status = Column(String, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    idempotency_key = Column(String, nullable=False, unique=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
