from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models.booking import Booking
from ..models.parking import ParkingSpace, Review
from ..models.user import User
from ..schemas.booking import BookingCreate, BookingOut, BookingUpdate
from ..schemas.review import ReviewCreate, ReviewOut
from ..utils.security import get_current_user, require_seeker
from ..services.notification_service import notify_booking_cancelled
from decimal import Decimal

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _calc_amount(price_per_hour: float, start: datetime, end: datetime) -> tuple[float, float]:
    hours = (end - start).total_seconds() / 3600
    return round(hours, 2), round(price_per_hour * hours, 2)


# ── Create booking ────────────────────────────────────────────────────────────

@router.post("/", status_code=201, response_model=BookingOut)
def create_booking(
    body: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seeker),
):
    ps = db.query(ParkingSpace).filter(
        ParkingSpace.id == body.parking_id,
        ParkingSpace.is_active == True,
        ParkingSpace.is_approved == True,
    ).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Parking space not found or unavailable")

    if ps.available_slots <= 0:
        raise HTTPException(status_code=409, detail="No slots available for this parking space")

    # Check for overlapping confirmed bookings
    overlap = db.query(Booking).filter(
        Booking.parking_id == body.parking_id,
        Booking.booking_status.in_(["pending", "confirmed", "active"]),
        Booking.start_time < body.end_time,
        Booking.end_time   > body.start_time,
    ).count()

    if overlap >= ps.total_slots:
        raise HTTPException(status_code=409, detail="Requested time slot is fully booked")

    hours, amount = _calc_amount(
        float(ps.price_per_hour),
        body.start_time,
        body.end_time,
    )

    booking = Booking(
        user_id=current_user.id,
        parking_id=ps.id,
        start_time=body.start_time,
        end_time=body.end_time,
        purpose=body.purpose,
        total_hours=hours,
        total_amount=amount,
        platform_commission=0,
        owner_payout=0,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# ── Get my bookings ───────────────────────────────────────────────────────────

@router.get("/my", response_model=List[BookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .options(selectinload(Booking.parking_space))
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    result = []
    for b in bookings:
        out = BookingOut.model_validate(b)
        if b.location_revealed:
            out.exact_latitude  = b.parking_space.exact_latitude
            out.exact_longitude = b.parking_space.exact_longitude
        result.append(out)
    return result


# ── Get one booking ───────────────────────────────────────────────────────────

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).options(selectinload(Booking.parking_space)).filter(
        Booking.id == booking_id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Owners can see their parking's bookings; seekers only their own
    if current_user.user_type == "seeker" and str(booking.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.user_type == "owner" and str(booking.parking_space.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    out = BookingOut.model_validate(booking)
    if booking.location_revealed:
        out.exact_latitude  = booking.parking_space.exact_latitude
        out.exact_longitude = booking.parking_space.exact_longitude
    return out


# ── Cancel booking ────────────────────────────────────────────────────────────

@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    body: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).options(
        selectinload(Booking.parking_space),
        selectinload(Booking.user),
    ).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only the seeker or the admin may cancel
    if current_user.user_type == "seeker" and str(booking.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your booking")

    if booking.booking_status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or already-cancelled booking")

    booking.booking_status      = "cancelled"
    booking.cancellation_reason = body.cancellation_reason

    # Restore slot
    ps = booking.parking_space
    if ps.available_slots < ps.total_slots:
        ps.available_slots += 1

    db.commit()
    notify_booking_cancelled(db, booking)
    return {"message": "Booking cancelled"}


# ── Submit review ─────────────────────────────────────────────────────────────

@router.post("/{booking_id}/review", status_code=201, response_model=ReviewOut)
def submit_review(
    booking_id: str,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seeker),
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id,
        Booking.booking_status == "completed",
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Completed booking not found")

    existing = db.query(Review).filter(Review.booking_id == booking_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Review already submitted for this booking")

    review = Review(
        booking_id=booking_id,
        reviewer_id=current_user.id,
        parking_id=booking.parking_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# ── Owner: bookings for my parking spaces ────────────────────────────────────

@router.get("/owner/incoming", response_model=List[BookingOut])
def owner_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Owner access required")

    from ..models.parking import ParkingSpace as PS
    bookings = (
        db.query(Booking)
        .join(PS, Booking.parking_id == PS.id)
        .filter(PS.owner_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [BookingOut.model_validate(b) for b in bookings]
