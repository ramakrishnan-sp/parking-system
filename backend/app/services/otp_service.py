import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..models.otp import OTPVerification

MAX_ATTEMPTS = 5


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _send_sms_twilio(phone: str, otp: str, expire_minutes: int) -> bool:
    """Send OTP via Twilio SMS."""
    if not (
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_PHONE_NUMBER
    ):
        print(f"[OTP-SMS] Twilio not configured. OTP for {phone}: {otp}")
        return False

    try:
        from twilio.rest import Client as TwilioClient

        normalized = phone.strip().replace(" ", "")
        if normalized.isdigit() and len(normalized) == 10:
            normalized = f"+91{normalized}"
        elif not normalized.startswith("+"):
            normalized = f"+{normalized}"

        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=(
                f"Your ParkEase OTP is: {otp}\n"
                f"Valid for {expire_minutes} minutes.\n"
                f"Do not share this with anyone."
            ),
            from_=settings.TWILIO_PHONE_NUMBER,
            to=normalized,
        )
        print(f"[OTP-SMS] Sent to {normalized}, SID: {message.sid}")
        return True
    except Exception as e:
        print(f"[OTP-SMS] Twilio error: {e}")
        return False


def _send_email_otp(email: str, otp: str, expire_minutes: int, purpose: str) -> bool:
    """Send OTP via SMTP email."""
    if not (settings.SMTP_USER and settings.SMTP_PASSWORD):
        print(f"[OTP-EMAIL] SMTP not configured. OTP for {email}: {otp}")
        return False

    purpose_label = {
        "registration": "Account Verification",
        "login": "Login Verification",
        "password_reset": "Password Reset",
    }.get(purpose, "Verification")

    subject = f"ParkEase — Your {purpose_label} OTP"
    html_body = f"""
    <div style=\"font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;\">
      <div style=\"text-align: center; margin-bottom: 24px;\">
        <h1 style=\"color: #7c3aed; font-size: 28px; margin: 0;\">ParkEase</h1>
        <p style=\"color: #666; margin: 4px 0 0;\">Smart P2P Parking Platform</p>
      </div>

      <div style=\"background: white; border-radius: 8px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);\">
        <p style=\"color: #333; font-size: 16px; margin: 0 0 16px;\">{purpose_label} Code</p>
        <div style=\"background: #f3f0ff; border: 2px dashed #7c3aed; border-radius: 8px; padding: 20px; margin: 16px 0;\">
          <span style=\"font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #7c3aed; font-family: monospace;\">
            {otp}
          </span>
        </div>
        <p style=\"color: #888; font-size: 13px; margin: 16px 0 0;\">
          This OTP is valid for <strong>{expire_minutes} minutes</strong>.<br>
          Do not share this code with anyone.
        </p>
      </div>

      <p style=\"color: #aaa; font-size: 12px; text-align: center; margin-top: 24px;\">
        If you did not request this, please ignore this email.<br>
        &copy; {datetime.utcnow().year} ParkEase
      </p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
        msg["To"] = email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(
                settings.EMAIL_FROM or settings.SMTP_USER,
                email,
                msg.as_string(),
            )

        print(f"[OTP-EMAIL] Sent to {email}")
        return True
    except Exception as e:
        print(f"[OTP-EMAIL] SMTP error: {e}")
        return False


def send_otp(
    db: Session,
    recipient: str,
    purpose: str = "registration",
    channel: str = "auto",
) -> dict:
    """
    Generate OTP, persist it, and deliver via SMS or email.

    recipient: phone number OR email address
    purpose:   'registration' | 'login' | 'password_reset'
    channel:   'sms' | 'email' | 'auto'
    """
    is_email = "@" in recipient
    if channel == "auto":
        channel = "email" if is_email else "sms"

    db.query(OTPVerification).filter(
        OTPVerification.phone == recipient,
        OTPVerification.purpose == purpose,
        OTPVerification.is_used == False,
    ).update({"is_used": True})
    db.flush()

    otp = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    record = OTPVerification(
        phone=recipient,
        otp=otp,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()

    delivered = False
    if channel == "sms":
        delivered = _send_sms_twilio(recipient, otp, settings.OTP_EXPIRE_MINUTES)
    elif channel == "email":
        delivered = _send_email_otp(recipient, otp, settings.OTP_EXPIRE_MINUTES, purpose)

    if not delivered:
        print(f"[OTP] Delivery failed or not configured. OTP for {recipient}: {otp}")

    return {
        "otp": otp,
        "channel": channel,
        "delivered": delivered,
        "recipient": recipient,
    }


def verify_otp(
    db: Session,
    recipient: str,
    otp: str,
    purpose: str = "registration",
) -> bool:
    """Verify an OTP for a recipient (phone or email)."""
    record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone == recipient,
            OTPVerification.purpose == purpose,
            OTPVerification.is_used == False,
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new one.")

    if datetime.now(timezone.utc) > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    record.attempts += 1
    if record.attempts > MAX_ATTEMPTS:
        db.commit()
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Please request a new OTP.",
        )

    if record.otp != otp:
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    record.is_used = True
    db.commit()
    return True
