"""PnL schemas — Pydantic models for the PnL summary response."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.trade import LegType


class LegPnL(BaseModel):
    transaction_id: str
    activity_date: date
    activity_type: str
    description: str
    leg_type: LegType
    amount: Decimal
    realized_pnl: Decimal
    commission: Decimal


class StrategyGroupPnL(BaseModel):
    strategy_group_id: str | None
    name: str
    total_realized_pnl: Decimal
    legs: list[LegPnL]
    transaction_count: int
    total_commission: Decimal


class TickerPnL(BaseModel):
    symbol: str
    total_realized_pnl: Decimal
    groups: list[StrategyGroupPnL]
    transaction_count: int
    total_commission: Decimal


class PnLSummaryResponse(BaseModel):
    total_realized_pnl: Decimal
    tickers: list[TickerPnL]
    total_transaction_count: int
    total_commission: Decimal
