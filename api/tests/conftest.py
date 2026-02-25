from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any, Awaitable, Callable

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.dependencies import get_db
from app.main import app
from app.models import Base
from app.models.trade import Portfolio


@pytest.fixture
async def db_engine(tmp_path: Any) -> AsyncGenerator[AsyncEngine, None]:
    db_path = tmp_path / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture
def db_session_maker(db_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture
async def db_session(db_session_maker: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncSession, None]:
    async with db_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


@pytest.fixture
def create_portfolio(db_session: AsyncSession) -> Callable[[str, str], Awaitable[Portfolio]]:
    async def _create_portfolio(user_sub: str, name: str = "Test Portfolio") -> Portfolio:
        portfolio = Portfolio(user_sub=user_sub, name=name)
        db_session.add(portfolio)
        await db_session.commit()
        await db_session.refresh(portfolio)
        return portfolio

    return _create_portfolio


@pytest.fixture
async def client(db_session_maker: async_sessionmaker[AsyncSession]) -> AsyncGenerator[AsyncClient, None]:

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with db_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client

    app.dependency_overrides.clear()
