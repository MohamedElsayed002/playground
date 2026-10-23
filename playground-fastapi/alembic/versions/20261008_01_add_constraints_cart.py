"""Enforce one item per product in each cart.

Revision ID: 20261008_01
Revises: 20261007_04
Create Date: 2026-10-08
"""

from alembic import op


revision = "20261008_01"
down_revision = "20261007_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Preserve the total requested quantity when collapsing legacy duplicate
    # cart rows. Keep the lowest id so the surviving item remains stable.
    op.execute(
        """
        WITH duplicate_groups AS (
            SELECT MIN(id) AS keep_id, cart_id, product_id, SUM(quantity)::integer AS total_quantity
            FROM cart_items
            GROUP BY cart_id, product_id
            HAVING COUNT(*) > 1
        )
        UPDATE cart_items AS item
        SET quantity = duplicate_groups.total_quantity
        FROM duplicate_groups
        WHERE item.id = duplicate_groups.keep_id
        """
    )
    op.execute(
        """
        WITH duplicate_groups AS (
            SELECT MIN(id) AS keep_id, cart_id, product_id
            FROM cart_items
            GROUP BY cart_id, product_id
            HAVING COUNT(*) > 1
        )
        DELETE FROM cart_items AS item
        USING duplicate_groups
        WHERE item.cart_id = duplicate_groups.cart_id
          AND item.product_id = duplicate_groups.product_id
          AND item.id <> duplicate_groups.keep_id
        """
    )
    op.create_index(
        "uq_cart_items_cart_product",
        "cart_items",
        ["cart_id", "product_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_cart_items_cart_product", table_name="cart_items")
