from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.etrade_csv_parser import ParsedRow
from app.services.transaction_import_service import import_rows


async def test_import_rows_imports_and_counts_duplicates(db_session: AsyncSession):
    row = ParsedRow(
        raw={"Activity/Trade Date": "01/01/26", "Activity Type": "BUY", "Description": "Test"},
        activity_date=date(2026, 1, 1),
        transaction_date=None,
        settlement_date=None,
        activity_type="BUY",
        description="Test transaction",
        symbol="AAPL",
        cusip=None,
        quantity=Decimal("1"),
        price=Decimal("100"),
        amount=Decimal("100"),
        commission=None,
        category=None,
        note=None,
    )

    batch1 = await import_rows(
        session=db_session,
        user_sub="dev_user",
        source_filename="sample.csv",
        parsed_rows=[row],
        skipped_rows=[],
    )
    assert batch1.imported == 1
    assert batch1.duplicates == 0
    assert batch1.skipped == 0
    assert batch1.brokerage_account_id == "pseudo:dev_user"

    # Import same row again: should be detected as a duplicate and skipped.
    batch2 = await import_rows(
        session=db_session,
        user_sub="dev_user",
        source_filename="sample.csv",
        parsed_rows=[row],
        skipped_rows=[],
    )
    assert batch2.imported == 0
    assert batch2.duplicates == 1
