import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone      = Column(String(20), nullable=False, index=True)
    otp        = Column(String(10), nullable=False)
    purpose    = Column(String(20), nullable=False, default="registration")
    is_used    = Column(Boolean, default=False, nullable=False)
    attempts   = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
