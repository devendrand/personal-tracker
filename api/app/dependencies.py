"""Trade Tracker API - Shared dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_async_session

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> dict:
    """Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        Decoded token payload containing user info
        
    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # TODO: Look up user in database and return user model
    # For now, return the token payload
    return payload


async def get_db() -> AsyncSession:
    """Dependency alias for database session.
    
    This is a convenience wrapper around get_async_session.
    """
    async for session in get_async_session():
        yield session


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[dict, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
