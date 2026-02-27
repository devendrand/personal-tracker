"""PnL service — calculate realized PnL from tagged transactions."""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from app.models.trade import LegType, Transaction
from app.schemas.pnl import LegPnL, PnLSummaryResponse, StrategyGroupPnL, TickerPnL


def calculate_pnl(transactions: list[Transaction]) -> PnLSummaryResponse:
    """Calculate hierarchical PnL from a list of tagged transactions.

    Only transactions with leg_type IS NOT NULL and symbol IS NOT NULL are included.
    PnL per leg = transaction.amount (already net cash in/out).
    """
    # Filter to tagged, symbol-bearing transactions only
    tagged = [t for t in transactions if t.leg_type is not None and t.symbol is not None]

    if not tagged:
        return PnLSummaryResponse(
            total_realized_pnl=Decimal("0"),
            tickers=[],
            total_transaction_count=0,
            total_commission=Decimal("0"),
        )

    # Group: symbol → strategy_group_id → [transactions]
    by_symbol: dict[str, dict[str | None, list[Transaction]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for txn in tagged:
        by_symbol[txn.symbol][txn.strategy_group_id].append(txn)  # type: ignore[index]

    ticker_results: list[TickerPnL] = []

    for symbol in sorted(by_symbol.keys()):
        groups_map = by_symbol[symbol]
        group_results: list[StrategyGroupPnL] = []

        # Named groups first (sorted by id/name), then None (Ungrouped)
        named_group_ids = sorted(gid for gid in groups_map if gid is not None)
        group_order = named_group_ids + ([None] if None in groups_map else [])

        for group_id in group_order:
            legs = sorted(groups_map[group_id], key=lambda t: t.activity_date)
            leg_pnls: list[LegPnL] = []

            for txn in legs:
                assert txn.leg_type is not None  # guaranteed by tagged filter above
                amount = Decimal(str(txn.amount)) if txn.amount is not None else Decimal("0")
                commission_raw = (
                    Decimal(str(txn.commission)) if txn.commission is not None else Decimal("0")
                )
                realized_pnl = amount + commission_raw
                commission_abs = abs(commission_raw)
                leg_pnls.append(
                    LegPnL(
                        transaction_id=txn.id,
                        activity_date=txn.activity_date,
                        activity_type=txn.activity_type,
                        description=txn.description,
                        leg_type=LegType(txn.leg_type),
                        amount=amount,
                        realized_pnl=realized_pnl,
                        commission=commission_abs,
                    )
                )

            group_total = sum((leg.realized_pnl for leg in leg_pnls), Decimal("0"))
            group_transaction_count = len(leg_pnls)
            group_commission = sum((leg.commission for leg in leg_pnls), Decimal("0"))
            group_name = "Ungrouped" if group_id is None else _group_name(txn, group_id, legs)

            group_results.append(
                StrategyGroupPnL(
                    strategy_group_id=group_id,
                    name=group_name,
                    total_realized_pnl=group_total,
                    legs=leg_pnls,
                    transaction_count=group_transaction_count,
                    total_commission=group_commission,
                )
            )

        ticker_total = sum((g.total_realized_pnl for g in group_results), Decimal("0"))
        ticker_count = sum(g.transaction_count for g in group_results)
        ticker_commission = sum((g.total_commission for g in group_results), Decimal("0"))
        ticker_results.append(
            TickerPnL(
                symbol=symbol,
                total_realized_pnl=ticker_total,
                groups=group_results,
                transaction_count=ticker_count,
                total_commission=ticker_commission,
            )
        )

    grand_total = sum((t.total_realized_pnl for t in ticker_results), Decimal("0"))
    grand_count = sum(t.transaction_count for t in ticker_results)
    grand_commission = sum((t.total_commission for t in ticker_results), Decimal("0"))
    return PnLSummaryResponse(
        total_realized_pnl=grand_total,
        tickers=ticker_results,
        total_transaction_count=grand_count,
        total_commission=grand_commission,
    )


def _group_name(last_txn: Transaction, group_id: str, legs: list[Transaction]) -> str:
    """Retrieve group name from the strategy_group relationship on any leg."""
    for leg in legs:
        if leg.strategy_group is not None and leg.strategy_group.id == group_id:
            return leg.strategy_group.name
    return group_id
