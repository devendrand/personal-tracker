"""Tests for authentication endpoints."""

from __future__ import annotations

import asyncio
import time

import pytest
from httpx import AsyncClient
from jose import jwt

from app.core.config import settings


@pytest.mark.asyncio
async def test_dev_token_returns_200(client: AsyncClient) -> None:
    """GET /api/auth/dev-token returns HTTP 200."""
    response = await client.get("/api/auth/dev-token")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_dev_token_response_contains_access_token(client: AsyncClient) -> None:
    """Response body contains a non-empty access_token string field."""
    response = await client.get("/api/auth/dev-token")
    data = response.json()
    assert "access_token" in data
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 0


@pytest.mark.asyncio
async def test_dev_token_payload_has_dev_user_sub(client: AsyncClient) -> None:
    """Decoded token payload contains sub == 'dev_user'."""
    response = await client.get("/api/auth/dev-token")
    token = response.json()["access_token"]
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "dev_user"


@pytest.mark.asyncio
async def test_dev_token_has_future_expiry(client: AsyncClient) -> None:
    """Decoded token exp claim is greater than current UTC timestamp."""
    response = await client.get("/api/auth/dev-token")
    token = response.json()["access_token"]
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["exp"] > int(time.time())


@pytest.mark.asyncio
async def test_dev_token_fresh_per_call(client: AsyncClient) -> None:
    """Two consecutive calls return tokens with different exp values (fresh per call)."""
    response1 = await client.get("/api/auth/dev-token")
    await asyncio.sleep(1)
    response2 = await client.get("/api/auth/dev-token")

    token1 = response1.json()["access_token"]
    token2 = response2.json()["access_token"]

    payload1 = jwt.decode(token1, settings.secret_key, algorithms=[settings.algorithm])
    payload2 = jwt.decode(token2, settings.secret_key, algorithms=[settings.algorithm])

    assert payload2["exp"] > payload1["exp"], (
        "Expected each call to return a freshly minted token with a later exp, "
        f"but got exp1={payload1['exp']} and exp2={payload2['exp']}"
    )
