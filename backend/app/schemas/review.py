from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    booking_id: UUID
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def valid_rating(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: UUID
    booking_id: UUID
    reviewer_id: UUID
    parking_id: UUID
    rating: int
    comment: Optional[str] = None
    owner_reply: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
