"""Trade Tracker API - Authentication router."""

from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import DEV_TOKEN, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class Token(BaseModel):
    """Token response schema."""
    
    access_token: str
    token_type: str = "bearer"


class TokenRequest(BaseModel):
    """Token request schema (stub - no real auth yet)."""
    
    username: str
    password: str


@router.post("/token", response_model=Token)
async def login_for_access_token(request: TokenRequest) -> Token:
    """Get an access token.
    
    STUB: Currently returns a dev token for any credentials.
    Real authentication will be implemented in a future milestone.
    """
    # TODO: Implement real user authentication
    # For now, accept any credentials and return a dev token
    access_token = create_access_token(
        data={"sub": request.username},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(access_token=access_token)


@router.get("/dev-token", response_model=Token)
async def get_dev_token() -> Token:
    """Get a development token for testing.
    
    WARNING: Remove this endpoint in production!
    """
    return Token(access_token=DEV_TOKEN)
