"""Round-trip group schemas — Pydantic models for round-trip API."""

from datetime import datetime

from pydantic import BaseModel


class RoundTripGroupResponse(BaseModel):
    """Response schema for a round-trip group."""

    id: str
    display_order: int
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RoundTripGroupDetailResponse(BaseModel):
    """Response schema for a round-trip group with member transactions."""

    id: str
    display_order: int
    member_count: int
    created_at: datetime
    members: list[dict]  # Transaction details

    model_config = {"from_attributes": True}


class LinkTransactionsRequest(BaseModel):
    """Request to link transactions into a new round-trip group."""

    transaction_ids: list[str]


class AddToGroupRequest(BaseModel):
    """Request to add transactions to an existing group."""

    transaction_ids: list[str]


class RemoveFromGroupRequest(BaseModel):
    """Request to remove transactions from a group."""

    transaction_ids: list[str]


class ConflictTransaction(BaseModel):
    """Details of a conflicting transaction."""

    id: str
    current_group_id: str


class ConflictResponse(BaseModel):
    """Response when a conflict is detected."""

    detail: str
    conflicting_transactions: list[ConflictTransaction]
