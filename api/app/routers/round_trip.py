"""Trade Tracker API - Round-Trip Groups router."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DbSession
from app.models.trade import RoundTripGroup, Transaction
from app.schemas.round_trip import (
    AddToGroupRequest,
    LinkTransactionsRequest,
    RemoveFromGroupRequest,
    RoundTripGroupDetailResponse,
    RoundTripGroupResponse,
)

router = APIRouter(prefix="/round-trips", tags=["Round Trips"])


async def _get_next_display_order(db: DbSession, user_sub: str) -> int:
    """Get the next display order number for a user's groups."""
    result = await db.execute(
        select(func.max(RoundTripGroup.display_order)).where(RoundTripGroup.user_sub == user_sub)
    )
    max_order = result.scalar_one_or_none()
    return (max_order or 0) + 1


def _group_to_response(group: RoundTripGroup) -> RoundTripGroupResponse:
    """Convert a RoundTripGroup to its response schema."""
    return RoundTripGroupResponse(
        id=group.id,
        display_order=group.display_order,
        member_count=len(group.transactions),
        created_at=group.created_at,
    )


@router.post("/link", response_model=RoundTripGroupResponse, status_code=status.HTTP_201_CREATED)
async def link_transactions(
    body: LinkTransactionsRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> RoundTripGroupResponse:
    """Link multiple transactions into a new round-trip group."""
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    # Validate minimum 2 transactions
    if len(body.transaction_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 transactions required to create a group",
        )

    # Fetch all transactions
    result = await db.execute(
        select(Transaction).where(
            Transaction.id.in_(body.transaction_ids),
            Transaction.user_sub == user_sub,
        )
    )
    txns = list(result.scalars().all())

    # Verify all transactions found
    if len(txns) != len(body.transaction_ids):
        found_ids = {t.id for t in txns}
        missing = set(body.transaction_ids) - found_ids
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transactions not found: {missing}",
        )

    # Check for already-grouped transactions (conflict)
    already_linked: list[Transaction] = [t for t in txns if t.round_trip_group_id is not None]
    if already_linked:
        conflict_details = [f"{t.id} (group: {t.round_trip_group_id})" for t in already_linked]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot link transactions: already in another group: {conflict_details}",
        )

    # Validate same symbol for all transactions
    symbols = {t.symbol for t in txns if t.symbol is not None}
    if len(symbols) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All transactions must have the same symbol to be linked",
        )

    # Check for null symbols
    null_symbols = [t for t in txns if t.symbol is None]
    if null_symbols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transactions without a symbol cannot be linked",
        )

    # Create the group
    display_order = await _get_next_display_order(db, user_sub)
    group = RoundTripGroup(
        user_sub=user_sub,
        display_order=display_order,
    )
    db.add(group)
    await db.flush()  # Get group ID

    # Assign all transactions to the group
    for txn in txns:
        txn.round_trip_group_id = group.id

    await db.commit()
    await db.refresh(group, ["transactions"])

    return _group_to_response(group)


@router.post("/{group_id}/add", response_model=RoundTripGroupResponse)
async def add_to_group(
    group_id: str,
    body: AddToGroupRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> RoundTripGroupResponse:
    """Add unlinked transactions to an existing round-trip group."""
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    # Validate at least 1 transaction
    if len(body.transaction_ids) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 1 transaction required to add to group",
        )

    # Fetch the group
    result = await db.execute(
        select(RoundTripGroup)
        .where(RoundTripGroup.id == group_id, RoundTripGroup.user_sub == user_sub)
        .options(selectinload(RoundTripGroup.transactions))
    )
    group: RoundTripGroup | None = result.scalar_one_or_none()
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    # Fetch transactions to add
    txn_result = await db.execute(
        select(Transaction).where(
            Transaction.id.in_(body.transaction_ids),
            Transaction.user_sub == user_sub,
        )
    )
    txns: list[Transaction] = list(txn_result.scalars().all())

    if len(txns) != len(body.transaction_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more transactions not found",
        )

    # Check for already-grouped transactions (conflict)
    already_linked: list[Transaction] = [t for t in txns if t.round_trip_group_id is not None]
    if already_linked:
        conflict_details = [f"{t.id} (group: {t.round_trip_group_id})" for t in already_linked]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot add transactions: already in another group: {conflict_details}",
        )

    # Validate symbol matches group's transactions
    group_symbol = group.transactions[0].symbol if group.transactions else None
    for txn in txns:
        if txn.symbol != group_symbol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction symbol '{txn.symbol}' does not match group symbol '{group_symbol}'",
            )

    # Add transactions to group
    for txn in txns:
        txn.round_trip_group_id = group.id

    await db.commit()
    await db.refresh(group, ["transactions"])

    return _group_to_response(group)


