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

    cart: Mapped["Cart | None"] = relationship(
        "Cart", back_populates="user", uselist=False, lazy="selectin"
    )

    report_jobs: Mapped[list["ReportJob"]] = relationship(
        "ReportJob", back_populates="user", lazy="selectin"
    )

    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="owner", foreign_keys="Product.owner_id", lazy="noload"
    )

    

    def __repr__(self) -> str:
        state = self.__dict__
        return f"<User id={state.get('id')} email={state.get('email')} role={state.get('role')}>"
