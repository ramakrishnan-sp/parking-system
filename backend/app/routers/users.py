from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, SeekerProfile, OwnerProfile
from ..models.notification import Notification
from ..utils.security import get_current_user
from ..utils.file_upload import save_upload
from ..config import settings

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/notifications")
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/notifications/mark-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/profile-photo")
async def upload_profile_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await save_upload(photo, "profiles", settings.allowed_image_types_list)
    current_user.profile_photo_url = url
    db.commit()
    return {"profile_photo_url": url}


# ── Seeker profile setup (post-registration) ──────────────────────────────────

@router.post("/setup/seeker")
async def setup_seeker_profile(
    vehicle_number: str = Form(None),
    vehicle_type: str = Form(None),
    driving_license_number: str = Form(None),
    aadhaar_number: str = Form(None),
    residential_address: str = Form(None),
    license_proof: UploadFile = File(None),
    aadhaar_proof: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create or update the seeker profile for the current user.
    (User role is derived from user_type; no extra flags are stored.)
    """
    # Upload files if provided
    license_url = None
    aadhaar_url = None

    if license_proof and license_proof.filename:
        license_url = await save_upload(
            license_proof, "documents", settings.allowed_doc_types_list
        )
    if aadhaar_proof and aadhaar_proof.filename:
        aadhaar_url = await save_upload(
            aadhaar_proof, "documents", settings.allowed_doc_types_list
        )

    # Create or update seeker profile
    profile = db.query(SeekerProfile).filter(
        SeekerProfile.user_id == current_user.id
    ).first()

    if profile is None:
        profile = SeekerProfile(user_id=current_user.id)
        db.add(profile)

    if vehicle_number is not None:
        profile.vehicle_number = vehicle_number
    if vehicle_type is not None:
        profile.vehicle_type = vehicle_type.lower()
    if driving_license_number is not None:
        profile.driving_license_number = driving_license_number
    if aadhaar_number is not None:
        profile.aadhaar_number = aadhaar_number
    if residential_address is not None:
        profile.residential_address = residential_address
    if license_url:
        profile.license_proof_url = license_url
    if aadhaar_url:
        profile.aadhaar_proof_url = aadhaar_url

    db.commit()

    return {
        "message": "Seeker profile updated successfully",
        "is_seeker": True,
    }


# ── Owner profile setup (post-registration) ───────────────────────────────────

@router.post("/setup/owner")
async def setup_owner_profile(
    property_address: str = Form(None),
    property_type: str = Form(None),
    aadhaar_number: str = Form(None),
    residential_address: str = Form(None),
    bank_account_number: str = Form(None),
    bank_ifsc_code: str = Form(None),
    govt_id_proof: UploadFile = File(None),
    aadhaar_proof: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create or update the owner profile for the current user.
    Promotes the account to owner (still requires admin KYC approval for listings).
    """
    govt_url = None
    aadhaar_url = None

    if govt_id_proof and govt_id_proof.filename:
        govt_url = await save_upload(
            govt_id_proof, "documents", settings.allowed_doc_types_list
        )
    if aadhaar_proof and aadhaar_proof.filename:
        aadhaar_url = await save_upload(
            aadhaar_proof, "documents", settings.allowed_doc_types_list
        )

    # Create or update owner profile
    profile = db.query(OwnerProfile).filter(
        OwnerProfile.user_id == current_user.id
    ).first()

    if profile is None:
        profile = OwnerProfile(user_id=current_user.id)
        db.add(profile)

    if property_address is not None:
        profile.property_address = property_address
    if property_type is not None:
        profile.property_type = property_type.lower()
    if aadhaar_number is not None:
        profile.aadhaar_number = aadhaar_number
    if residential_address is not None:
        profile.residential_address = residential_address
    if bank_account_number is not None:
        profile.bank_account_number = bank_account_number
    if bank_ifsc_code is not None:
        profile.bank_ifsc_code = bank_ifsc_code
    if govt_url:
        profile.govt_id_proof_url = govt_url
    if aadhaar_url:
        profile.aadhaar_proof_url = aadhaar_url

    # Promote user to owner so owner features are unlocked.
    if current_user.user_type != "admin":
        current_user.user_type = "owner"
    db.commit()

    return {
        "message": "Owner profile submitted. Admin will review your KYC documents.",
        "is_owner": True,
    }
