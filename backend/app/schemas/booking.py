from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_validator


PURPOSES = {"office", "shopping", "event", "residential_visit",
            "short_stay", "long_stay", "other"}


class BookingCreate(BaseModel):
    parking_id: UUID
    start_time: datetime
    end_time: datetime
    purpose: str

    @field_validator("purpose")
    @classmethod
    def validate_purpose(cls, v: str) -> str:
        if v.lower() not in PURPOSES:
            raise ValueError(f"purpose must be one of {PURPOSES}")
        return v.lower()

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: datetime, info) -> datetime:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time must be after start_time")
        return v


class BookingUpdate(BaseModel):
    booking_status: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingOut(BaseModel):
    id: UUID
    user_id: UUID
    parking_id: UUID
    start_time: datetime
    end_time: datetime
    purpose: str
    total_hours: float
    total_amount: float
    platform_commission: float
    owner_payout: float
    payment_status: str
    booking_status: str
    location_revealed: bool
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Revealed only after payment
    exact_latitude: Optional[float] = None
    exact_longitude: Optional[float] = None

    model_config = {"from_attributes": True}
