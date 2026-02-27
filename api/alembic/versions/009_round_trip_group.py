"""add_round_trip_group

Revision ID: 009_round_trip_group
Revises: 8a04904394df
Create Date: 2026-02-27 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009_round_trip_group"
down_revision: str | Sequence[str] | None = "8a04904394df"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create round_trip_group table
    op.create_table(
        "round_trip_group",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_sub", sa.String(length=255), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_round_trip_group_user_sub"), "round_trip_group", ["user_sub"], unique=False
    )

    # Add round_trip_group_id to transaction table
    op.add_column(
        "transaction", sa.Column("round_trip_group_id", sa.String(length=36), nullable=True)
    )
    op.create_index(
        op.f("ix_transaction_round_trip_group_id"),
        "transaction",
        ["round_trip_group_id"],
        unique=False,
    )
    op.create_foreign_key(
        None,
        "transaction",
        "round_trip_group",
        ["round_trip_group_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign key and index
    op.drop_constraint(None, "transaction", type_="foreignkey")
    op.drop_index(op.f("ix_transaction_round_trip_group_id"), table_name="transaction")
    op.drop_column("transaction", "round_trip_group_id")

    # Drop round_trip_group table
    op.drop_index(op.f("ix_round_trip_group_user_sub"), table_name="round_trip_group")
    op.drop_table("round_trip_group")
