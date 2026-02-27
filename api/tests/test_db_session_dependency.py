from __future__ import annotations

import pytest
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.db import session as session_module
from app.models import Base


async def _make_engine(db_path: str) -> AsyncEngine:
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return engine


async def test_get_async_session_commits_and_closes(tmp_path, monkeypatch):
    engine = await _make_engine(str(tmp_path / "session_commit.db"))
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(session_module, "async_session_maker", maker)

    commit_called = False
    close_called = False

    async for db in session_module.get_async_session():
        original_commit = db.commit
        original_close = db.close

        async def commit_spy(*, _original_commit=original_commit) -> None:
            nonlocal commit_called
            commit_called = True
            await _original_commit()

        async def close_spy(*, _original_close=original_close) -> None:
            nonlocal close_called
            close_called = True
            await _original_close()

        db.commit = commit_spy  # type: ignore[method-assign]
        db.close = close_spy  # type: ignore[method-assign]

        await db.execute(sa.text("SELECT 1"))

    assert commit_called is True
    assert close_called is True
    await engine.dispose()


async def test_get_async_session_rolls_back_on_exception(tmp_path, monkeypatch):
    engine = await _make_engine(str(tmp_path / "session_rollback.db"))
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(session_module, "async_session_maker", maker)

    rollback_called = False

    agen = session_module.get_async_session()
    db = await anext(agen)
    original_rollback = db.rollback

    async def rollback_spy() -> None:
        nonlocal rollback_called
        rollback_called = True
        await original_rollback()

    db.rollback = rollback_spy  # type: ignore[method-assign]

    with pytest.raises(RuntimeError):
        await agen.athrow(RuntimeError("boom"))

    await agen.aclose()

    assert rollback_called is True
    await engine.dispose()
