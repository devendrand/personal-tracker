"""Swim Performance Tracker - Pydantic schemas."""

from datetime import date

from pydantic import BaseModel, Field, field_validator

# --- Swimmer Schemas ---


class SwimmerBase(BaseModel):
    """Base swimmer schema."""

    name: str = Field(..., min_length=1, max_length=255)
    date_of_birth: date
    team_name: str | None = Field(None, max_length=255)


class SwimmerCreate(SwimmerBase):
    """Schema for creating a swimmer."""

    pass


class SwimmerUpdate(BaseModel):
    """Schema for updating a swimmer."""

    name: str | None = Field(None, min_length=1, max_length=255)
    date_of_birth: date | None = None
    team_name: str | None = Field(None, max_length=255)


class SwimmerResponse(SwimmerBase):
    """Schema for swimmer response."""

    id: int
    age: int  # Calculated field

    model_config = {"from_attributes": True}


# --- Swim Event Schemas ---


class SwimEventResponse(BaseModel):
    """Schema for swim event response."""

    id: int
    distance: int
    unit: str
    stroke: str
    pool_type: str
    display_name: str

    model_config = {"from_attributes": True}


# --- Swim Meet Schemas ---


class SwimMeetBase(BaseModel):
    """Base swim meet schema."""

    name: str = Field(..., min_length=1, max_length=255)
    date: date
    location: str | None = Field(None, max_length=255)
    notes: str | None = None


class SwimMeetCreate(SwimMeetBase):
    """Schema for creating a swim meet."""

    pass


class SwimMeetResponse(SwimMeetBase):
    """Schema for swim meet response."""

    id: int

    model_config = {"from_attributes": True}


# --- Swim Time Schemas ---


class SwimTimeBase(BaseModel):
    """Base swim time schema."""

    event_id: int
    time_formatted: str = Field(
        ..., pattern=r"^\d{1,2}:\d{2}\.\d{2}$", description="Time in mm:ss.hh format"
    )
    recorded_date: date
    pool_type: str = Field(..., pattern=r"^(SCY|SCM|LCM)$")
    meet_name: str | None = Field(None, max_length=255)  # Will auto-create meet if new
    notes: str | None = None


class SwimTimeCreate(SwimTimeBase):
    """Schema for creating a swim time."""

    @field_validator("time_formatted")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        """Validate and parse time format."""
        parts = v.split(":")
        if len(parts) != 2:
            raise ValueError("Time must be in mm:ss.hh format")
        int(parts[0])  # Validate minutes is an integer
        seconds = float(parts[1])
        if seconds >= 60:
            raise ValueError("Seconds must be less than 60")
        return v


class SwimTimeUpdate(BaseModel):
    """Schema for updating a swim time."""

    event_id: int | None = None
    time_formatted: str | None = Field(None, pattern=r"^\d{1,2}:\d{2}\.\d{2}$")
    recorded_date: date | None = None
    pool_type: str | None = Field(None, pattern=r"^(SCY|SCM|LCM)$")
    notes: str | None = None


class SwimTimeResponse(BaseModel):
    """Schema for swim time response."""

    id: int
    swimmer_id: int
    event_id: int
    meet_id: int | None
    time_seconds: float
    time_formatted: str
    recorded_date: date
    pool_type: str
    notes: str | None
    is_pr: bool
    event: SwimEventResponse

    model_config = {"from_attributes": True}


# --- Report Schemas ---


class PRDashboardRow(BaseModel):
    """Schema for PR dashboard row."""

    event_id: int
    event_name: str
    pool_type: str
    current_pr: str  # Formatted time
    current_pr_seconds: float
    pr_date: date
    first_time: str  # Formatted time
    first_time_seconds: float
    improvement_seconds: float
    improvement_percent: float
    total_times_logged: int


class EventProgressionPoint(BaseModel):
    """Single data point for event progression chart."""

    date: date
    time_seconds: float
    time_formatted: str
    is_pr: bool
    meet_name: str | None


class EventProgressionResponse(BaseModel):
    """Response for event progression chart."""

    event: SwimEventResponse
    times: list[EventProgressionPoint]
