"""Personal Tracker API - Pydantic schemas for request/response validation."""

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
from app.schemas.trade import (
    ImportSummary,
    LegTypeOption,
    LegTypePatchRequest,
    PortfolioResponse,
    TransactionResponse,
    UploadResponse,
)

__all__ = [
    # Trade
    "ImportSummary",
    "UploadResponse",
    "TransactionResponse",
    "PortfolioResponse",
    "LegTypePatchRequest",
    "LegTypeOption",
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
