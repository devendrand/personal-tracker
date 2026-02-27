"""Strategy Group - Pydantic schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class StrategyGroupCreate(BaseModel):
    name: str
    symbol: str


class StrategyGroupResponse(BaseModel):
    id: str
    name: str
    symbol: str
    created_at: datetime


class AssignLegRequest(BaseModel):
    strategy_group_id: str | None
