"""Personal Tracker API - Pydantic schemas for request/response validation."""

# Trade Tracker schemas (stub)
# from app.schemas.transaction import TransactionCreate, TransactionResponse
# from app.schemas.portfolio import PortfolioCreate, PortfolioResponse

# Swim Performance Tracker schemas
from app.schemas.swim import (
    SwimmerCreate,
    SwimmerUpdate,
    SwimmerResponse,
    SwimEventResponse,
    SwimMeetCreate,
    SwimMeetResponse,
    SwimTimeCreate,
    SwimTimeUpdate,
    SwimTimeResponse,
    PRDashboardRow,
    EventProgressionResponse,
)

# Net Worth Tracker schemas
from app.schemas.networth import (
    NWAccountCreate,
    NWAccountUpdate,
    NWAccountResponse,
    NWSnapshotCreate,
    NWSnapshotUpdate,
    NWSnapshotResponse,
    NWSnapshotSummary,
    SnapshotBalanceEntry,
    NetWorthSummary,
    TrendDataPoint,
    NetWorthTrendResponse,
    CategoryBreakdown,
)

__all__ = [
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
