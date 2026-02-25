"""E*TRADE CSV parsing utilities."""

from __future__ import annotations

import csv
import io
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

REQUIRED_COLUMNS = {
    "Activity/Trade Date",
    "Activity Type",
    "Description",
    "Amount $",
}


@dataclass(frozen=True)
class ParsedRow:
    raw: dict[str, str]
    activity_date: date
    transaction_date: date | None
    settlement_date: date | None
    activity_type: str
    description: str
    symbol: str | None
    cusip: str | None
    quantity: Decimal | None
    price: Decimal | None
    amount: Decimal | None
    commission: Decimal | None
    category: str | None
    note: str | None


def _parse_date(value: str) -> date | None:
    v = value.strip()
    if not v or v == "--":
        return None
    for fmt in ("%m/%d/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    return None


def _parse_decimal(value: str) -> Decimal | None:
    v = value.strip()
    if not v or v == "--":
        return None
    v = v.replace(",", "")
    v = v.replace("$", "")
    try:
        return Decimal(v)
    except (InvalidOperation, ValueError):
        return None


def _clean_str(value: str) -> str | None:
    v = value.strip()
    if not v or v == "--":
        return None
    return v


def parse_etrade_csv(text: str) -> tuple[list[ParsedRow], list[dict]]:
    """Parse an E*TRADE Account Activity CSV export.

    Returns:
        (parsed_rows, skipped_rows)

    skipped_rows items include: {"line": int, "reason": str}
    """

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    header_idx = None
    header: list[str] | None = None
    for idx, row in enumerate(rows):
        if not row:
            continue
        if REQUIRED_COLUMNS.issubset(set(r.strip() for r in row)):
            header_idx = idx
            header = [c.strip() for c in row]
            break

    if header_idx is None or header is None:
        raise ValueError("Missing required header columns")

    parsed: list[ParsedRow] = []
    skipped: list[dict] = []

    for offset, row in enumerate(rows[header_idx + 1 :], start=header_idx + 2):
        if not row or all(not cell.strip() for cell in row):
            continue

        # Footer/disclaimer lines often appear after the table; ignore them.
        if len(row) < len(header):
            continue

        raw = {header[i]: (row[i] if i < len(row) else "") for i in range(len(header))}

        activity_date = _parse_date(raw.get("Activity/Trade Date", ""))
        activity_type = raw.get("Activity Type", "").strip()
        description = raw.get("Description", "").strip()

        # If it doesn't look like a transaction row, ignore it (FR-003).
        if activity_date is None:
            continue

        if not activity_type or not description:
            skipped.append({"line": offset, "reason": "Missing required fields"})
            continue

        parsed.append(
            ParsedRow(
                raw=raw,
                activity_date=activity_date,
                transaction_date=_parse_date(raw.get("Transaction Date", "")),
                settlement_date=_parse_date(raw.get("Settlement Date", "")),
                activity_type=activity_type,
                description=description,
                symbol=_clean_str(raw.get("Symbol", "")),
                cusip=_clean_str(raw.get("Cusip", "")),
                quantity=_parse_decimal(raw.get("Quantity #", "")),
                price=_parse_decimal(raw.get("Price $", "")),
                amount=_parse_decimal(raw.get("Amount $", "")),
                commission=_parse_decimal(raw.get("Commission", "")),
                category=_clean_str(raw.get("Category", "")),
                note=_clean_str(raw.get("Note", "")),
            )
        )

    return parsed, skipped
