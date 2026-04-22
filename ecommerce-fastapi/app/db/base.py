"""
app/db/base.py 

The SQLAlchemy declarative base that all models inherit from.

NestJS/TypeORM equivalent -> Entity base class @Entity() decorator 
FastAPI/SQL approach -> All models extend DeclartiveBase 

The `Base` class is also imported by alembic/env.py so Alembic knows
which models to include in auto-generated migrations
"""

from datetime import datetime, timezone 
from sqlalchemy import DateTime, func 
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column 

class Base(DeclarativeBase):
    """
    Base class for all data models

    We add created_at / updated_at here so EVERY table gets them automatically
    jut like a TypeORM base entity with @CreateDateColumn() / @UpdateDateColumn 
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )