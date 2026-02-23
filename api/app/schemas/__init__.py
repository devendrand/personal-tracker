"""Personal Tracker API - Pydantic schemas for request/response validation."""

# Trade Tracker schemas
from app.schemas.trade import (
    ImportSummary,
    PortfolioCreate,
    PortfolioResponse,
    TransactionResponse,
    TransactionTagRequest,
    UploadResponse,
)

# Swim Performance Tracker schemas
# Net Worth Tracker schemas
from app.schemas.networth import (
    CategoryBreakdown,
    NetWorthSummary,
    NetWorthTrendResponse,
    NWAccountCreate,
    NWAccountResponse,
    NWAccountUpdate,
    NWSnapshotCreate,
    NWSnapshotResponse,
    NWSnapshotSummary,
    NWSnapshotUpdate,
    SnapshotBalanceEntry,
    TrendDataPoint,
)
from app.schemas.swim import (
    EventProgressionResponse,
    PRDashboardRow,
    SwimEventResponse,
    SwimMeetCreate,
    SwimMeetResponse,
    SwimmerCreate,
    SwimmerResponse,
    SwimmerUpdate,
    SwimTimeCreate,
    SwimTimeResponse,
    SwimTimeUpdate,
)

__all__ = [
    # Trade
    "ImportSummary",
    "UploadResponse",
    "TransactionResponse",
    "PortfolioCreate",
    "PortfolioResponse",
    "TransactionTagRequest",
    # Swim
    "SwimmerCreate",
    "SwimmerUpdate",
    "SwimmerResponse",
    "SwimEventResponse",
    "SwimMeetCreate",
    "SwimMeetResponse",
    "SwimTimeCreate",
    "SwimTimeUpdate",
    "SwimTimeResponse",
    "PRDashboardRow",
    "EventProgressionResponse",
    # Net Worth
    "NWAccountCreate",
    "NWAccountUpdate",
    "NWAccountResponse",
    "NWSnapshotCreate",
    "NWSnapshotUpdate",
    "NWSnapshotResponse",
    "NWSnapshotSummary",
    "SnapshotBalanceEntry",
    "NetWorthSummary",
    "TrendDataPoint",
    "NetWorthTrendResponse",
    "CategoryBreakdown",
]
