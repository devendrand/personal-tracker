"""Net Worth Tracker - API routes (stub implementation)."""

from datetime import date

from fastapi import APIRouter, HTTPException, Query

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
)

router = APIRouter(prefix="/networth", tags=["networth"])


# --- Account Endpoints ---


@router.get("/accounts", response_model=list[NWAccountResponse])
async def list_accounts(
    account_type: str | None = Query(None, pattern=r"^(asset|liability)$"),
    category: str | None = None,
    active_only: bool = True,
):
    """List all accounts, optionally filtered."""
    # TODO: Implement with database query
    return []


@router.post("/accounts", response_model=NWAccountResponse, status_code=201)
async def create_account(account: NWAccountCreate):
    """Create a new account."""
    # TODO: Implement with database insert
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/accounts/{account_id}", response_model=NWAccountResponse)
async def get_account(account_id: int):
    """Get account by ID."""
    # TODO: Implement with database query
    raise HTTPException(status_code=404, detail="Account not found")


@router.patch("/accounts/{account_id}", response_model=NWAccountResponse)
async def update_account(account_id: int, account: NWAccountUpdate):
    """Update an account."""
    # TODO: Implement with database update
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/accounts/{account_id}", status_code=204)
async def delete_account(account_id: int):
    """Soft delete (deactivate) an account."""
    # TODO: Implement with database update (set is_active=False)
    raise HTTPException(status_code=501, detail="Not implemented")


# --- Snapshot Endpoints ---


@router.get("/snapshots", response_model=list[NWSnapshotSummary])
async def list_snapshots(
    year: int | None = None,
    limit: int = Query(52, ge=1, le=520),  # Default ~1 year of weekly snapshots
):
    """List snapshots, most recent first."""
    # TODO: Implement with database query
    return []


@router.post("/snapshots", response_model=NWSnapshotResponse, status_code=201)
async def create_snapshot(snapshot: NWSnapshotCreate):
    """Create a new net worth snapshot."""
    # TODO: Implement with database insert
    # Should calculate totals from balances
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/snapshots/latest", response_model=NWSnapshotResponse)
async def get_latest_snapshot():
    """Get the most recent snapshot with full details."""
    # TODO: Implement with database query
    raise HTTPException(status_code=404, detail="No snapshots found")


@router.get("/snapshots/{snapshot_id}", response_model=NWSnapshotResponse)
async def get_snapshot(snapshot_id: int):
    """Get snapshot by ID with full balance details."""
    # TODO: Implement with database query
    raise HTTPException(status_code=404, detail="Snapshot not found")


@router.patch("/snapshots/{snapshot_id}", response_model=NWSnapshotResponse)
async def update_snapshot(snapshot_id: int, snapshot: NWSnapshotUpdate):
    """Update a snapshot (notes or balances)."""
    # TODO: Implement with database update
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/snapshots/{snapshot_id}", status_code=204)
async def delete_snapshot(snapshot_id: int):
    """Delete a snapshot and its balances."""
    # TODO: Implement with database delete
    raise HTTPException(status_code=501, detail="Not implemented")


# --- Pre-fill Endpoint ---


@router.get("/snapshots/prefill", response_model=list[dict])
async def get_snapshot_prefill():
    """Get account list with last known balances for quick entry."""
    # TODO: Implement - returns accounts with their most recent balance
    return []


# --- Report Endpoints ---


@router.get("/summary", response_model=NetWorthSummary)
async def get_net_worth_summary():
    """Get current net worth summary dashboard."""
    # TODO: Implement with database query
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/trend", response_model=NetWorthTrendResponse)
async def get_net_worth_trend(
    start_date: date | None = None,
    end_date: date | None = None,
    period: str = Query("1y", pattern=r"^(3m|6m|1y|2y|all)$"),
):
    """Get net worth trend data for charting."""
    # TODO: Implement with database query
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/breakdown/assets", response_model=list[CategoryBreakdown])
async def get_assets_breakdown():
    """Get breakdown of assets by category."""
    # TODO: Implement with database query
    return []


@router.get("/breakdown/liabilities", response_model=list[CategoryBreakdown])
async def get_liabilities_breakdown():
    """Get breakdown of liabilities by category."""
    # TODO: Implement with database query
    return []
