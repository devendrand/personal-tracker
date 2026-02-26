"""Trade Tracker - Pydantic schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.trade import StrategyType


class ImportSummary(BaseModel):
    imported: int
    skipped: int
    failed: int
    duplicates: int

    # For this iteration, all imported transactions start unassigned.
    unassigned: int


class TransactionResponse(BaseModel):
    id: str
    activity_date: date
    activity_type: str
    description: str

    symbol: str | None = None
    quantity: Decimal | None = None
    price: Decimal | None = None
    amount: Decimal | None = None

    strategy_type: StrategyType | None = None

    created_at: datetime


class UploadResponse(ImportSummary):
    pass


class PortfolioResponse(BaseModel):
    id: str
    name: str
    created_at: datetime


class TransactionTagRequest(BaseModel):
    portfolio_id: str


class TransactionStrategyTypePatchRequest(BaseModel):
    strategy_type: StrategyType | None


class StrategyTypeOption(BaseModel):
    value: StrategyType
    label: str
    description: str
