"""add_trade_tables

Revision ID: 7b3c2d1e9af0
Revises: 6aef75f4e5aa
Create Date: 2026-02-23

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7b3c2d1e9af0"
down_revision: str | Sequence[str] | None = "6aef75f4e5aa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "portfolio",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_sub", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_portfolio_user_sub"), "portfolio", ["user_sub"], unique=False)

    op.create_table(
        "import_batch",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_sub", sa.String(length=255), nullable=False),
        sa.Column("source_filename", sa.String(length=255), nullable=False),
        sa.Column("brokerage_account_id", sa.String(length=255), nullable=False),
        sa.Column("imported", sa.Integer(), nullable=False),
        sa.Column("skipped", sa.Integer(), nullable=False),
        sa.Column("failed", sa.Integer(), nullable=False),
        sa.Column("duplicates", sa.Integer(), nullable=False),
        sa.Column("errors", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_import_batch_user_sub"), "import_batch", ["user_sub"], unique=False)

    op.create_table(
        "transaction",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_sub", sa.String(length=255), nullable=False),
        sa.Column("import_batch_id", sa.String(length=36), nullable=False),
        sa.Column("brokerage_account_id", sa.String(length=255), nullable=False),
        sa.Column("activity_date", sa.Date(), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=True),
        sa.Column("settlement_date", sa.Date(), nullable=True),
        sa.Column("activity_type", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("symbol", sa.String(length=50), nullable=True),
        sa.Column("cusip", sa.String(length=50), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("price", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("amount", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("commission", sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("raw", sa.JSON(), nullable=False),
        sa.Column("portfolio_id", sa.String(length=36), nullable=True),
        sa.Column("dedupe_key", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["import_batch_id"], ["import_batch.id"]),
        sa.ForeignKeyConstraint(["portfolio_id"], ["portfolio.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_transaction_activity_date"), "transaction", ["activity_date"], unique=False
    )
    op.create_index(op.f("ix_transaction_symbol"), "transaction", ["symbol"], unique=False)
    op.create_index(op.f("ix_transaction_user_sub"), "transaction", ["user_sub"], unique=False)
    op.create_index(
        "ix_transaction_user_dedupe",
        "transaction",
        ["user_sub", "dedupe_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_transaction_user_dedupe", table_name="transaction")
    op.drop_index(op.f("ix_transaction_user_sub"), table_name="transaction")
    op.drop_index(op.f("ix_transaction_symbol"), table_name="transaction")
    op.drop_index(op.f("ix_transaction_activity_date"), table_name="transaction")
    op.drop_table("transaction")

    op.drop_index(op.f("ix_import_batch_user_sub"), table_name="import_batch")
    op.drop_table("import_batch")

    op.drop_index(op.f("ix_portfolio_user_sub"), table_name="portfolio")
    op.drop_table("portfolio")
