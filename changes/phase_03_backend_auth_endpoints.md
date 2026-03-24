# PHASE 3 — New Backend Auth Endpoints (Unified Registration + Firebase Login)
# ParkEase — Authentication Modernization
# ⚠️ Phases 1 and 2 must be complete before starting this phase.
# ⚠️ Keep ALL existing endpoints unchanged — only ADD new ones.
# ⚠️ Do NOT modify any frontend files in this phase.

---

## CONTEXT

You are continuing the ParkEase authentication modernization. In Phases 1–2 you set up Firebase utilities and updated the user model.

In this phase you will add **new backend endpoints** that support:
1. Unified registration (one endpoint, no seeker/owner split, uses Firebase phone verification)
2. Firebase-assisted login (verifies phone OTP token + password together)
3. Helper endpoints for profile setup (seeker details and owner details added post-registration)

All existing endpoints (`/auth/login`, `/auth/register/seeker`, `/auth/register/owner`, `/auth/otp/send`, `/auth/otp/verify`) stay exactly as they are — untouched.

---

## STEP 1 — Add new schemas for unified auth

In `backend/app/schemas/user.py`, add these new schema classes at the bottom of the file (after existing classes):

```python
# ── Unified Registration ──────────────────────────────────────────────────────

class UnifiedRegisterForm(BaseModel):
    """
    Used for documentation only — actual endpoint uses Form() parameters
    because it accepts file uploads.
    """
    full_name: str
    email: EmailStr
    phone: str
    password: str
    firebase_id_token: Optional[str] = None   # None allowed in dev mode
    residential_address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Firebase Login ────────────────────────────────────────────────────────────

class FirebaseLoginRequest(BaseModel):
    email: EmailStr
    password: str
    firebase_id_token: Optional[str] = None   # None allowed in dev mode
```

Also update the existing `__init__.py` at `backend/app/schemas/__init__.py` to export the new schemas:

```python
from .user import (
    ...,   # keep all existing imports
    UnifiedRegisterForm,
    FirebaseLoginRequest,
)
```

---

## STEP 2 — Add new auth endpoints

In `backend/app/routers/auth.py`, add the following new endpoints **after the existing endpoints**. Do NOT modify any existing endpoint.

First, add this import at the top of the file if not already present:

```python
from ..utils.firebase_admin import verify_firebase_token, get_phone_from_firebase_token, get_uid_from_firebase_token
```

Then add the following new endpoints:

```python
# ── Unified Registration (new — no role selection) ────────────────────────────

@router.post("/register/unified", status_code=status.HTTP_201_CREATED)
async def register_unified(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    firebase_id_token: str = Form(None),      # Optional in dev mode
    residential_address: str = Form(None),
    profile_photo: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    """
    Register a new user without choosing seeker/owner role.
    Phone is verified via Firebase OTP (firebase_id_token).
    In development mode (APP_ENV=development), firebase_id_token can be omitted.
    """
    # ── Duplicate check ────────────────────────────────────────────────────
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    # ── Firebase token verification ────────────────────────────────────────
    firebase_uid = None
    is_phone_verified = False

    if firebase_id_token:
        decoded = verify_firebase_token(firebase_id_token)
        if decoded:
            firebase_phone = get_phone_from_firebase_token(decoded)
            firebase_uid   = get_uid_from_firebase_token(decoded)

            # Normalize phones for comparison (strip spaces, ensure +91 prefix)
            normalized_submitted = phone.strip().replace(" ", "")
            normalized_firebase  = (firebase_phone or "").strip().replace(" ", "")

            if normalized_firebase and normalized_submitted != normalized_firebase:
                raise HTTPException(
                    status_code=400,
                    detail=f"Phone number mismatch: submitted {normalized_submitted} but Firebase verified {normalized_firebase}"
                )
            is_phone_verified = True
    elif settings.APP_ENV == "development":
        # Dev mode: allow registration without Firebase token
        is_phone_verified = True
    else:
        raise HTTPException(
            status_code=400,
            detail="firebase_id_token is required for phone verification"
        )

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
        is_verified=is_phone_verified,
        is_active=True,
        is_seeker=True,             # Everyone can seek by default
        is_owner=False,             # Becomes True when they list a space
        firebase_uid=firebase_uid,
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


# ── Firebase-assisted Login ────────────────────────────────────────────────────

@router.post("/firebase/login", response_model=TokenResponse)
def firebase_login(
    body: "FirebaseLoginRequest",
    db: Session = Depends(get_db),
):
    """
    Login with email + password + Firebase phone ID token.
    The Firebase token proves the user owns the phone linked to this account.
    In development mode, firebase_id_token can be omitted.
    """
    from ..schemas.user import FirebaseLoginRequest   # local import to avoid circular

    # ── Validate password ──────────────────────────────────────────────────
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # ── Firebase token check ───────────────────────────────────────────────
    if body.firebase_id_token:
        decoded = verify_firebase_token(body.firebase_id_token)
        if decoded:
            firebase_phone = get_phone_from_firebase_token(decoded)
            firebase_uid   = get_uid_from_firebase_token(decoded)

            # Verify the phone in the token matches the user's phone
            if firebase_phone:
                normalized_user  = user.phone.strip().replace(" ", "")
                normalized_token = firebase_phone.strip().replace(" ", "")
                if normalized_user != normalized_token:
                    raise HTTPException(
                        status_code=401,
                        detail="Phone number does not match account"
                    )

            # Link firebase_uid if not already linked
            if firebase_uid and not user.firebase_uid:
                user.firebase_uid = firebase_uid
                db.commit()

    elif settings.APP_ENV != "development":
        raise HTTPException(
            status_code=400,
            detail="firebase_id_token is required"
        )

    # ── Issue tokens ───────────────────────────────────────────────────────
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
```

