from app.db.base import Base 
from sqlalchemy import String, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, unique=True
    )

    user: Mapped["User"] = relationship("User", back_populates="cart", lazy="selectin")

    items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def subtotal(self) -> Decimal:
        total = Decimal("0")
        for item in self.items:
            if item.product is None or item.product.price is None:
                continue
            total += item.product.price * item.quantity
        return total
