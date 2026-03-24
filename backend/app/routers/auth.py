from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, SeekerProfile, OwnerProfile, RefreshToken
from ..schemas.user import (
    SeekerRegister, OwnerRegister, UserLogin,
    TokenResponse, RefreshTokenRequest,
    OTPSendRequest, OTPVerifyRequest,
    PasswordChangeRequest, UserOut,
)
from ..utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, hash_token,
    get_current_user,
)
from ..utils.file_upload import save_upload
from ..services.otp_service import send_otp, verify_otp
from ..config import settings
from pydantic import BaseModel as PydanticBaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── OTP ──────────────────────────────────────────────────────────────────────

@router.post("/otp/send")
def api_send_otp(body: OTPSendRequest, db: Session = Depends(get_db)):
    recipient = body.get_recipient().strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="recipient (phone or email) is required")

    result = send_otp(
        db,
        recipient=recipient,
        purpose=body.purpose,
        channel=body.channel,
    )

    response = {
        "message": f"OTP sent via {result['channel']}",
        "channel": result["channel"],
        "delivered": result["delivered"],
    }

    if settings.APP_ENV == "development":
        response["otp"] = result["otp"]

    return response


@router.post("/otp/verify")
def api_verify_otp(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    recipient = body.get_recipient().strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="recipient is required")

    verify_otp(db, recipient=recipient, otp=body.otp, purpose=body.purpose)
    return {"message": "OTP verified successfully", "verified": True}


# ── Seeker Registration ───────────────────────────────────────────────────────

@router.post("/register/seeker", status_code=status.HTTP_201_CREATED)
async def register_seeker(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    residential_address: str = Form(...),
    aadhaar_number: str = Form(...),
    driving_license_number: str = Form(...),
    vehicle_number: str = Form(...),
    vehicle_type: str = Form(...),
    profile_photo: UploadFile = File(None),
    license_proof: UploadFile = File(...),
    aadhaar_proof: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    # Upload documents
    license_url = await save_upload(license_proof, "documents",
                                     settings.allowed_doc_types_list)
    aadhaar_url = await save_upload(aadhaar_proof, "documents",
                                     settings.allowed_doc_types_list)
    photo_url = None
    if profile_photo:
        photo_url = await save_upload(profile_photo, "profiles",
                                       settings.allowed_image_types_list)

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        user_type="seeker",
        profile_photo_url=photo_url,
    )
    db.add(user)
    db.flush()

    profile = SeekerProfile(
        user_id=user.id,
        residential_address=residential_address,
        aadhaar_number=aadhaar_number,
        driving_license_number=driving_license_number,
        license_proof_url=license_url,
        aadhaar_proof_url=aadhaar_url,
        vehicle_number=vehicle_number,
        vehicle_type=vehicle_type.lower(),
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return {"message": "Registration successful. Please verify your phone via OTP.", "user_id": str(user.id)}


# ── Owner Registration ────────────────────────────────────────────────────────

@router.post("/register/owner", status_code=status.HTTP_201_CREATED)
async def register_owner(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    residential_address: str = Form(...),
    aadhaar_number: str = Form(...),
    property_address: str = Form(...),
    property_type: str = Form(...),
    profile_photo: UploadFile = File(None),
    govt_id_proof: UploadFile = File(...),
    aadhaar_proof: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    govt_url    = await save_upload(govt_id_proof, "documents", settings.allowed_doc_types_list)
    aadhaar_url = await save_upload(aadhaar_proof, "documents", settings.allowed_doc_types_list)
    photo_url   = None
    if profile_photo:
        photo_url = await save_upload(profile_photo, "profiles", settings.allowed_image_types_list)

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        user_type="owner",
        profile_photo_url=photo_url,
    )
    db.add(user)
    db.flush()

    profile = OwnerProfile(
        user_id=user.id,
        residential_address=residential_address,
        aadhaar_number=aadhaar_number,
        govt_id_proof_url=govt_url,
        aadhaar_proof_url=aadhaar_url,
        property_address=property_address,
        property_type=property_type.lower(),
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return {"message": "Registration successful. Await admin approval.", "user_id": str(user.id)}


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    access_token = create_access_token(str(user.id), user.user_type)
    raw_refresh, hashed_refresh = create_refresh_token()

    rt = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user_type=user.user_type,
        user_id=str(user.id),
    )


# ── Refresh Token ─────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_hash = hash_token(body.refresh_token)
    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,
    ).first()

    if not rt or rt.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    rt.is_revoked = True
    db.flush()

    user = rt.user
    access_token = create_access_token(str(user.id), user.user_type)
    raw_refresh, hashed_refresh = create_refresh_token()

    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user_type=user.user_type,
        user_id=str(user.id),
    )


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout")
def logout(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_hash = hash_token(body.refresh_token)
    db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).update(
        {"is_revoked": True}
    )
    db.commit()
    return {"message": "Logged out successfully"}


