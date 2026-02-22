"""Trade Tracker API - Portfolios router."""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user

router = APIRouter(prefix="/portfolios", tags=["Portfolios"])


@router.get("")
async def list_portfolios(current_user: dict = Depends(get_current_user)) -> list:
    """List all portfolios.

    STUB: Returns empty list. Will be implemented in M2 milestone.
    """
    return []


@router.post("")
async def create_portfolio(current_user: dict = Depends(get_current_user)) -> dict:
    """Create a new portfolio.

    STUB: Will be implemented in M2 milestone.
    """
    return {"message": "Create portfolio endpoint - not yet implemented"}


@router.get("/{portfolio_id}")
async def get_portfolio(
    portfolio_id: int,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get a portfolio by ID.

    STUB: Will be implemented in M2 milestone.
    """
    return {"id": portfolio_id, "message": "Get portfolio endpoint - not yet implemented"}
