"""Trade Tracker - SQLAlchemy models."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


def _uuid_str() -> str:
    return str(uuid4())


class Portfolio(Base):
    __tablename__ = "portfolio"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_sub: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    transactions: Mapped[list[Transaction]] = relationship(
        "Transaction", back_populates="portfolio"
    )


class ImportBatch(Base):
    __tablename__ = "import_batch"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_sub: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    source_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    brokerage_account_id: Mapped[str] = mapped_column(String(255), nullable=False)

    imported: Mapped[int] = mapped_column(nullable=False, default=0)
    skipped: Mapped[int] = mapped_column(nullable=False, default=0)
    failed: Mapped[int] = mapped_column(nullable=False, default=0)
    duplicates: Mapped[int] = mapped_column(nullable=False, default=0)

    # Raw errors/skips for troubleshooting; stored as JSON-compatible structure.
    errors: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    transactions: Mapped[list[Transaction]] = relationship(
        "Transaction", back_populates="import_batch", cascade="all, delete-orphan"
    )


class Transaction(Base):
    __tablename__ = "transaction"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)

    user_sub: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    import_batch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("import_batch.id"), nullable=False
    )

    brokerage_account_id: Mapped[str] = mapped_column(String(255), nullable=False)

    activity_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    transaction_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    settlement_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    symbol: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    cusip: Mapped[str | None] = mapped_column(String(50), nullable=True)

    quantity: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    commission: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Raw row storage for traceability.
    raw: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Portfolio tagging (unassigned is NULL)
    portfolio_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("portfolio.id"), nullable=True
    )

    # Used for duplicate prevention across uploads.
    dedupe_key: Mapped[str] = mapped_column(String(64), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    import_batch: Mapped[ImportBatch] = relationship("ImportBatch", back_populates="transactions")
    portfolio: Mapped[Portfolio | None] = relationship("Portfolio", back_populates="transactions")


Index("ix_transaction_user_dedupe", Transaction.user_sub, Transaction.dedupe_key, unique=True)
