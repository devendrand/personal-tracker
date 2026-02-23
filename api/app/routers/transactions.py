"""Trade Tracker API - Transactions router."""

import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select

from app.dependencies import CurrentUser, DbSession
from app.models.trade import Portfolio, Transaction
from app.schemas.trade import TransactionResponse, TransactionTagRequest, UploadResponse
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
    assigned: bool | None = Query(None),
) -> list[TransactionResponse]:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    stmt = select(Transaction).where(Transaction.user_sub == user_sub).order_by(Transaction.activity_date.desc())
    if assigned is True:
        stmt = stmt.where(Transaction.portfolio_id.is_not(None))
    if assigned is False:
        stmt = stmt.where(Transaction.portfolio_id.is_(None))

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
            portfolio_id=t.portfolio_id,
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


@router.post("/{transaction_id}/tag")
async def tag_transaction(
    transaction_id: str,
    payload: TransactionTagRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> TransactionResponse:
    user_sub = str(current_user.get("sub") or "")
    if not user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    txn_result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_sub == user_sub)
    )
    txn = txn_result.scalar_one_or_none()
    if txn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    portfolio_result = await db.execute(
        select(Portfolio).where(Portfolio.id == payload.portfolio_id, Portfolio.user_sub == user_sub)
    )
    portfolio = portfolio_result.scalar_one_or_none()
    if portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    txn.portfolio_id = portfolio.id
    await db.flush()

    logger.info(
        "Transaction tagged",
        extra={"user_sub": user_sub, "transaction_id": txn.id, "portfolio_id": portfolio.id},
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
        portfolio_id=txn.portfolio_id,
        created_at=txn.created_at,
    )
