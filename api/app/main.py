"""Personal Tracker API - Main FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    auth_router,
    networth_router,
    pnl_router,
    portfolios_router,
    round_trip_router,
    strategy_groups_router,
    swim_router,
    transactions_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print(f"Starting {settings.app_name}...")
    yield
    # Shutdown
    print(f"Shutting down {settings.app_name}...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Personal Tracker API - Trade Tracking, Swim Performance, Net Worth",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # Angular dev server
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(strategy_groups_router, prefix="/api")
app.include_router(pnl_router, prefix="/api")
app.include_router(portfolios_router, prefix="/api")
app.include_router(swim_router, prefix="/api")
app.include_router(networth_router, prefix="/api")
app.include_router(round_trip_router, prefix="/api")


@app.get("/")
async def root() -> dict:
    """Root endpoint - health check."""
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "status": "healthy",
    }


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for container orchestration."""
    return {"status": "healthy"}
