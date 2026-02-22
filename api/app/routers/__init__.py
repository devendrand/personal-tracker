"""Personal Tracker API - Routers module."""

from app.routers.auth import router as auth_router
from app.routers.portfolios import router as portfolios_router
from app.routers.transactions import router as transactions_router
from app.routers.swim import router as swim_router
from app.routers.networth import router as networth_router

__all__ = [
    "auth_router",
    "transactions_router",
    "portfolios_router",
    "swim_router",
    "networth_router",
]
