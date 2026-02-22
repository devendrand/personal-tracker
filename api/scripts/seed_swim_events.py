"""Swim Event Seed Script - Populates standard swimming events."""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.swim import DistanceUnit, PoolType, Stroke, SwimEvent

# Standard swim events for each pool type
STANDARD_EVENTS = [
    # SCY Events (Short Course Yards - USA)
    {
        "distance": 25,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 500,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 1000,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 1650,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 25,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 25,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 25,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCY,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.YARDS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCY,
    },
    {"distance": 100, "unit": DistanceUnit.YARDS, "stroke": Stroke.IM, "pool_type": PoolType.SCY},
    {"distance": 200, "unit": DistanceUnit.YARDS, "stroke": Stroke.IM, "pool_type": PoolType.SCY},
    {"distance": 400, "unit": DistanceUnit.YARDS, "stroke": Stroke.IM, "pool_type": PoolType.SCY},
    # SCM Events (Short Course Meters)
    {
        "distance": 25,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 400,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 800,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 1500,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 25,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 25,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 25,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.SCM,
    },
    {"distance": 100, "unit": DistanceUnit.METERS, "stroke": Stroke.IM, "pool_type": PoolType.SCM},
    {"distance": 200, "unit": DistanceUnit.METERS, "stroke": Stroke.IM, "pool_type": PoolType.SCM},
    {"distance": 400, "unit": DistanceUnit.METERS, "stroke": Stroke.IM, "pool_type": PoolType.SCM},
    # LCM Events (Long Course Meters - Olympic)
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 400,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 800,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 1500,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.FREESTYLE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BACKSTROKE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BREASTSTROKE,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 50,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 100,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.LCM,
    },
    {
        "distance": 200,
        "unit": DistanceUnit.METERS,
        "stroke": Stroke.BUTTERFLY,
        "pool_type": PoolType.LCM,
    },
    {"distance": 200, "unit": DistanceUnit.METERS, "stroke": Stroke.IM, "pool_type": PoolType.LCM},
    {"distance": 400, "unit": DistanceUnit.METERS, "stroke": Stroke.IM, "pool_type": PoolType.LCM},
]


async def seed_swim_events() -> None:
    """Seed the database with standard swim events."""
    engine = create_async_engine(settings.database_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if events already exist
        result = await session.execute(select(SwimEvent).limit(1))
        if result.scalar_one_or_none():
            print("Swim events already seeded. Skipping.")
            return

        # Insert all events
        events = []
        for event_data in STANDARD_EVENTS:
            event = SwimEvent(
                distance=event_data["distance"],
                unit=event_data["unit"],
                stroke=event_data["stroke"],
                pool_type=event_data["pool_type"],
            )
            events.append(event)

        session.add_all(events)
        await session.commit()
        print(f"Successfully seeded {len(events)} swim events.")


if __name__ == "__main__":
    asyncio.run(seed_swim_events())
