"""Swim Performance Tracker - SQLAlchemy models."""

from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class PoolType(str, Enum):
    """Supported pool types."""
    SCY = "SCY"  # Short Course Yards
    SCM = "SCM"  # Short Course Meters
    LCM = "LCM"  # Long Course Meters


class Stroke(str, Enum):
    """Supported swim strokes."""
    FREESTYLE = "Freestyle"
    BACKSTROKE = "Backstroke"
    BREASTSTROKE = "Breaststroke"
    BUTTERFLY = "Butterfly"
    IM = "Individual Medley"


class DistanceUnit(str, Enum):
    """Distance unit."""
    YARDS = "yards"
    METERS = "meters"


class Swimmer(Base):
    """Single swimmer profile."""
    
    __tablename__ = "swimmer"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    team_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    times: Mapped[list["SwimTime"]] = relationship("SwimTime", back_populates="swimmer")


class SwimEvent(Base):
    """Pre-populated catalog of valid competitive swim events."""
    
    __tablename__ = "swim_event"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    distance: Mapped[int] = mapped_column(Integer, nullable=False)  # e.g., 50, 100, 200
    unit: Mapped[str] = mapped_column(String(10), nullable=False)  # yards or meters
    stroke: Mapped[str] = mapped_column(String(50), nullable=False)
    pool_type: Mapped[str] = mapped_column(String(10), nullable=False)  # SCY, SCM, LCM
    
    # Computed display name (e.g., "100y Freestyle SCY")
    @property
    def display_name(self) -> str:
        unit_abbrev = "y" if self.unit == DistanceUnit.YARDS.value else "m"
        return f"{self.distance}{unit_abbrev} {self.stroke} ({self.pool_type})"
    
    # Relationships
    times: Mapped[list["SwimTime"]] = relationship("SwimTime", back_populates="event")


class SwimMeet(Base):
    """Swim meet / competition."""
    
    __tablename__ = "swim_meet"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    times: Mapped[list["SwimTime"]] = relationship("SwimTime", back_populates="meet")


class SwimTime(Base):
    """Individual swim time record."""
    
    __tablename__ = "swim_time"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    swimmer_id: Mapped[int] = mapped_column(Integer, ForeignKey("swimmer.id"), nullable=False)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("swim_event.id"), nullable=False)
    meet_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("swim_meet.id"), nullable=True)
    
    time_seconds: Mapped[float] = mapped_column(Float, nullable=False)  # Stored as decimal seconds
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)
    pool_type: Mapped[str] = mapped_column(String(10), nullable=False)  # SCY, SCM, LCM
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_pr: Mapped[bool] = mapped_column(Boolean, default=False)  # Personal Record flag
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    swimmer: Mapped["Swimmer"] = relationship("Swimmer", back_populates="times")
    event: Mapped["SwimEvent"] = relationship("SwimEvent", back_populates="times")
    meet: Mapped[Optional["SwimMeet"]] = relationship("SwimMeet", back_populates="times")
    
    @property
    def time_formatted(self) -> str:
        """Format time as mm:ss.hh"""
        minutes = int(self.time_seconds // 60)
        seconds = self.time_seconds % 60
        return f"{minutes}:{seconds:05.2f}"
