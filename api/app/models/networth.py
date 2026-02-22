"""Net Worth Tracker - SQLAlchemy models."""

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class AccountType(StrEnum):
    """Supported financial account types."""

    # Assets
    CHECKING = "Checking"
    SAVINGS = "Savings"
    BROKERAGE = "Brokerage / Investment"
    RETIREMENT = "Retirement (401k / IRA / Roth)"
    REAL_ESTATE = "Real Estate"
    CRYPTO = "Crypto"
    OTHER_ASSET = "Other Asset"
    # Liabilities
    CREDIT_CARD = "Credit Card"
    AUTO_LOAN = "Auto Loan"
    STUDENT_LOAN = "Student Loan"
    MORTGAGE = "Mortgage"
    OTHER_LIABILITY = "Other Liability"


class AccountCategory(StrEnum):
    """Account category derived from type."""

    ASSET = "Asset"
    LIABILITY = "Liability"


# Mapping of account types to categories
ACCOUNT_TYPE_CATEGORIES = {
    AccountType.CHECKING: AccountCategory.ASSET,
    AccountType.SAVINGS: AccountCategory.ASSET,
    AccountType.BROKERAGE: AccountCategory.ASSET,
    AccountType.RETIREMENT: AccountCategory.ASSET,
    AccountType.REAL_ESTATE: AccountCategory.ASSET,
    AccountType.CRYPTO: AccountCategory.ASSET,
    AccountType.OTHER_ASSET: AccountCategory.ASSET,
    AccountType.CREDIT_CARD: AccountCategory.LIABILITY,
    AccountType.AUTO_LOAN: AccountCategory.LIABILITY,
    AccountType.STUDENT_LOAN: AccountCategory.LIABILITY,
    AccountType.MORTGAGE: AccountCategory.LIABILITY,
    AccountType.OTHER_LIABILITY: AccountCategory.LIABILITY,
}


class NWAccount(Base):
    """Financial account for net worth tracking."""

    __tablename__ = "nw_account"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution: Mapped[str | None] = mapped_column(String(255), nullable=True)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)  # Asset or Liability
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    balances: Mapped[list["NWSnapshotBalance"]] = relationship(
        "NWSnapshotBalance", back_populates="account"
    )


class NWSnapshot(Base):
    """Weekly net worth snapshot."""

    __tablename__ = "nw_snapshot"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, unique=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    balances: Mapped[list["NWSnapshotBalance"]] = relationship(
        "NWSnapshotBalance", back_populates="snapshot", cascade="all, delete-orphan"
    )


class NWSnapshotBalance(Base):
    """Individual account balance within a snapshot."""

    __tablename__ = "nw_snapshot_balance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    snapshot_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("nw_snapshot.id", ondelete="CASCADE"), nullable=False
    )
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("nw_account.id"), nullable=False)
    balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Relationships
    snapshot: Mapped["NWSnapshot"] = relationship("NWSnapshot", back_populates="balances")
    account: Mapped["NWAccount"] = relationship("NWAccount", back_populates="balances")
