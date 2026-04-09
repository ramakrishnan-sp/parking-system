import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name        = Column(String(255), nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    phone            = Column(String(20),  unique=True, nullable=False, index=True)
    password_hash    = Column(String(255), nullable=False)
    user_type        = Column(String(10),  nullable=False)   # seeker | owner | admin (legacy: user)
    is_verified      = Column(Boolean, default=False, nullable=False)
    is_active        = Column(Boolean, default=True,  nullable=False)
    profile_photo_url = Column(String(500))
    created_at       = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at       = Column(DateTime(timezone=True), default=datetime.utcnow,
                              onupdate=datetime.utcnow)

    @property
    def is_seeker(self) -> bool:
        """Compatibility flag used by the frontend; derived from user_type."""
        return self.user_type in ("seeker", "owner", "admin", "user")

    @property
    def is_owner(self) -> bool:
        """Compatibility flag used by the frontend; derived from user_type."""
        return self.user_type in ("owner", "admin")

    # Relationships
    seeker_profile   = relationship("SeekerProfile", back_populates="user", uselist=False,
                                    cascade="all, delete-orphan")
    owner_profile    = relationship("OwnerProfile",  back_populates="user", uselist=False,
                                    cascade="all, delete-orphan")
    bookings         = relationship("Booking",       back_populates="user")
    notifications    = relationship("Notification",  back_populates="user",
                                    cascade="all, delete-orphan")
    refresh_tokens   = relationship("RefreshToken",  back_populates="user",
                                    cascade="all, delete-orphan")
    parking_spaces   = relationship("ParkingSpace",  back_populates="owner")
    reviews          = relationship("Review",        back_populates="reviewer")
    payments         = relationship("Payment",       back_populates="user")


class SeekerProfile(Base):
    __tablename__ = "seeker_profiles"

    id                     = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id                = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                                    unique=True, nullable=False)
    residential_address    = Column(Text)
    aadhaar_number         = Column(String(12))
    driving_license_number = Column(String(20))
    license_proof_url      = Column(String(500))
    aadhaar_proof_url      = Column(String(500))
    vehicle_number         = Column(String(20))
    vehicle_type           = Column(String(10))   # car | bike | ev
    verification_status    = Column(String(10), default="pending", nullable=False)
    rejection_reason       = Column(Text)
    created_at             = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at             = Column(DateTime(timezone=True), default=datetime.utcnow,
                                    onupdate=datetime.utcnow)

    user = relationship("User", back_populates="seeker_profile")


class OwnerProfile(Base):
    __tablename__ = "owner_profiles"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                                 unique=True, nullable=False)
    residential_address = Column(Text)
    govt_id_proof_url   = Column(String(500))
    aadhaar_proof_url   = Column(String(500))
    aadhaar_number      = Column(String(12))
    property_address    = Column(Text)
    property_type       = Column(String(20))   # house | apartment | shop | office
    verification_status = Column(String(10), default="pending", nullable=False)
    rejection_reason    = Column(Text)
    bank_account_number = Column(String(20))
    bank_ifsc_code      = Column(String(15))
    stripe_account_id   = Column(String(100))
    created_at          = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at          = Column(DateTime(timezone=True), default=datetime.utcnow,
                                 onupdate=datetime.utcnow)

    user = relationship("User", back_populates="owner_profile")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")
