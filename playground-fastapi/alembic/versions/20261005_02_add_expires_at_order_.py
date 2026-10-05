"""Add order expiration timestamp.

Revision ID: 20261005_02
Revises: 20261005_01
Create Date: 2026-10-05
"""

from alembic import op
import sqlalchemy as sa


revision = "20261005_02"
down_revision = "20261005_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in sa.inspect(bind).get_columns("orders")}
    if "expires_at" not in columns:
        op.add_column(
            "orders",
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        )
        # Existing orders receive a 30-minute window from migration time.
        op.execute(
            sa.text("UPDATE orders SET expires_at = CURRENT_TIMESTAMP + INTERVAL '30 minutes'")
        )
        op.alter_column("orders", "expires_at", nullable=False)

    if bind.dialect.name == "postgresql":
        # SQLAlchemy stores enum member names (uppercase) in PostgreSQL enums.
        op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'EXPIRED'")
        op.execute("ALTER TYPE paymentstatus ADD VALUE IF NOT EXISTS 'EXPIRED'")

    indexes = {index["name"] for index in sa.inspect(bind).get_indexes("orders")}
    if "ix_orders_pending_expiration" not in indexes:
        op.create_index(
            "ix_orders_pending_expiration",
            "orders",
            ["status", "payment_status", "expires_at"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    indexes = {index["name"] for index in sa.inspect(bind).get_indexes("orders")}
    if "ix_orders_pending_expiration" in indexes:
        op.drop_index("ix_orders_pending_expiration", table_name="orders")
    columns = {column["name"] for column in sa.inspect(bind).get_columns("orders")}
    if "expires_at" in columns:
        op.drop_column("orders", "expires_at")
