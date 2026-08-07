from app.db.base import Base 
from sqlalchemy import String, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

class CartItem(Base):
    __tablename__ ="cart_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False,default=1)

    cart_id: Mapped[int] = mapped_column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)

    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items", lazy="selectin")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")