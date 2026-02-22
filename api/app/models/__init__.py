"""Personal Tracker API - SQLAlchemy models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    
    pass


# Import all models here for Alembic to discover them
# Trade Tracker models (to be added)
# from app.models.transaction import Transaction
# from app.models.portfolio import Portfolio

# Swim Tracker models
from app.models.swim import Swimmer, SwimEvent, SwimMeet, SwimTime

# Net Worth Tracker models
from app.models.networth import NWAccount, NWSnapshot, NWSnapshotBalance

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
