
from app.db.base import Base 
from sqlalchemy import Column, String


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    key = Column(String, primary_key=True)
    response = Column(String)  # store JSON