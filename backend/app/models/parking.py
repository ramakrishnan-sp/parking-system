import uuid
from datetime import datetime
from sqlalchemy import (Column, String, Boolean, DateTime, ForeignKey,
                         Text, Numeric, Integer, Float)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from ..database import Base


class ParkingSpace(Base):
    __tablename__ = "parking_spaces"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id             = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                                  nullable=False, index=True)
    title                = Column(String(255), nullable=False)
    description          = Column(Text)
    price_per_hour       = Column(Numeric(10, 2), nullable=False)
    total_slots          = Column(Integer, nullable=False, default=1)
    available_slots      = Column(Integer, nullable=False, default=1)

    # PostGIS columns
    exact_location       = Column(Geometry("POINT", srid=4326), nullable=False)
    public_location      = Column(Geometry("POINT", srid=4326), nullable=False)

    # Denormalised for fast access
    exact_latitude       = Column(Float, nullable=False)
    exact_longitude      = Column(Float, nullable=False)
    public_latitude      = Column(Float, nullable=False)
    public_longitude     = Column(Float, nullable=False)

    vehicle_type_allowed = Column(String(10), nullable=False, default="all")
    property_type        = Column(String(20))
    amenities            = Column(JSONB, default=list)
    availability_schedule = Column(JSONB, default=dict)
    is_active            = Column(Boolean, default=True,  nullable=False)
    is_approved          = Column(Boolean, default=False, nullable=False)
    avg_rating           = Column(Numeric(3, 2), default=0)
    total_reviews        = Column(Integer, default=0)
    created_at           = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at           = Column(DateTime(timezone=True), default=datetime.utcnow,
                                  onupdate=datetime.utcnow)

    # Relationships
    owner    = relationship("User",         back_populates="parking_spaces")
    photos   = relationship("ParkingPhoto", back_populates="parking_space",
                             cascade="all, delete-orphan")
    bookings = relationship("Booking",      back_populates="parking_space")
    reviews  = relationship("Review",       back_populates="parking_space")


class ParkingPhoto(Base):
    __tablename__ = "parking_photos"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parking_id  = Column(UUID(as_uuid=True), ForeignKey("parking_spaces.id", ondelete="CASCADE"),
                          nullable=False, index=True)
    photo_url   = Column(String(500), nullable=False)
    is_primary  = Column(Boolean, default=False, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)

    parking_space = relationship("ParkingSpace", back_populates="photos")


class Review(Base):
    __tablename__ = "reviews"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id  = Column(UUID(as_uuid=True), ForeignKey("bookings.id",  ondelete="CASCADE"),
                          unique=True, nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"),     nullable=False)
    parking_id  = Column(UUID(as_uuid=True), ForeignKey("parking_spaces.id"), nullable=False)
    rating      = Column(Integer, nullable=False)
    comment     = Column(Text)
    owner_reply = Column(Text)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at  = Column(DateTime(timezone=True), default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    booking       = relationship("Booking",      back_populates="review")
    reviewer      = relationship("User",         back_populates="reviews")
    parking_space = relationship("ParkingSpace", back_populates="reviews")
