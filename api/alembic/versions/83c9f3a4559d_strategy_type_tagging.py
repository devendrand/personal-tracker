"""strategy type tagging

Revision ID: 83c9f3a4559d
Revises: 7b3c2d1e9af0
Create Date: 2026-02-26 17:38:58.127905

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "83c9f3a4559d"
down_revision: str | Sequence[str] | None = "7b3c2d1e9af0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "transaction",
        sa.Column("strategy_type", sa.String(length=50), nullable=True),
    )
    op.create_check_constraint(
        "ck_transaction_strategy_type",
        "transaction",
        "strategy_type IS NULL OR strategy_type IN ('WHEEL','COVERED_CALL','COLLAR','CSP','LONG_HOLD','SIP')",
    )

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for fk in inspector.get_foreign_keys("transaction"):
        if fk.get("constrained_columns") == ["portfolio_id"]:
            op.drop_constraint(fk["name"], "transaction", type_="foreignkey")

    op.drop_column("transaction", "portfolio_id")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "transaction",
        sa.Column("portfolio_id", sa.String(length=36), nullable=True),
    )
    op.create_foreign_key(
        "fk_transaction_portfolio_id_portfolio",
        "transaction",
        "portfolio",
        ["portfolio_id"],
        ["id"],
    )

    op.drop_constraint("ck_transaction_strategy_type", "transaction", type_="check")
    op.drop_column("transaction", "strategy_type")
