"""Trade Tracker API - Transactions router."""

import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession
from app.models.trade import LegType, StrategyGroup, Transaction
from app.schemas.strategy_group import AssignLegRequest
from app.schemas.trade import (
    LegTypeOption,
    LegTypePatchRequest,
    TransactionResponse,
    UploadResponse,
)
from app.services.etrade_csv_parser import parse_etrade_csv
from app.services.transaction_import_service import import_rows

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def _txn_to_response(t: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=t.id,
        activity_date=t.activity_date,
        activity_type=t.activity_type,
        description=t.description,
        symbol=t.symbol,
        quantity=t.quantity,
        price=t.price,
        amount=t.amount,
        leg_type=LegType(t.leg_type) if t.leg_type else None,
        strategy_group_id=t.strategy_group_id,
        round_trip_group_id=t.round_trip_group_id,
        created_at=t.created_at,
    )


@router.get("")
async def list_transactions(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    tagged: bool | None = Query(None),
    leg_type: LegType | None = Query(None),
) -> list[TransactionResponse]:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    stmt = (
        select(Transaction)
        .where(Transaction.user_sub == user_sub)
        .order_by(Transaction.activity_date.desc())
    )

    if tagged is False and leg_type is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="leg_type filter requires tagged=true (or omitted)",
        )

    if tagged is True:
        stmt = stmt.where(Transaction.leg_type.is_not(None))
    if tagged is False:
        stmt = stmt.where(Transaction.leg_type.is_(None))

    if leg_type is not None:
        stmt = stmt.where(Transaction.leg_type == leg_type.value)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    txns = result.scalars().all()
    return [_txn_to_response(t) for t in txns]


@router.post("/upload")
async def upload_transactions(
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> UploadResponse:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    raw_bytes = await file.read()
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = raw_bytes.decode("utf-8", errors="ignore")

    try:
        parsed_rows, skipped_rows = parse_etrade_csv(text)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    try:
        batch = await import_rows(
            session=db,
            user_sub=user_sub,
            source_filename=file.filename or "upload.csv",
            parsed_rows=parsed_rows,
            skipped_rows=skipped_rows,
        )
    except Exception as exc:
        logger.exception("Transaction import failed", extra={"user_sub": user_sub})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Import failed. Please try again.",
        ) from exc

    logger.info(
        "Transaction import complete",
        extra={
            "user_sub": user_sub,
            "imported": batch.imported,
            "skipped": batch.skipped,
            "failed": batch.failed,
            "duplicates": batch.duplicates,
        },
    )

    return UploadResponse(
        imported=batch.imported,
        skipped=batch.skipped,
        failed=batch.failed,
        duplicates=batch.duplicates,
        unassigned=batch.imported,
    )


@router.post("/confirm")
async def confirm_transactions(db: DbSession, current_user: CurrentUser) -> dict:
    """Confirm and persist parsed transactions.

    Not used in the current import flow.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")


@router.get("/leg-types")
async def list_leg_types(
    current_user: CurrentUser,
) -> list[LegTypeOption]:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    return [
        LegTypeOption(
            value=LegType.CSP,
            label="Cash-Secured Put",
            description="Sell puts backed by cash; covers the full CSP lifecycle (open, BTC, expire, assign).",
        ),
        LegTypeOption(
            value=LegType.CC,
            label="Covered Call",
            description="Sell calls against held shares; covers the full CC lifecycle (open, BTC, expire, assign).",
        ),
        LegTypeOption(
            value=LegType.BUY,
            label="Buy",
            description="Equity purchase.",
        ),
        LegTypeOption(
            value=LegType.SELL,
            label="Sell",
            description="Equity sale.",
        ),
    ]


@router.patch("/{transaction_id}/leg-type")
async def patch_transaction_leg_type(
    transaction_id: str,
    payload: LegTypePatchRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> TransactionResponse:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    txn_result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id, Transaction.user_sub == user_sub
        )
    )
    txn = txn_result.scalar_one_or_none()
    if txn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    txn.leg_type = payload.leg_type.value if payload.leg_type else None
    await db.flush()

    logger.info(
        "Transaction leg_type updated",
        extra={
            "user_sub": user_sub,
            "transaction_id": txn.id,
            "leg_type": txn.leg_type,
        },
    )

    return _txn_to_response(txn)


@router.patch("/{transaction_id}/strategy-group")
async def patch_transaction_strategy_group(
    transaction_id: str,
    payload: AssignLegRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> TransactionResponse:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    txn_result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id, Transaction.user_sub == user_sub
        )
    )
    txn = txn_result.scalar_one_or_none()
    if txn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if payload.strategy_group_id is not None:
        if txn.symbol is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign a transaction with no symbol to a strategy group",
            )
        group_result = await db.execute(
            select(StrategyGroup).where(
                StrategyGroup.id == payload.strategy_group_id,
                StrategyGroup.user_sub == user_sub,
            )
        )
        group = group_result.scalar_one_or_none()
        if group is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Strategy group not found"
            )
        if group.symbol != txn.symbol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group symbol '{group.symbol}' does not match transaction symbol '{txn.symbol}'",
            )

    txn.strategy_group_id = payload.strategy_group_id
    await db.flush()

    logger.info(
        "Transaction strategy_group_id updated",
        extra={
            "user_sub": user_sub,
            "transaction_id": txn.id,
            "strategy_group_id": txn.strategy_group_id,
        },
    )

    return _txn_to_response(txn)
