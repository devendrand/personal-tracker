"""Trade Tracker API - PnL router (US3)."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DbSession
from app.models.trade import Transaction
from app.schemas.pnl import PnLSummaryResponse
from app.services.pnl_service import calculate_pnl

router = APIRouter(prefix="/pnl", tags=["PnL"])


@router.get("", response_model=PnLSummaryResponse)
async def get_pnl(
    db: DbSession,
    current_user: CurrentUser,
) -> PnLSummaryResponse:
    user_sub = str(current_user.get("sub") or "")
    result = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_sub == user_sub,
            Transaction.leg_type.isnot(None),
        )
        .options(selectinload(Transaction.strategy_group))
        .order_by(Transaction.activity_date)
    )
    transactions = list(result.scalars().all())
    return calculate_pnl(transactions)
