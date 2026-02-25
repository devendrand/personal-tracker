"""Trade Tracker API - Portfolios router."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession
from app.models.trade import Portfolio
from app.schemas.trade import PortfolioResponse

router = APIRouter(prefix="/portfolios", tags=["Portfolios"])


@router.get("")
async def list_portfolios(db: DbSession, current_user: CurrentUser) -> list[PortfolioResponse]:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    result = await db.execute(select(Portfolio).where(Portfolio.user_sub == user_sub))
    portfolios = result.scalars().all()
    return [PortfolioResponse(id=p.id, name=p.name, created_at=p.created_at) for p in portfolios]


@router.get("/{portfolio_id}")
async def get_portfolio(
    portfolio_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> PortfolioResponse:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    result = await db.execute(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_sub == user_sub)
    )
    portfolio = result.scalar_one_or_none()
    if portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    return PortfolioResponse(id=portfolio.id, name=portfolio.name, created_at=portfolio.created_at)
