from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.db.base import Base
from datetime import datetime


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(Integer,primary_key=True)

    event = Column(String, nullable=False)
    user_id = Column(Integer, nullable=True)

    status = Column(String, nullable=False)

    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    extra  = Column(JSON,nullable=True)
