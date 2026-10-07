"""Create refunds table.

Revision ID: 20261007_03
Revises: 20261005_02
Create Date: 2026-10-07
"""

from alembic import op
import sqlalchemy as sa


revision = "20261007_03"
down_revision = "20261005_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refunds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("IDLE", "PROCESSING", "REFUNDED", "FAILED", "EXPIRED", name="refundstatus"),
            nullable=False,
        ),
        sa.Column("stripe_refund_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("amount > 0", name="ck_refunds_amount_positive"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_refunds_order_id"),
        sa.UniqueConstraint("stripe_refund_id", name="uq_refunds_stripe_refund_id"),
    )


def downgrade() -> None:
    op.drop_table("refunds")
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS refundstatus")