@router.post("/{group_id}/remove", response_model=RoundTripGroupResponse)
async def remove_from_group(
    group_id: str,
    body: RemoveFromGroupRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> RoundTripGroupResponse:
    """Remove transactions from a round-trip group."""
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    # Validate at least 1 transaction
    if len(body.transaction_ids) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 1 transaction required to remove from group",
        )

    # Fetch the group
    result = await db.execute(
        select(RoundTripGroup)
        .where(RoundTripGroup.id == group_id, RoundTripGroup.user_sub == user_sub)
        .options(selectinload(RoundTripGroup.transactions))
    )
    group: RoundTripGroup | None = result.scalar_one_or_none()
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    # Verify all specified transactions are in this group
    group_txn_ids = {t.id for t in group.transactions}
    for txn_id in body.transaction_ids:
        if txn_id not in group_txn_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction {txn_id} is not in this group",
            )

    # Remove transactions from group
    txn_result = await db.execute(
        select(Transaction).where(Transaction.id.in_(body.transaction_ids))
    )
    txns_to_remove: list[Transaction] = list(txn_result.scalars().all())
    for txn in txns_to_remove:
        txn.round_trip_group_id = None

    # Check if group should be disbanded (less than 2 members remaining)
    remaining_count = len(group.transactions) - len(txns_to_remove)
    if remaining_count < 2:
        # Disband the group - remove all remaining members
        for txn in group.transactions:
            if txn.id not in body.transaction_ids:
                txn.round_trip_group_id = None
        await db.delete(group)
        await db.commit()
        # Return a minimal response since group is deleted
        return RoundTripGroupResponse(
            id=group_id,
            display_order=group.display_order,
            member_count=0,
            created_at=group.created_at,
        )

    await db.commit()
    await db.refresh(group, ["transactions"])

    return _group_to_response(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    """Disband a round-trip group (remove all members)."""
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    # Fetch the group with its transactions
    result = await db.execute(
        select(RoundTripGroup)
        .where(RoundTripGroup.id == group_id, RoundTripGroup.user_sub == user_sub)
        .options(selectinload(RoundTripGroup.transactions))
    )
    group = result.scalar_one_or_none()
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    # Unlink all transactions
    for txn in group.transactions:
        txn.round_trip_group_id = None

    # Delete the group
    await db.delete(group)
    await db.commit()


@router.get("", response_model=list[RoundTripGroupResponse])
async def list_groups(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> list[RoundTripGroupResponse]:
    """List all round-trip groups for the current user."""
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    result = await db.execute(
        select(RoundTripGroup)
        .where(RoundTripGroup.user_sub == user_sub)
        .options(selectinload(RoundTripGroup.transactions))
        .offset(skip)
        .limit(limit)
    )
    groups = result.scalars().all()

    return [_group_to_response(g) for g in groups]


@router.get("/{group_id}", response_model=RoundTripGroupDetailResponse)
async def get_group(
    group_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> RoundTripGroupDetailResponse:
    """Get a specific round-trip group with its members."""
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    result = await db.execute(
        select(RoundTripGroup)
        .where(RoundTripGroup.id == group_id, RoundTripGroup.user_sub == user_sub)
        .options(selectinload(RoundTripGroup.transactions))
    )
    group = result.scalar_one_or_none()
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    members = [
        {
            "id": t.id,
            "activity_date": t.activity_date,
            "activity_type": t.activity_type,
            "description": t.description,
            "symbol": t.symbol,
            "quantity": t.quantity,
            "price": t.price,
            "amount": t.amount,
            "leg_type": t.leg_type,
            "strategy_group_id": t.strategy_group_id,
            "round_trip_group_id": t.round_trip_group_id,
            "created_at": t.created_at,
        }
        for t in group.transactions
    ]

    return RoundTripGroupDetailResponse(
        id=group.id,
        display_order=group.display_order,
        member_count=len(group.transactions),
        created_at=group.created_at,
        members=members,
    )
