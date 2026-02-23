"""Transaction import service."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trade import ImportBatch, Transaction
from app.services.etrade_csv_parser import ParsedRow


def _pseudo_account_id(user_sub: str) -> str:
    return f"pseudo:{user_sub}"


def _dedupe_key(user_sub: str, row: ParsedRow) -> str:
    parts = [
        user_sub,
        row.activity_date.isoformat(),
        row.activity_type.strip(),
        row.description.strip(),
        (row.symbol or ""),
        str(row.quantity or ""),
        str(row.amount or ""),
    ]
    raw = "|".join(parts).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


async def import_rows(
    *,
    session: AsyncSession,
    user_sub: str,
    source_filename: str,
    parsed_rows: list[ParsedRow],
    skipped_rows: list[dict],
) -> ImportBatch:
    brokerage_account_id = _pseudo_account_id(user_sub)

    batch = ImportBatch(
        user_sub=user_sub,
        source_filename=source_filename,
        brokerage_account_id=brokerage_account_id,
        imported=0,
        skipped=len(skipped_rows),
        failed=0,
        duplicates=0,
        errors=skipped_rows,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    session.add(batch)
    await session.flush()

    for row in parsed_rows:
        dedupe = _dedupe_key(user_sub, row)
        existing = await session.execute(
            select(Transaction.id).where(Transaction.user_sub == user_sub, Transaction.dedupe_key == dedupe)
        )
        if existing.scalar_one_or_none() is not None:
            batch.duplicates += 1
            continue

        txn = Transaction(
            user_sub=user_sub,
            import_batch_id=batch.id,
            brokerage_account_id=brokerage_account_id,
            activity_date=row.activity_date,
            transaction_date=row.transaction_date,
            settlement_date=row.settlement_date,
            activity_type=row.activity_type,
            description=row.description,
            symbol=row.symbol,
            cusip=row.cusip,
            quantity=row.quantity,
            price=row.price,
            amount=row.amount,
            commission=row.commission,
            category=row.category,
            note=row.note,
            raw=row.raw,
            portfolio_id=None,
            dedupe_key=dedupe,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        session.add(txn)
        batch.imported += 1

    return batch