---

## STEP 3 — Fix the FirebaseLoginRequest import in the endpoint

The `firebase_login` endpoint above uses a forward reference string for the body type. Fix it by adding a proper import at the top of `auth.py`:

```python
from ..schemas.user import (
    SeekerRegister, OwnerRegister, UserLogin,
    TokenResponse, RefreshTokenRequest,
    OTPSendRequest, OTPVerifyRequest,
    PasswordChangeRequest, UserOut,
    FirebaseLoginRequest,           # ADD THIS
)
```

Then update the endpoint signature to use it directly:

```python
@router.post("/firebase/login", response_model=TokenResponse)
def firebase_login(
    body: FirebaseLoginRequest,     # No longer a string reference
    db: Session = Depends(get_db),
):
```

And remove the local import inside the function body.

---

## STEP 4 — Add profile setup endpoints to users router

In `backend/app/routers/users.py`, add these new endpoints after the existing ones:

```python
from ..models.user import SeekerProfile, OwnerProfile
from ..utils.file_upload import save_upload

# ── Seeker profile setup (post-registration) ──────────────────────────────────

@router.post("/setup/seeker")
def setup_seeker_profile(
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
    Marks user.is_seeker = True.
    """
    # Upload files if provided
    license_url = None
    aadhaar_url = None

    if license_proof and license_proof.filename:
        import asyncio
        license_url = asyncio.run(
            save_upload(license_proof, "documents", settings.allowed_doc_types_list)
        )
    if aadhaar_proof and aadhaar_proof.filename:
        import asyncio
        aadhaar_url = asyncio.run(
            save_upload(aadhaar_proof, "documents", settings.allowed_doc_types_list)
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

    # Mark user as seeker
    current_user.is_seeker = True
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
    Marks user.is_owner = True (still requires admin KYC approval for listings).
    """
    govt_url    = None
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

    # Mark user as owner
    current_user.is_owner = True
    db.commit()

    return {
        "message": "Owner profile submitted. Admin will review your KYC documents.",
        "is_owner": True,
    }
```

Also add the missing imports at the top of `users.py` if not already present:

```python
from fastapi import APIRouter, Depends, UploadFile, File, Form
from ..config import settings
```

---

## STEP 5 — Fix async issue in setup_seeker_profile

The `setup_seeker_profile` function above uses `asyncio.run()` which doesn't work inside FastAPI's async context. Fix it by making the endpoint async:

Replace:
```python
@router.post("/setup/seeker")
def setup_seeker_profile(
```

With:
```python
@router.post("/setup/seeker")
async def setup_seeker_profile(
```

And replace the `asyncio.run(...)` calls with direct `await`:
```python
if license_proof and license_proof.filename:
    license_url = await save_upload(license_proof, "documents", settings.allowed_doc_types_list)
if aadhaar_proof and aadhaar_proof.filename:
    aadhaar_url = await save_upload(aadhaar_proof, "documents", settings.allowed_doc_types_list)
```

---

## STEP 6 — Test the new endpoints

Verify these endpoints exist in the Swagger docs at `http://localhost:8000/api/docs`:

- `POST /api/v1/auth/register/unified`
- `POST /api/v1/auth/firebase/login`
- `POST /api/v1/users/setup/seeker`
- `POST /api/v1/users/setup/owner`

Test `POST /api/v1/auth/register/unified` in dev mode (no firebase_id_token needed):

```json
{
  "full_name": "Test User",
  "email": "testunified@example.com",
  "phone": "+919876543210",
  "password": "Test@1234"
}
```

Expected response:
```json
{
  "message": "Registration successful. You can now sign in.",
  "user_id": "...",
  "is_verified": true
}
```

Test `POST /api/v1/auth/login` still works with the new user (backward compat):
```json
{
  "email": "testunified@example.com",
  "password": "Test@1234"
}
```

---

## VERIFICATION CHECKLIST

Before marking Phase 3 complete, confirm ALL of these:

- [ ] Backend starts without import errors
- [ ] `POST /api/v1/auth/register/unified` returns 201 in dev mode (no firebase_id_token needed)
- [ ] `POST /api/v1/auth/firebase/login` returns tokens in dev mode (no firebase_id_token needed)
- [ ] `POST /api/v1/auth/login` (existing) still works for all user types
- [ ] `POST /api/v1/auth/register/seeker` (existing) still works
- [ ] `POST /api/v1/auth/register/owner` (existing) still works
- [ ] `POST /api/v1/users/setup/seeker` exists in Swagger
- [ ] `POST /api/v1/users/setup/owner` exists in Swagger
- [ ] New user created via `/register/unified` has `user_type='user'`, `is_seeker=True`, `is_owner=False`
- [ ] `GET /api/v1/auth/me` returns `is_seeker` and `is_owner` fields for all users
- [ ] Admin account still works
- [ ] No frontend files were modified
- [ ] `npm run build` in frontend still passes

---

## IMPORTANT NOTES FOR NEXT PHASES

- The existing `/auth/otp/send` and `/auth/otp/verify` endpoints are kept for any legacy flows.
- In Phase 4 (frontend), the new `Register.jsx` will call `/auth/register/unified` and the new `Login.jsx` will call `/auth/firebase/login`.
- Dev mode bypass: when `APP_ENV=development` and no `firebase_id_token` is provided, registration and login succeed without Firebase verification. This lets developers work without Firebase credentials.
- The `TokenResponse` schema is unchanged — it returns `user_type` which will be `'user'` for new registrations.
