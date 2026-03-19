import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from ..config import settings
from ..models.notification import Notification


# ── In-app notifications ──────────────────────────────────────────────────────

def create_notification(
    db: Session,
    user_id: UUID,
    title: str,
    message: str,
    notif_type: str,
    metadata: Optional[dict] = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        metadata_=metadata or {},
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


# ── Email notifications ───────────────────────────────────────────────────────

def _send_email(to: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return   # SMTP not configured; skip silently in dev

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = settings.EMAIL_FROM
    msg["To"]      = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
    except Exception:
        pass   # Log in production; never crash the request


# ── Booking event notifications ───────────────────────────────────────────────

def notify_booking_confirmed(db: Session, booking) -> None:
    user = booking.user
    create_notification(
        db=db,
        user_id=user.id,
        title="Booking Confirmed ✅",
        message=(
            f"Your parking at '{booking.parking_space.title}' is confirmed. "
            f"Check your booking for the exact location."
        ),
        notif_type="booking",
        metadata={"booking_id": str(booking.id)},
    )
    _send_email(
        to=user.email,
        subject="Your parking booking is confirmed – ParkEase",
        html_body=f"""
        <h2>Booking Confirmed</h2>
        <p>Hi {user.full_name},</p>
        <p>Your booking for <b>{booking.parking_space.title}</b> is confirmed.</p>
        <p><b>From:</b> {booking.start_time.strftime('%d %b %Y, %I:%M %p')}<br>
           <b>To:</b>   {booking.end_time.strftime('%d %b %Y, %I:%M %p')}<br>
           <b>Amount:</b> ₹{booking.total_amount}</p>
        <p>Open the app to see the exact parking location and navigate there.</p>
        <p>– Team ParkEase</p>
        """,
    )

    # Notify the owner too
    owner = booking.parking_space.owner
    create_notification(
        db=db,
        user_id=owner.id,
        title="New Booking Received 🚗",
        message=f"You have a new booking for '{booking.parking_space.title}'.",
        notif_type="booking",
        metadata={"booking_id": str(booking.id)},
    )


def notify_booking_cancelled(db: Session, booking) -> None:
    user = booking.user
    create_notification(
        db=db,
        user_id=user.id,
        title="Booking Cancelled",
        message=(
            f"Your booking at '{booking.parking_space.title}' has been cancelled. "
            f"A refund will be processed within 3–5 business days."
        ),
        notif_type="cancellation",
        metadata={"booking_id": str(booking.id)},
    )
