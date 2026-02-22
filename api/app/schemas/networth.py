"""Net Worth Tracker - Pydantic schemas."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

# --- Account Schemas ---


class NWAccountBase(BaseModel):
    """Base account schema."""

    name: str = Field(..., min_length=1, max_length=255)
    account_type: str = Field(..., pattern=r"^(asset|liability)$")
    category: str = Field(..., max_length=50)
    institution: str | None = Field(None, max_length=255)
    notes: str | None = None
    is_active: bool = True


class NWAccountCreate(NWAccountBase):
    """Schema for creating an account."""

    pass


class NWAccountUpdate(BaseModel):
    """Schema for updating an account."""

    name: str | None = Field(None, min_length=1, max_length=255)
    account_type: str | None = Field(None, pattern=r"^(asset|liability)$")
    category: str | None = Field(None, max_length=50)
    institution: str | None = Field(None, max_length=255)
    notes: str | None = None
    is_active: bool | None = None


class NWAccountResponse(NWAccountBase):
    """Schema for account response."""

    id: int
    current_balance: Decimal | None = None  # Latest balance if available

    model_config = {"from_attributes": True}


# --- Snapshot Balance Schemas ---


class SnapshotBalanceEntry(BaseModel):
    """Single account balance within a snapshot."""

    account_id: int
    balance: Decimal = Field(..., decimal_places=2)
    notes: str | None = None


class SnapshotBalanceResponse(SnapshotBalanceEntry):
    """Schema for snapshot balance response."""

    id: int
    account: NWAccountResponse

    model_config = {"from_attributes": True}


# --- Snapshot Schemas ---


class NWSnapshotBase(BaseModel):
    """Base snapshot schema."""

    snapshot_date: date
    notes: str | None = None


class NWSnapshotCreate(NWSnapshotBase):
    """Schema for creating a snapshot."""

    balances: list[SnapshotBalanceEntry]


class NWSnapshotUpdate(BaseModel):
    """Schema for updating a snapshot."""

    notes: str | None = None
    balances: list[SnapshotBalanceEntry] | None = None


class NWSnapshotResponse(NWSnapshotBase):
    """Schema for snapshot response."""

    id: int
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    balances: list[SnapshotBalanceResponse]

    model_config = {"from_attributes": True}


class NWSnapshotSummary(BaseModel):
    """Schema for snapshot list without full balance details."""

    id: int
    snapshot_date: date
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    notes: str | None

    model_config = {"from_attributes": True}


# --- Report Schemas ---


class NetWorthSummary(BaseModel):
    """Schema for net worth summary dashboard."""

    current_net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    snapshot_date: date
    change_from_previous: Decimal
    change_percent: float
    assets_by_category: dict[str, Decimal]
    liabilities_by_category: dict[str, Decimal]


class TrendDataPoint(BaseModel):
    """Single data point for net worth trend chart."""

    date: date
    net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal


class NetWorthTrendResponse(BaseModel):
    """Response for net worth trend chart."""

    data_points: list[TrendDataPoint]
    period_start: date
    period_end: date
    net_change: Decimal
    net_change_percent: float


class CategoryBreakdown(BaseModel):
    """Schema for category breakdown."""

    category: str
    accounts: list[NWAccountResponse]
    total: Decimal
    percent_of_type: float  # Percentage of total assets or liabilities
