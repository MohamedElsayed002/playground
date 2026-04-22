"""
Product category model with self-referential (parent/child) relationship.

This demonstrates SQLAlchemy's self-referential foreign key - a category
can have a parent category, enabling a tree structure:

"""

from sqlalchemy import String, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base 

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True,nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))

    # Self-referential FK - this category's parent category ID 
    # nullable=True means it can be a top-level (root) category

    parent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"),nullable=True
    )

    # Self-referential relationship
    # a category has one parent and many children
    parent: Mapped["Category | None"] = relationship(
        "Category",
        back_populates="children",
        remote_side="Category.id",
        lazy="selectin"
    )
    children: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="parent",
        lazy="selectin"
    )

    # Products in this category
    products: Mapped[list["Product"]] = relationship(
        "Product",back_populates="category",lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"
