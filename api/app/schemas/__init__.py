"""Personal Tracker API - Pydantic schemas for request/response validation."""

# Trade Tracker schemas (stub)
# from app.schemas.transaction import TransactionCreate, TransactionResponse
# from app.schemas.portfolio import PortfolioCreate, PortfolioResponse

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
