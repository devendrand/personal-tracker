"""Migration smoke tests — verify the new schema shape is in place.

These tests are written FIRST and must FAIL before model changes (T003).
After the model + migration are applied (T006), all tests here must PASS.
"""

from __future__ import annotations

import pytest
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncEngine


@pytest.mark.anyio
async def test_strategy_group_table_exists(db_engine: AsyncEngine) -> None:
    """strategy_group table must exist after migration."""

    def _check(conn):  # type: ignore[no-untyped-def]
        inspector = inspect(conn)
        return "strategy_group" in inspector.get_table_names()

    async with db_engine.begin() as conn:
        result = await conn.run_sync(_check)
    assert result, "strategy_group table does not exist"


@pytest.mark.anyio
async def test_transaction_leg_type_column_exists(db_engine: AsyncEngine) -> None:
    """transaction.leg_type column must exist after migration."""

    def _get_columns(conn):  # type: ignore[no-untyped-def]
        inspector = inspect(conn)
        return [c["name"] for c in inspector.get_columns("transaction")]

    async with db_engine.begin() as conn:
        columns = await conn.run_sync(_get_columns)
    assert "leg_type" in columns, f"leg_type column missing from transaction. Columns: {columns}"


@pytest.mark.anyio
async def test_transaction_strategy_group_id_column_exists(db_engine: AsyncEngine) -> None:
    """transaction.strategy_group_id FK column must exist after migration."""

    def _get_columns(conn):  # type: ignore[no-untyped-def]
        inspector = inspect(conn)
        return [c["name"] for c in inspector.get_columns("transaction")]

    async with db_engine.begin() as conn:
        columns = await conn.run_sync(_get_columns)
    assert "strategy_group_id" in columns, (
        f"strategy_group_id column missing from transaction. Columns: {columns}"
    )


@pytest.mark.anyio
async def test_transaction_strategy_type_column_absent(db_engine: AsyncEngine) -> None:
    """transaction.strategy_type column must NOT exist after migration (dropped)."""

    def _get_columns(conn):  # type: ignore[no-untyped-def]
        inspector = inspect(conn)
        return [c["name"] for c in inspector.get_columns("transaction")]

    async with db_engine.begin() as conn:
        columns = await conn.run_sync(_get_columns)
    assert "strategy_type" not in columns, (
        f"strategy_type column still present in transaction. It must be dropped. Columns: {columns}"
    )


@pytest.mark.anyio
async def test_strategy_group_columns(db_engine: AsyncEngine) -> None:
    """strategy_group table must have required columns."""

    def _get_columns(conn):  # type: ignore[no-untyped-def]
        inspector = inspect(conn)
        return [c["name"] for c in inspector.get_columns("strategy_group")]

    async with db_engine.begin() as conn:
        columns = await conn.run_sync(_get_columns)

    required = {"id", "user_sub", "name", "symbol", "created_at", "updated_at"}
    missing = required - set(columns)
    assert not missing, f"strategy_group table missing columns: {missing}"
