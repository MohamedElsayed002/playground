"""
app/models/user.py
──────────────────
User database model.

NestJS/TypeORM equivalent → @Entity() class with @Column decorators
FastAPI/SQLAlchemy approach → Python class extending Base with Mapped[] types

Mapped[str] is SQLAlchemy 2.0's typed column syntax — it gives you full
type checking and IDE autocompletion, just like TypeORM's typed properties.
"""

from sqlalchemy import String, Boolean, Enum as SAEnum 
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum 

from app.db.base import Base

class UserRole(str,enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    email: Mapped[str] = mapped_column(String(255),unique=True,index=True,nullable=False)
    username: Mapped[str] = mapped_column(String(50),unique=True, index=True, nullable=False)

    hashed_password: Mapped[str] = mapped_column(String(255),nullable=False)

    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None]  = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole),
        default=UserRole.USER,
        nullable=False
    )

    # Soft-delete / account status pattern 
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="user", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"