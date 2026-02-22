"""Personal Tracker API - SQLAlchemy models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


# Import all models here for Alembic to discover them
# Note: Imports are placed after Base to avoid circular imports
# ruff: noqa: E402
from app.models.networth import NWAccount, NWSnapshot, NWSnapshotBalance
from app.models.swim import SwimEvent, SwimMeet, Swimmer, SwimTime

__all__ = [
    "Base",
    "Swimmer",
    "SwimEvent",
    "SwimMeet",
    "SwimTime",
    "NWAccount",
    "NWSnapshot",
    "NWSnapshotBalance",
]
