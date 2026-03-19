import razorpay
import hmac
import hashlib
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..models.booking import Booking
from ..models.payment import Payment

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

COMMISSION = Decimal(str(settings.PLATFORM_COMMISSION_PERCENT)) / 100


# ── Create Razorpay Order ─────────────────────────────────────────────────────

def create_order(booking: Booking) -> dict:
    """Create a Razorpay Order and return order details for the frontend checkout."""
    try:
        amount_paise = int(float(booking.total_amount) * 100)
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": str(booking.id)[:40],
            "notes": {
                "booking_id": str(booking.id),
                "user_id":    str(booking.user_id),
                "parking_id": str(booking.parking_id),
            },
        })
        return {
            "order_id": order["id"],
            "amount":   amount_paise,
            "currency": "INR",
            "key_id":   settings.RAZORPAY_KEY_ID,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment gateway error: {str(e)}")


# ── Verify & Confirm ──────────────────────────────────────────────────────────

def verify_and_confirm(
    db: Session,
    booking: Booking,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> Payment:
    """Verify Razorpay HMAC-SHA256 signature and confirm the booking."""
    body = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed: invalid signature")

    amount       = Decimal(str(booking.total_amount))
    commission   = (amount * COMMISSION).quantize(Decimal("0.01"))
    owner_payout = (amount - commission).quantize(Decimal("0.01"))

    booking.payment_status    = "paid"
    booking.booking_status    = "confirmed"
    booking.location_revealed = True
    booking.platform_commission = float(commission)
    booking.owner_payout      = float(owner_payout)

    ps = booking.parking_space
    if ps.available_slots > 0:
        ps.available_slots -= 1

    payment = Payment(
        booking_id=booking.id,
        user_id=booking.user_id,
        amount=float(booking.total_amount),
        currency="INR",
        payment_gateway="razorpay",
        gateway_payment_id=razorpay_payment_id,
        gateway_order_id=razorpay_order_id,
        payment_status="success",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# ── Refund ────────────────────────────────────────────────────────────────────

def process_refund(db: Session, booking: Booking, reason: str = "") -> Payment:
    """Issue a Razorpay refund for a confirmed booking."""
    if booking.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Booking is not in a paid state")

    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if not payment or not payment.gateway_payment_id:
        raise HTTPException(status_code=404, detail="Payment record not found")

    try:
        amount_paise = int(payment.amount * 100)
        refund = client.payment.refund(payment.gateway_payment_id, {
            "amount": amount_paise,
            "notes":  {"reason": reason},
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Refund error: {str(e)}")

    payment.payment_status = "refunded"
    payment.refund_id      = refund["id"]
    payment.refund_amount  = payment.amount
    payment.refund_reason  = reason

    booking.payment_status      = "refunded"
    booking.booking_status      = "cancelled"
    booking.cancellation_reason = reason

    ps = booking.parking_space
    if ps.available_slots < ps.total_slots:
        ps.available_slots += 1

    db.commit()
    db.refresh(payment)
    return payment
