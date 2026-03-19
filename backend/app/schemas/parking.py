from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, field_validator


class ParkingPhotoOut(BaseModel):
    id: UUID
    photo_url: str
    is_primary: bool

    model_config = {"from_attributes": True}


class ParkingSpaceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price_per_hour: float
    total_slots: int = 1
    exact_latitude: float
    exact_longitude: float
    vehicle_type_allowed: str = "all"   # car | bike | ev | all
    property_type: Optional[str] = None
    amenities: List[str] = []
    availability_schedule: dict = {}

    @field_validator("price_per_hour")
    @classmethod
    def positive_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("price_per_hour must be positive")
        return v

    @field_validator("total_slots")
    @classmethod
    def positive_slots(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("total_slots must be positive")
        return v

    @field_validator("vehicle_type_allowed")
    @classmethod
    def validate_vehicle_type(cls, v: str) -> str:
        allowed = {"car", "bike", "ev", "all"}
        if v.lower() not in allowed:
            raise ValueError(f"vehicle_type_allowed must be one of {allowed}")
        return v.lower()

    @field_validator("exact_latitude")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (-90 <= v <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("exact_longitude")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (-180 <= v <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v


class ParkingSpaceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[float] = None
    total_slots: Optional[int] = None
    vehicle_type_allowed: Optional[str] = None
    amenities: Optional[List[str]] = None
    availability_schedule: Optional[dict] = None
    is_active: Optional[bool] = None


class NearbySearchParams(BaseModel):
    lat: float
    lng: float
    radius: Optional[int] = None     # metres
    vehicle_type: Optional[str] = None
    max_price: Optional[float] = None
    sort_by: str = "distance"        # distance | price | rating


# ── Public output (before booking – masked location) ─────────────────────────

class ParkingSpacePublicOut(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    description: Optional[str] = None
    price_per_hour: float
    total_slots: int
    available_slots: int
    public_latitude: float
    public_longitude: float
    vehicle_type_allowed: str
    property_type: Optional[str] = None
    amenities: List[Any] = []
    avg_rating: Optional[float] = None
    total_reviews: int = 0
    is_active: bool
    photos: List[ParkingPhotoOut] = []
    distance_meters: Optional[float] = None   # injected by query

    model_config = {"from_attributes": True}


# ── Private output (after booking – real location) ───────────────────────────

class ParkingSpaceOut(ParkingSpacePublicOut):
    exact_latitude: float
    exact_longitude: float
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
