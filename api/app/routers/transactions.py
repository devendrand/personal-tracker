"""Trade Tracker API - Transactions router."""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("")
async def list_transactions(current_user: dict = Depends(get_current_user)) -> list:
    """List all transactions.

    STUB: Returns empty list. Will be implemented in M1 milestone.
    """
    return []


@router.post("/upload")
async def upload_transactions(current_user: dict = Depends(get_current_user)) -> dict:
    """Upload E*TRADE CSV file.

    STUB: Will be implemented in M1 milestone.
    """
    return {"message": "Upload endpoint - not yet implemented"}


@router.post("/confirm")
async def confirm_transactions(current_user: dict = Depends(get_current_user)) -> dict:
    """Confirm and persist parsed transactions.

    STUB: Will be implemented in M1 milestone.
    """
    return {"message": "Confirm endpoint - not yet implemented"}
