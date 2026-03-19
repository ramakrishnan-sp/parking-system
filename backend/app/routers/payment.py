from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.booking import Booking
from ..models.user import User
from ..schemas.payment import RazorpayOrderCreate, RazorpayVerify, RefundRequest, PaymentOut
from ..utils.security import get_current_user, require_seeker
from ..services.payment_service import create_order, verify_and_confirm, process_refund
from ..services.notification_service import notify_booking_confirmed

router = APIRouter(prefix="/payments", tags=["Payments"])


# ── Create Razorpay Order ─────────────────────────────────────────────────────

@router.post("/order")
def create_payment_order(
    body: RazorpayOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seeker),
):
    """Create a Razorpay Order. Returns order_id, amount, currency, key_id."""
    booking = db.query(Booking).filter(
        Booking.id == str(body.booking_id),
        Booking.user_id == current_user.id,
        Booking.payment_status == "pending",
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Pending booking not found")

    return create_order(booking)


# ── Verify payment + confirm booking ─────────────────────────────────────────

@router.post("/verify", response_model=PaymentOut)
def verify_payment(
    body: RazorpayVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seeker),
):
    """Verify Razorpay HMAC signature and confirm the booking."""
    booking = db.query(Booking).filter(
        Booking.id == str(body.booking_id),
        Booking.user_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    payment = verify_and_confirm(
        db, booking,
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
    )
    notify_booking_confirmed(db, booking)
    return payment


# ── Refund ────────────────────────────────────────────────────────────────────

@router.post("/refund", response_model=PaymentOut)
def refund(
    body: RefundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == str(body.booking_id)).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.user_type == "seeker" and str(booking.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    return process_refund(db, booking, body.reason or "")

    return {"status": "ok"}
