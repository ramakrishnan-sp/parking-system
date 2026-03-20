from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models.user import User, SeekerProfile, OwnerProfile
from ..models.parking import ParkingSpace
from ..models.booking import Booking
from ..models.payment import Payment
from ..models.notification import Notification
from ..schemas.user import UserOut
from ..schemas.parking import ParkingSpaceOut
from ..utils.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Dashboard stats ───────────────────────────────────────────────────────────

@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users    = db.query(func.count(User.id)).scalar()
    total_seekers  = db.query(func.count(User.id)).filter(User.user_type == "seeker").scalar()
    total_owners   = db.query(func.count(User.id)).filter(User.user_type == "owner").scalar()
    total_parking  = db.query(func.count(ParkingSpace.id)).scalar()
    pending_owners = db.query(func.count(OwnerProfile.id)).filter(
        OwnerProfile.verification_status == "pending"
    ).scalar()
    total_bookings = db.query(func.count(Booking.id)).scalar()
    confirmed_bookings = db.query(func.count(Booking.id)).filter(
        Booking.booking_status == "confirmed"
    ).scalar()
    total_revenue  = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.payment_status == "success"
    ).scalar()
    platform_revenue = db.query(func.coalesce(func.sum(Booking.platform_commission), 0)).filter(
        Booking.payment_status == "paid"
    ).scalar()

    return {
        "users": {
            "total": total_users,
            "seekers": total_seekers,
            "owners": total_owners,
        },
        "parking": {
            "total": total_parking,
            "pending_approval": db.query(func.count(ParkingSpace.id)).filter(
                ParkingSpace.is_approved == False, ParkingSpace.is_active == True
            ).scalar(),
        },
        "bookings": {
            "total": total_bookings,
            "confirmed": confirmed_bookings,
        },
        "revenue": {
            "total_processed": float(total_revenue),
            "platform_commission": float(platform_revenue),
        },
        "pending_owner_verifications": pending_owners,
    }


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(
    user_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(User).options(
        selectinload(User.seeker_profile),
        selectinload(User.owner_profile),
    )
    if user_type:
        q = q.filter(User.user_type == user_type)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    return q.offset(skip).limit(limit).all()


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


# ── Owner verification ────────────────────────────────────────────────────────

@router.get("/owners/pending")
def pending_owners(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    profiles = (
        db.query(OwnerProfile)
        .options(selectinload(OwnerProfile.user))
        .filter(OwnerProfile.verification_status == "pending")
        .all()
    )
    return [
        {
            "profile_id": str(p.id),
            "user_id": str(p.user_id),
            "full_name": p.user.full_name,
            "email": p.user.email,
            "phone": p.user.phone,
            "property_address": p.property_address,
            "property_type": p.property_type,
            "govt_id_proof_url": p.govt_id_proof_url,
            "aadhaar_proof_url": p.aadhaar_proof_url,
            "created_at": str(p.created_at),
        }
        for p in profiles
    ]


@router.post("/owners/{user_id}/approve")
def approve_owner(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Owner profile not found")
    profile.verification_status = "approved"
    db.commit()
    return {"message": "Owner approved"}


@router.post("/owners/{user_id}/reject")
def reject_owner(
    user_id: str,
    reason: str = "Does not meet requirements",
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Owner profile not found")
    profile.verification_status = "rejected"
    profile.rejection_reason    = reason
    db.commit()
    return {"message": "Owner rejected"}


# ── Parking management ────────────────────────────────────────────────────────

@router.get("/parking/pending", response_model=List[ParkingSpaceOut])
def pending_parking(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    spaces = (
        db.query(ParkingSpace)
        .options(selectinload(ParkingSpace.photos), selectinload(ParkingSpace.owner))
        .filter(ParkingSpace.is_approved == False, ParkingSpace.is_active == True)
        .all()
    )
    return spaces


@router.post("/parking/{parking_id}/approve")
def approve_parking(
    parking_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ps = db.query(ParkingSpace).filter(ParkingSpace.id == parking_id).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Parking space not found")
    ps.is_approved = True
    db.commit()
    return {"message": "Parking space approved"}


@router.delete("/parking/{parking_id}")
def remove_parking(
    parking_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ps = db.query(ParkingSpace).filter(ParkingSpace.id == parking_id).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Parking space not found")
    ps.is_active   = False
    ps.is_approved = False
    db.commit()
    return {"message": "Parking space removed"}


# ── Bookings overview ─────────────────────────────────────────────────────────

@router.get("/bookings")
def all_bookings(
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Booking)
    if status:
        q = q.filter(Booking.booking_status == status)
    return q.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics/revenue")
def revenue_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    monthly = (
        db.query(
            func.date_trunc("month", Payment.created_at).label("month"),
            func.sum(Payment.amount).label("revenue"),
            func.count(Payment.id).label("transactions"),
        )
        .filter(Payment.payment_status == "success")
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": str(r.month), "revenue": float(r.revenue), "transactions": r.transactions}
            for r in monthly]


@router.get("/analytics/bookings-by-purpose")
def bookings_by_purpose(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(Booking.purpose, func.count(Booking.id).label("count"))
        .group_by(Booking.purpose)
        .all()
    )
    return [{"purpose": r.purpose, "count": r.count} for r in rows]


@router.get("/analytics/top-parking")
def top_parking(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(
            ParkingSpace.id,
            ParkingSpace.title,
            func.count(Booking.id).label("total_bookings"),
            func.sum(Booking.owner_payout).label("total_revenue"),
        )
        .join(Booking, Booking.parking_id == ParkingSpace.id, isouter=True)
        .filter(Booking.payment_status == "paid")
        .group_by(ParkingSpace.id)
        .order_by(func.count(Booking.id).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "parking_id": str(r.id),
            "title": r.title,
            "total_bookings": r.total_bookings,
            "total_revenue": float(r.total_revenue or 0),
        }
        for r in rows
    ]
