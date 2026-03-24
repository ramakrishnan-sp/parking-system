from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


# ── Helpers ──────────────────────────────────────────────────────────────────

PHONE_RE = re.compile(r"^\+?[1-9]\d{7,14}$")
AADHAAR_RE = re.compile(r"^\d{12}$")


def _validate_phone(v: str) -> str:
    if not PHONE_RE.match(v):
        raise ValueError("Invalid phone number format")
    return v


# ── Auth ─────────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPSendRequest(BaseModel):
    """Request to send an OTP to a phone number or email address."""

    recipient: str
    purpose: str = "registration"
    channel: str = "auto"  # 'sms' | 'email' | 'auto'

    # Backward compat
    phone: Optional[str] = None

    def get_recipient(self) -> str:
        return (self.recipient or self.phone or "").strip()


class OTPVerifyRequest(BaseModel):
    recipient: str
    otp: str
    purpose: str = "registration"

    # Backward compat
    phone: Optional[str] = None

    def get_recipient(self) -> str:
        return (self.recipient or self.phone or "").strip()


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_type: str
    user_id: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a digit")
        return v


# ── Seeker Registration ───────────────────────────────────────────────────────

class SeekerRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    residential_address: str
    aadhaar_number: str
    driving_license_number: str
    vehicle_number: str
    vehicle_type: str   # car | bike | ev

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar(cls, v: str) -> str:
        if not AADHAAR_RE.match(v):
            raise ValueError("Aadhaar number must be exactly 12 digits")
        return v

    @field_validator("vehicle_type")
    @classmethod
    def validate_vehicle_type(cls, v: str) -> str:
        allowed = {"car", "bike", "ev"}
        if v.lower() not in allowed:
            raise ValueError(f"vehicle_type must be one of {allowed}")
        return v.lower()

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Owner Registration ────────────────────────────────────────────────────────

class OwnerRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    residential_address: str
    aadhaar_number: str
    property_address: str
    property_type: str   # house | apartment | shop | office

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar(cls, v: str) -> str:
        if not AADHAAR_RE.match(v):
            raise ValueError("Aadhaar number must be exactly 12 digits")
        return v

    @field_validator("property_type")
    @classmethod
    def validate_property_type(cls, v: str) -> str:
        allowed = {"house", "apartment", "shop", "office"}
        if v.lower() not in allowed:
            raise ValueError(f"property_type must be one of {allowed}")
        return v.lower()

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── User Update ───────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    user_type: str


# ── Output Schemas ────────────────────────────────────────────────────────────

class SeekerProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    residential_address: Optional[str] = None
    aadhaar_number: Optional[str] = None
    driving_license_number: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    verification_status: str
    license_proof_url: Optional[str] = None
    aadhaar_proof_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OwnerProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    residential_address: Optional[str] = None
    property_address: Optional[str] = None
    property_type: Optional[str] = None
    verification_status: str
    govt_id_proof_url: Optional[str] = None
    aadhaar_proof_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: str
    user_type: str
    is_verified: bool
    is_active: bool
    is_seeker: bool = True
    is_owner: bool = False
    profile_photo_url: Optional[str] = None
    created_at: datetime
    seeker_profile: Optional[SeekerProfileOut] = None
    owner_profile: Optional[OwnerProfileOut] = None

    model_config = {"from_attributes": True}


# ── Unified Registration ──────────────────────────────────────────────────────

class UnifiedRegisterForm(BaseModel):
    """
    Used for documentation only — actual endpoint uses Form() parameters
    because it accepts file uploads.
    """

    full_name: str
    email: EmailStr
    phone: str
    password: str
    otp_recipient: str
    residential_address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


