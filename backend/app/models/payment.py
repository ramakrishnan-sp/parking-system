import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..database import Base


class Payment(Base):
    __tablename__ = "payments"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id         = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"),
                                 nullable=False, unique=True, index=True)
    user_id            = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount             = Column(Numeric(10, 2), nullable=False)
    currency           = Column(String(5), nullable=False, default="INR")
    payment_gateway    = Column(String(20), nullable=False, default="stripe")
    gateway_payment_id = Column(String(255))
    gateway_order_id   = Column(String(255))
    payment_status     = Column(String(10), nullable=False, default="pending")
    refund_id          = Column(String(255))
    refund_amount      = Column(Numeric(10, 2))
    refund_reason      = Column(Text)
    metadata_          = Column("metadata", JSONB, default=dict)
    created_at         = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at         = Column(DateTime(timezone=True), default=datetime.utcnow,
                                 onupdate=datetime.utcnow)

    booking = relationship("Booking", back_populates="payment")
    user    = relationship("User",    back_populates="payments")
