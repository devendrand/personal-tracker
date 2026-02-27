"""Trade Tracker API - Strategy Groups router (US2)."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession
from app.models.trade import StrategyGroup, Transaction
from app.schemas.strategy_group import StrategyGroupCreate, StrategyGroupResponse

router = APIRouter(prefix="/strategy-groups", tags=["Strategy Groups"])


@router.get("", response_model=list[StrategyGroupResponse])
async def list_strategy_groups(
    db: DbSession,
    current_user: CurrentUser,
) -> list[StrategyGroupResponse]:
    user_sub = str(current_user.get("sub") or "")
    result = await db.execute(
        select(StrategyGroup)
        .where(StrategyGroup.user_sub == user_sub)
        .order_by(StrategyGroup.created_at.desc())
    )
    groups = result.scalars().all()
    return [
        StrategyGroupResponse(
            id=g.id,
            name=g.name,
            symbol=g.symbol,
            created_at=g.created_at,
        )
        for g in groups
    ]


@router.post("", response_model=StrategyGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_strategy_group(
    body: StrategyGroupCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> StrategyGroupResponse:
    user_sub = str(current_user.get("sub") or "")
    now = datetime.utcnow()
    group = StrategyGroup(
        id=str(uuid.uuid4()),
        user_sub=user_sub,
        name=body.name,
        symbol=body.symbol.upper(),
        created_at=now,
        updated_at=now,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return StrategyGroupResponse(
        id=group.id,
        name=group.name,
        symbol=group.symbol,
        created_at=group.created_at,
    )


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strategy_group(
    group_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    user_sub = str(current_user.get("sub") or "")
    result = await db.execute(
        select(StrategyGroup).where(
            StrategyGroup.id == group_id,
            StrategyGroup.user_sub == user_sub,
        )
    )
    group = result.scalar_one_or_none()
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Strategy group not found"
        )

    # Unassign all legs (SET NULL handled by DB ondelete, but force flush for same-session reads)
    legs_result = await db.execute(
        select(Transaction).where(Transaction.strategy_group_id == group_id)
    )
    for leg in legs_result.scalars().all():
        leg.strategy_group_id = None

    await db.delete(group)
    await db.commit()
