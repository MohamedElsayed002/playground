"""Add Stripe PaymentIntent ID to orders.

Revision ID: 20261005_01
Revises:
Create Date: 2026-10-05
"""

from alembic import op
import sqlalchemy as sa


revision = "20261005_01"
down_revision = None
branch_labels = None
depends_on = None

# alembic upgrade head
def upgrade() -> None:
    # payment_id may have been added manually before this migration was introduced.
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("orders")}
    if "payment_id" not in columns:
        op.add_column("orders", sa.Column("payment_id", sa.String(length=255), nullable=True))
    if "stripe_secret_key" not in columns:
        op.add_column("orders", sa.Column("stripe_secret_key", sa.String(length=255), nullable=True))

    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes("orders")}
    if "ix_orders_payment_id" not in indexes:
        op.create_index("ix_orders_payment_id", "orders", ["payment_id"], unique=False)


def downgrade() -> None:
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes("orders")}
    if "ix_orders_payment_id" in indexes:
        op.drop_index("ix_orders_payment_id", table_name="orders")
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("orders")}
    if "stripe_secret_key" in columns:
        op.drop_column("orders", "stripe_secret_key")
