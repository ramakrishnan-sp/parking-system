import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id                       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id                  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                                       nullable=False, index=True)
    parking_id               = Column(UUID(as_uuid=True), ForeignKey("parking_spaces.id"),
                                       nullable=False, index=True)
    start_time               = Column(DateTime(timezone=True), nullable=False)
    end_time                 = Column(DateTime(timezone=True), nullable=False)
    purpose                  = Column(String(20), nullable=False)
    total_hours              = Column(Numeric(8, 2), nullable=False)
    total_amount             = Column(Numeric(10, 2), nullable=False)
    platform_commission      = Column(Numeric(10, 2), nullable=False, default=0)
    owner_payout             = Column(Numeric(10, 2), nullable=False, default=0)
    payment_status           = Column(String(10), nullable=False, default="pending")
    booking_status           = Column(String(15), nullable=False, default="pending")
    location_revealed        = Column(Boolean, nullable=False, default=False)
    cancellation_reason      = Column(Text)
    stripe_payment_intent_id = Column(String(100))
    created_at               = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at               = Column(DateTime(timezone=True), default=datetime.utcnow,
                                       onupdate=datetime.utcnow)

    # Relationships
    user          = relationship("User",         back_populates="bookings")
    parking_space = relationship("ParkingSpace", back_populates="bookings")
    payment       = relationship("Payment",      back_populates="booking", uselist=False)
    review        = relationship("Review",       back_populates="booking",  uselist=False)
