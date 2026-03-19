import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..models.otp import OTPVerification
from ..config import settings

MAX_ATTEMPTS = 5


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def send_otp(db: Session, phone: str, purpose: str = "registration") -> str:
    """
    Generate an OTP, persist it, and (in production) send via Twilio.
    Returns the OTP string so the response can echo it back in dev mode.
    """
    # Invalidate any existing unused OTPs for this phone+purpose
    db.query(OTPVerification).filter(
        OTPVerification.phone == phone,
        OTPVerification.purpose == purpose,
        OTPVerification.is_used == False,
    ).update({"is_used": True})
    db.flush()

    otp = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    record = OTPVerification(
        phone=phone,
        otp=otp,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()

    # ── SMS delivery (Twilio) ────────────────────────────────────────────
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client as TwilioClient
            # Ensure E.164 format – prepend +91 for 10-digit Indian numbers
            twilio_phone = phone
            if phone.isdigit() and len(phone) == 10:
                twilio_phone = f"+91{phone}"
            client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=f"Your ParkEase OTP is: {otp}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes.",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=twilio_phone,
            )
        except Exception:
            # Log error in production; don't block flow
            pass

    return otp


def verify_otp(db: Session, phone: str, otp: str, purpose: str = "registration") -> bool:
    """Return True if OTP is valid and mark it used. Raises HTTPException on failure."""
    record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone == phone,
            OTPVerification.purpose == purpose,
            OTPVerification.is_used == False,
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status_code=400, detail="No active OTP found for this number")

    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")

    record.attempts += 1
    if record.attempts > MAX_ATTEMPTS:
        db.commit()
        raise HTTPException(status_code=429, detail="Too many failed attempts. Request a new OTP.")

    if record.otp != otp:
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    record.is_used = True
    db.commit()
    return True