# ── Current user ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Change password ───────────────────────────────────────────────────────────

@router.post("/change-password")
def change_password(
    body: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# ── Verify phone ──────────────────────────────────────────────────────────────

@router.post("/verify-phone")
def verify_phone(
    body: OTPVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipient = body.get_recipient().strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="recipient is required")

    verify_otp(db, recipient, body.otp, "registration")
    if current_user.phone != recipient:
        raise HTTPException(status_code=400, detail="Phone number mismatch")
    current_user.is_verified = True
    db.commit()
    return {"message": "Phone verified successfully"}


# ── Unified Registration (new — no role selection) ────────────────────────────

@router.post("/register/unified", status_code=status.HTTP_201_CREATED)
async def register_unified(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    otp_recipient: str = Form(...),
    residential_address: str = Form(None),
    profile_photo: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    """
    Register a new user. Before calling this endpoint, the user must have:
    1. Called POST /auth/otp/send with their phone or email
    2. Called POST /auth/otp/verify to verify the OTP
    """
    # ── Duplicate check ────────────────────────────────────────────────────
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    # ── Confirm OTP was verified for this recipient ────────────────────────
    from ..models.otp import OTPVerification as OTPModel

    otp_recipient = otp_recipient.strip()
    recent_verified = (
        db.query(OTPModel)
        .filter(
            OTPModel.phone == otp_recipient,
            OTPModel.purpose == "registration",
            OTPModel.is_used == True,
        )
        .order_by(OTPModel.created_at.desc())
        .first()
    )

    if not recent_verified and settings.APP_ENV != "development":
        raise HTTPException(
            status_code=400,
            detail="OTP verification required. Please verify your phone or email first.",
        )

    is_verified = recent_verified is not None or settings.APP_ENV == "development"

    # ── Optional profile photo ─────────────────────────────────────────────
    photo_url = None
    if profile_photo and profile_photo.filename:
        photo_url = await save_upload(
            profile_photo, "profiles", settings.allowed_image_types_list
        )

    # ── Create user ────────────────────────────────────────────────────────
    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        user_type="user",           # New unified type — no seeker/owner at registration
        is_verified=is_verified,
        is_active=True,
        is_seeker=True,             # Everyone can seek by default
        is_owner=False,             # Becomes True when they list a space
        profile_photo_url=photo_url,
    )
    db.add(user)
    db.flush()

    # ── Optional: create minimal seeker profile to store residential address ─
    if residential_address:
        from ..models.user import SeekerProfile

        profile = SeekerProfile(
            user_id=user.id,
            residential_address=residential_address,
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful. You can now sign in.",
        "user_id": str(user.id),
        "is_verified": user.is_verified,
    }


class OTPLoginRequest(PydanticBaseModel):
    email: str
    password: str
    otp_recipient: str


@router.post("/otp-login", response_model=TokenResponse)
def otp_login(body: OTPLoginRequest, db: Session = Depends(get_db)):
    """Login using email + password, after phone/email OTP has been verified."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    if settings.APP_ENV != "development":
        from ..models.otp import OTPVerification as OTPModel

        recent = (
            db.query(OTPModel)
            .filter(
                OTPModel.phone == body.otp_recipient.strip(),
                OTPModel.purpose == "login",
                OTPModel.is_used == True,
            )
            .order_by(OTPModel.created_at.desc())
            .first()
        )
        if not recent:
            raise HTTPException(
                status_code=401,
                detail=(
                    "OTP verification required before login. Please verify your phone or email."
                ),
            )

    access_token = create_access_token(str(user.id), user.user_type)
    raw_refresh, hashed_refresh = create_refresh_token()

    rt = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user_type=user.user_type,
        user_id=str(user.id),
    )
