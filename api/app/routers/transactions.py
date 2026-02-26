"""Trade Tracker API - Transactions router."""

import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession
from app.models.trade import StrategyType, Transaction
from app.schemas.trade import (
    StrategyTypeOption,
    TransactionResponse,
    TransactionStrategyTypePatchRequest,
    UploadResponse,
)
from app.services.etrade_csv_parser import parse_etrade_csv
from app.services.transaction_import_service import import_rows

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("")
async def list_transactions(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    tagged: bool | None = Query(None),
    strategy_type: StrategyType | None = Query(None),
) -> list[TransactionResponse]:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    stmt = (
        select(Transaction)
        .where(Transaction.user_sub == user_sub)
        .order_by(Transaction.activity_date.desc())
    )

    if tagged is False and strategy_type is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="strategy_type filter requires tagged=true (or omitted)",
        )

    if tagged is True:
        stmt = stmt.where(Transaction.strategy_type.is_not(None))
    if tagged is False:
        stmt = stmt.where(Transaction.strategy_type.is_(None))

    if strategy_type is not None:
        stmt = stmt.where(Transaction.strategy_type == strategy_type.value)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    txns = result.scalars().all()
    return [
        TransactionResponse(
            id=t.id,
            activity_date=t.activity_date,
            activity_type=t.activity_type,
            description=t.description,
            symbol=t.symbol,
            quantity=t.quantity,
            price=t.price,
            amount=t.amount,
            strategy_type=StrategyType(t.strategy_type) if t.strategy_type else None,
            created_at=t.created_at,
        )
        for t in txns
    ]


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


@router.get("/strategy-types")
async def list_strategy_types(
    current_user: CurrentUser,
) -> list[StrategyTypeOption]:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    return [
        StrategyTypeOption(
            value=StrategyType.WHEEL,
            label="Wheel",
            description="Sell CSPs, take assignment, then sell covered calls.",
        ),
        StrategyTypeOption(
            value=StrategyType.COVERED_CALL,
            label="Covered Call",
            description="Hold shares and sell calls against the position.",
        ),
        StrategyTypeOption(
            value=StrategyType.COLLAR,
            label="Collar",
            description="Hold shares with a protective put and a covered call.",
        ),
        StrategyTypeOption(
            value=StrategyType.CSP,
            label="Cash-Secured Put",
            description="Sell puts backed by cash; may lead to assignment.",
        ),
        StrategyTypeOption(
            value=StrategyType.LONG_HOLD,
            label="Long Hold",
            description="Long-term investment buys/holds (non-options focused).",
        ),
        StrategyTypeOption(
            value=StrategyType.SIP,
            label="SIP",
            description="Systematic investment plan / recurring investing.",
        ),
    ]


@router.patch("/{transaction_id}/strategy-type")
async def patch_transaction_strategy_type(
    transaction_id: str,
    payload: TransactionStrategyTypePatchRequest,
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

    txn.strategy_type = payload.strategy_type.value if payload.strategy_type else None
    await db.flush()

    logger.info(
        "Transaction strategy_type updated",
        extra={
            "user_sub": user_sub,
            "transaction_id": txn.id,
            "strategy_type": txn.strategy_type,
        },
    )

    return TransactionResponse(
        id=txn.id,
        activity_date=txn.activity_date,
        activity_type=txn.activity_type,
        description=txn.description,
        symbol=txn.symbol,
        quantity=txn.quantity,
        price=txn.price,
        amount=txn.amount,
        strategy_type=StrategyType(txn.strategy_type) if txn.strategy_type else None,
        created_at=txn.created_at,
    )
