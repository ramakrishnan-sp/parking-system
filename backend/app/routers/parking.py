from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_MakePoint, ST_SetSRID
from geoalchemy2 import Geography
from sqlalchemy import func, cast, and_, or_
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models.parking import ParkingSpace, ParkingPhoto
from ..models.user import User
from ..schemas.parking import (
    ParkingSpaceCreate, ParkingSpaceUpdate,
    ParkingSpaceOut, ParkingSpacePublicOut,
)
from ..utils.security import get_current_user, require_owner
from ..utils.geolocation import offset_coordinates
from ..utils.file_upload import save_upload, delete_upload
from ..config import settings
from fastapi import UploadFile, File, Form
import json

router = APIRouter(prefix="/parking", tags=["Parking"])


def _make_point(lat: float, lng: float):
    """Return a PostGIS geography point."""
    return ST_SetSRID(ST_MakePoint(lng, lat), 4326)


# ── Public: nearby parking search ───────────────────────────────────────────

@router.get("/nearby", response_model=List[ParkingSpacePublicOut])
def nearby_parking(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius: int = Query(None, ge=100, le=settings.MAX_SEARCH_RADIUS_METERS),
    vehicle_type: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: str = Query("distance", regex="^(distance|price|rating)$"),
    db: Session = Depends(get_db),
):
    search_radius = radius or settings.DEFAULT_SEARCH_RADIUS_METERS
    user_point = _make_point(lat, lng)

    geo_location = cast(ParkingSpace.public_location, Geography)
    geo_point = cast(user_point, Geography)

    query = (
        db.query(
            ParkingSpace,
            ST_Distance(geo_location, geo_point).label("distance_meters"),
        )
        .options(selectinload(ParkingSpace.photos))
        .filter(
            ParkingSpace.is_active == True,
            ParkingSpace.is_approved == True,
            ST_DWithin(geo_location, geo_point, search_radius),
        )
    )

    if vehicle_type:
        query = query.filter(
            or_(
                ParkingSpace.vehicle_type_allowed == vehicle_type.lower(),
                ParkingSpace.vehicle_type_allowed == "all",
            )
        )
    if max_price:
        query = query.filter(ParkingSpace.price_per_hour <= max_price)

    if sort_by == "price":
        query = query.order_by(ParkingSpace.price_per_hour)
    elif sort_by == "rating":
        query = query.order_by(ParkingSpace.avg_rating.desc())
    else:
        query = query.order_by("distance_meters")

    results = query.limit(50).all()

    output = []
    for ps, dist in results:
        data = ParkingSpacePublicOut.model_validate(ps)
        data.distance_meters = round(dist, 1) if dist else None
        output.append(data)

    return output


# ── Public: get one parking space (masked) ───────────────────────────────────

@router.get("/{parking_id}", response_model=ParkingSpacePublicOut)
def get_parking(
    parking_id: str,
    db: Session = Depends(get_db),
):
    ps = (
        db.query(ParkingSpace)
        .options(selectinload(ParkingSpace.photos))
        .filter(ParkingSpace.id == parking_id, ParkingSpace.is_active == True)
        .first()
    )
    if not ps:
        raise HTTPException(status_code=404, detail="Parking space not found")
    return ps


# ── Owner: create parking space ──────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_parking(
    title: str = Form(...),
    description: str = Form(None),
    price_per_hour: float = Form(...),
    total_slots: int = Form(1),
    exact_latitude: float = Form(...),
    exact_longitude: float = Form(...),
    vehicle_type_allowed: str = Form("all"),
    property_type: str = Form(None),
    amenities: str = Form("[]"),          # JSON string
    availability_schedule: str = Form("{}"),   # JSON string
    photos: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    if current_user.owner_profile and current_user.owner_profile.verification_status != "approved":
        raise HTTPException(status_code=403, detail="Owner account pending admin approval")

    pub_lat, pub_lng = offset_coordinates(
        exact_latitude, exact_longitude,
        settings.LOCATION_MASK_MIN_METERS,
        settings.LOCATION_MASK_MAX_METERS,
    )

    try:
        amenities_list = json.loads(amenities)
        schedule_dict  = json.loads(availability_schedule)
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid JSON in amenities or schedule")

    ps = ParkingSpace(
        owner_id=current_user.id,
        title=title,
        description=description,
        price_per_hour=price_per_hour,
        total_slots=total_slots,
        available_slots=total_slots,
        exact_location=f"SRID=4326;POINT({exact_longitude} {exact_latitude})",
        public_location=f"SRID=4326;POINT({pub_lng} {pub_lat})",
        exact_latitude=exact_latitude,
        exact_longitude=exact_longitude,
        public_latitude=pub_lat,
        public_longitude=pub_lng,
        vehicle_type_allowed=vehicle_type_allowed.lower(),
        property_type=property_type,
        amenities=amenities_list,
        availability_schedule=schedule_dict,
    )
    db.add(ps)
    db.flush()

    for i, photo_file in enumerate(photos[:8]):   # max 8 photos
        url = await save_upload(photo_file, "parking_photos",
                                settings.allowed_image_types_list)
        pp = ParkingPhoto(parking_id=ps.id, photo_url=url, is_primary=(i == 0))
        db.add(pp)

    db.commit()
    db.refresh(ps)
    return {"message": "Parking space submitted for approval", "parking_id": str(ps.id)}


# ── Owner: update parking space ──────────────────────────────────────────────

@router.put("/{parking_id}")
def update_parking(
    parking_id: str,
    body: ParkingSpaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    ps = db.query(ParkingSpace).filter(
        ParkingSpace.id == parking_id,
        ParkingSpace.owner_id == current_user.id,
    ).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Parking space not found")

    update_data = body.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(ps, k, v)

    db.commit()
    db.refresh(ps)
    return {"message": "Parking space updated"}


# ── Owner: delete parking space ──────────────────────────────────────────────

@router.delete("/{parking_id}")
def delete_parking(
    parking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    ps = db.query(ParkingSpace).filter(
        ParkingSpace.id == parking_id,
        ParkingSpace.owner_id == current_user.id,
    ).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Parking space not found")

    # Soft-delete
    ps.is_active = False
    db.commit()
    return {"message": "Parking space removed"}


# ── Owner: list own parking spaces ───────────────────────────────────────────

@router.get("/owner/my-spaces", response_model=List[ParkingSpaceOut])
def my_parking_spaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    spaces = (
        db.query(ParkingSpace)
        .options(selectinload(ParkingSpace.photos))
        .filter(ParkingSpace.owner_id == current_user.id)
        .order_by(ParkingSpace.created_at.desc())
        .all()
    )
    return spaces
