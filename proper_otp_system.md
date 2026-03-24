# PHASE — Proper OTP System (SMS via Twilio + Email via SMTP)
# ParkEase — OTP Authentication
# ⚠️ Do NOT change any UI components, page layouts, or CSS.
# ⚠️ Do NOT remove the existing otp_verifications table or otp_service.py.
# ⚠️ Remove ALL Firebase code completely — backend and frontend.

---

## CONTEXT

You are working on **ParkEase**. The backend already has:
- `backend/app/services/otp_service.py` — generates + stores OTP in `otp_verifications` table
- Twilio config in `backend/app/config.py` (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- SMTP config in `backend/app/config.py` (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD)
- `POST /api/v1/auth/otp/send` and `POST /api/v1/auth/otp/verify` endpoints already exist

The goal is:
1. Fix the OTP service to properly send via Twilio SMS AND/OR email (user chooses or backend decides)
2. Add a new `/auth/otp/send` that accepts either phone or email as the delivery channel
3. Wire the frontend Register and Login pages to use this OTP flow cleanly
4. Remove all Firebase code

---

## STEP 1 — Remove Firebase completely

### Backend:
- Delete `backend/app/utils/firebase_admin.py` if it exists
- Remove `firebase-admin` from `backend/requirements.txt` if present
- Remove any `from ..utils.firebase_admin import ...` lines from any router file

### Frontend:
- Run: `cd frontend && npm uninstall firebase`
- Delete `frontend/src/lib/firebase.js` if it exists
- In `frontend/index.html`, remove `<div id="recaptcha-container"></div>` if present

---

## STEP 2 — Backend: Update OTP service to support SMS + Email

Replace the entire contents of `backend/app/services/otp_service.py` with:

```python
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..models.otp import OTPVerification
from ..config import settings

MAX_ATTEMPTS = 5


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


# ── SMS delivery via Twilio ───────────────────────────────────────────────────

def _send_sms_twilio(phone: str, otp: str, expire_minutes: int) -> bool:
    """
    Send OTP via Twilio SMS.
    Returns True on success, False if Twilio is not configured or fails.
    """
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_PHONE_NUMBER):
        print(f"[OTP-SMS] Twilio not configured. OTP for {phone}: {otp}")
        return False

    try:
        from twilio.rest import Client as TwilioClient

        # Ensure E.164 format
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


# ── Email delivery via SMTP ───────────────────────────────────────────────────

def _send_email_otp(email: str, otp: str, expire_minutes: int, purpose: str) -> bool:
    """
    Send OTP via SMTP email.
    Returns True on success, False if SMTP is not configured or fails.
    """
    if not (settings.SMTP_USER and settings.SMTP_PASSWORD):
        print(f"[OTP-EMAIL] SMTP not configured. OTP for {email}: {otp}")
        return False

    purpose_label = {
        "registration":   "Account Verification",
        "login":          "Login Verification",
        "password_reset": "Password Reset",
    }.get(purpose, "Verification")

    subject  = f"ParkEase — Your {purpose_label} OTP"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">ParkEase</h1>
        <p style="color: #666; margin: 4px 0 0;">Smart P2P Parking Platform</p>
      </div>

      <div style="background: white; border-radius: 8px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <p style="color: #333; font-size: 16px; margin: 0 0 16px;">{purpose_label} Code</p>
        <div style="background: #f3f0ff; border: 2px dashed #7c3aed; border-radius: 8px; padding: 20px; margin: 16px 0;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #7c3aed; font-family: monospace;">
            {otp}
          </span>
        </div>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0;">
          This OTP is valid for <strong>{expire_minutes} minutes</strong>.<br>
          Do not share this code with anyone.
        </p>
      </div>

      <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not request this, please ignore this email.<br>
        &copy; {datetime.utcnow().year} ParkEase
      </p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = settings.EMAIL_FROM or settings.SMTP_USER
        msg["To"]      = email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(
                settings.EMAIL_FROM or settings.SMTP_USER,
                email,
                msg.as_string()
            )

        print(f"[OTP-EMAIL] Sent to {email}")
        return True

    except Exception as e:
        print(f"[OTP-EMAIL] SMTP error: {e}")
        return False


# ── Main send_otp function ────────────────────────────────────────────────────

def send_otp(
    db: Session,
    recipient: str,
    purpose: str = "registration",
    channel: str = "auto",
) -> dict:
    """
    Generate OTP, persist it, and deliver via SMS or email.

    Args:
        recipient : phone number OR email address
        purpose   : 'registration' | 'login' | 'password_reset'
        channel   : 'sms' | 'email' | 'auto'
                    'auto' = use SMS if recipient looks like a phone,
                             use email if it looks like an email address

    Returns dict:
        {
          "otp":         "123456",   # always returned (frontend shows in dev mode)
          "channel":     "sms",      # which channel was used
          "delivered":   True,       # whether external service accepted it
          "recipient":   "+919876543210"
        }
    """
    # Detect channel if auto
    is_email = "@" in recipient
    if channel == "auto":
        channel = "email" if is_email else "sms"

    # Invalidate old unused OTPs for this recipient + purpose
    db.query(OTPVerification).filter(
        OTPVerification.phone   == recipient,
        OTPVerification.purpose == purpose,
        OTPVerification.is_used == False,
    ).update({"is_used": True})
    db.flush()

    otp        = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    # Store in otp_verifications — use the phone column for both phone and email
    record = OTPVerification(
        phone=recipient,       # stores either phone or email
        otp=otp,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()

    # Deliver
    delivered = False
    if channel == "sms":
        delivered = _send_sms_twilio(recipient, otp, settings.OTP_EXPIRE_MINUTES)
    elif channel == "email":
        delivered = _send_email_otp(recipient, otp, settings.OTP_EXPIRE_MINUTES, purpose)

    if not delivered:
        print(f"[OTP] Delivery failed or not configured. OTP for {recipient}: {otp}")

    return {
        "otp":       otp,
        "channel":   channel,
        "delivered": delivered,
        "recipient": recipient,
    }


# ── Verify OTP ────────────────────────────────────────────────────────────────

def verify_otp(
    db: Session,
    recipient: str,
    otp: str,
    purpose: str = "registration",
) -> bool:
    """
    Verify an OTP for a recipient (phone or email).
    Raises HTTPException on failure, returns True on success.
    """
    record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone   == recipient,
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
            detail="Too many failed attempts. Please request a new OTP."
        )

    if record.otp != otp:
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    record.is_used = True
    db.commit()
    return True
```

---

## STEP 3 — Backend: Update OTP send/verify endpoints in auth router

In `backend/app/routers/auth.py`, replace the existing OTP endpoints with these improved versions.

First update the schemas — in `backend/app/schemas/user.py`, update `OTPSendRequest`:

```python
class OTPSendRequest(BaseModel):
    """
    recipient can be a phone number OR an email address.
    channel: 'sms' | 'email' | 'auto' (default auto-detects from recipient format)
    """
    recipient: str             # phone number OR email address
    purpose:   str = "registration"
    channel:   str = "auto"   # 'sms' | 'email' | 'auto'

    # Keep backward-compat: if old code passes 'phone' field, map it
    phone: Optional[str] = None

    def get_recipient(self) -> str:
        return self.recipient or self.phone or ""


class OTPVerifyRequest(BaseModel):
    """
    recipient can be a phone number OR an email address.
    """
    recipient: str             # same value used in OTPSendRequest
    otp:       str
    purpose:   str = "registration"

    # Backward compat
    phone: Optional[str] = None

    def get_recipient(self) -> str:
        return self.recipient or self.phone or ""
```

Then in `backend/app/routers/auth.py`, replace the OTP endpoints:

```python
# ── Send OTP (SMS or Email) ───────────────────────────────────────────────────

@router.post("/otp/send")
def api_send_otp(body: OTPSendRequest, db: Session = Depends(get_db)):
    """
    Send OTP to a phone number (via Twilio SMS) or email address (via SMTP).
    recipient: phone number like '+919876543210' or email like 'user@example.com'
    channel: 'sms' | 'email' | 'auto' (auto-detects from recipient format)
    """
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
        "message":   f"OTP sent via {result['channel']}",
        "channel":   result["channel"],
        "delivered": result["delivered"],
    }

    # In development mode, echo the OTP so dev can test without real SMS/email
    if settings.APP_ENV == "development":
        response["otp"] = result["otp"]

    return response


# ── Verify OTP ────────────────────────────────────────────────────────────────

@router.post("/otp/verify")
def api_verify_otp(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify an OTP. recipient must match exactly what was used in /otp/send.
    """
    recipient = body.get_recipient().strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="recipient is required")

    verify_otp(db, recipient=recipient, otp=body.otp, purpose=body.purpose)
    return {"message": "OTP verified successfully", "verified": True}
```

Also update the import at the top of `auth.py` — replace the old otp_service import:
```python
from ..services.otp_service import send_otp, verify_otp
```

---

## STEP 4 — Backend: Update register/unified to not need firebase_id_token

In `backend/app/routers/auth.py`, find the `/auth/register/unified` endpoint.

Remove the `firebase_id_token` parameter entirely. Replace the Firebase verification block with an OTP check:

```python
@router.post("/register/unified", status_code=status.HTTP_201_CREATED)
async def register_unified(
    full_name:            str        = Form(...),
    email:                str        = Form(...),
    phone:                str        = Form(...),
    password:             str        = Form(...),
    otp_recipient:        str        = Form(...),   # phone or email that was OTP-verified
    residential_address:  str        = Form(None),
    profile_photo:        UploadFile = File(None),
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

    recent_verified = (
        db.query(OTPModel)
        .filter(
            OTPModel.phone   == otp_recipient.strip(),
            OTPModel.purpose == "registration",
            OTPModel.is_used == True,
        )
        .order_by(OTPModel.created_at.desc())
        .first()
    )

    if not recent_verified and settings.APP_ENV != "development":
        raise HTTPException(
            status_code=400,
            detail="OTP verification required. Please verify your phone or email first."
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
        user_type="user",
        is_verified=is_verified,
        is_active=True,
        is_seeker=True,
        is_owner=False,
        profile_photo_url=photo_url,
    )
    db.add(user)
    db.flush()

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
        "message":     "Registration successful. You can now sign in.",
        "user_id":     str(user.id),
        "is_verified": user.is_verified,
    }
```

---

## STEP 5 — Backend: Add otp-login endpoint (no Firebase)

In `backend/app/routers/auth.py`, add this endpoint:

```python
from pydantic import BaseModel as PydanticBaseModel

class OTPLoginRequest(PydanticBaseModel):
    email:         str
    password:      str
    otp_recipient: str   # phone or email that was OTP-verified for purpose='login'


@router.post("/otp-login", response_model=TokenResponse)
def otp_login(body: OTPLoginRequest, db: Session = Depends(get_db)):
    """
    Login using email + password, after phone/email OTP has been verified.
    Requires prior call to POST /auth/otp/send (purpose='login')
    and POST /auth/otp/verify.
    """
    # ── Validate credentials ───────────────────────────────────────────────
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # ── Check OTP was recently verified ───────────────────────────────────
    if settings.APP_ENV != "development":
        from ..models.otp import OTPVerification as OTPModel

        recent = (
            db.query(OTPModel)
            .filter(
                OTPModel.phone   == body.otp_recipient.strip(),
                OTPModel.purpose == "login",
                OTPModel.is_used == True,
            )
            .order_by(OTPModel.created_at.desc())
            .first()
        )
        if not recent:
            raise HTTPException(
                status_code=401,
                detail="OTP verification required before login. Please verify your phone or email."
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

## STEP 6 — Backend: Update .env.example with clear OTP config

In `backend/.env.example`, make sure these are clearly documented:

```env
# ─── Twilio (OTP via SMS) ──────────────────────────────────────────────────────
# Sign up at https://www.twilio.com — free trial gives ~15 USD credit
# Console → Account Info for SID and Token
# Buy a phone number → use it as TWILIO_PHONE_NUMBER
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OTP_EXPIRE_MINUTES=10

# ─── Email / SMTP (OTP via Email) ─────────────────────────────────────────────
# For Gmail: use an App Password (not your main password)
# Google Account → Security → 2-Step Verification → App Passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@parkingsystem.com

# ─── OTP delivery note ────────────────────────────────────────────────────────
# If TWILIO is configured → SMS is sent for phone numbers
# If SMTP is configured   → Email is sent for email addresses
# If NEITHER is configured → OTP is printed to console (dev mode only)
# In APP_ENV=development  → OTP is also returned in the API response for testing
```

---

## STEP 7 — Frontend: Update API auth module

Replace `frontend/src/api/auth.js` with:

```js
import { api } from './axios';

// ── Core auth ─────────────────────────────────────────────────────────────────
export const loginUser      = (data) => api.post('/auth/login', data);
export const logoutUser     = (data) => api.post('/auth/logout', data);
export const refreshToken   = (data) => api.post('/auth/refresh', data);
export const getMe          = ()     => api.get('/auth/me');
export const changePassword = (data) => api.post('/auth/change-password', data);

// ── OTP (SMS or Email) ────────────────────────────────────────────────────────

/**
 * Send OTP to a phone number or email address.
 *
 * @param {string} recipient   - Phone ('+919876543210') or email ('user@example.com')
 * @param {string} purpose     - 'registration' | 'login' | 'password_reset'
 * @param {string} channel     - 'sms' | 'email' | 'auto' (default: auto-detect)
 *
 * Backend response:
 *   { message, channel, delivered }
 *   In dev mode also: { otp }  ← show this in toast for testing
 */
export const sendOTP = (recipient, purpose = 'registration', channel = 'auto') =>
  api.post('/auth/otp/send', { recipient, purpose, channel });

/**
 * Verify OTP entered by the user.
 *
 * @param {string} recipient - Same phone/email used in sendOTP
 * @param {string} otp       - 6-digit code
 * @param {string} purpose
 */
export const verifyOTP = (recipient, otp, purpose = 'registration') =>
  api.post('/auth/otp/verify', { recipient, otp, purpose });

// ── Unified registration ──────────────────────────────────────────────────────

/**
 * Register a new user (no role selection).
 * OTP must be verified before calling this.
 * otp_recipient: the phone/email that was OTP-verified.
 */
export const registerUnified = (formData) =>
  api.post('/auth/register/unified', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── OTP-verified login ────────────────────────────────────────────────────────

/**
 * Login after OTP verification.
 * OTP for purpose='login' must be verified before calling this.
 *
 * @param {{ email: string, password: string, otp_recipient: string }} data
 */
export const otpLogin = (data) => api.post('/auth/otp-login', data);

// ── Legacy endpoints (keep for backward compat) ───────────────────────────────
export const registerSeeker = (formData) =>
  api.post('/auth/register/seeker', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const registerOwner = (formData) =>
  api.post('/auth/register/owner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
```

---

## STEP 8 — Frontend: Replace Register.jsx

Replace the entire contents of `frontend/src/pages/Register.jsx`.

Same visual design (split panel, GlassCard) but with an SMS/Email OTP choice:

```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { sendOTP, verifyOTP, registerUnified } from '@/api/auth';
import { toast } from 'sonner';

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm({ mode: 'onTouched' });

  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [otpChannel, setOtpChannel]         = useState('sms');  // 'sms' | 'email'
  const [otpSent, setOtpSent]               = useState(false);
  const [otpVerified, setOtpVerified]       = useState(false);
  const [otp, setOtp]                       = useState('');
  const [isSendingOtp, setIsSendingOtp]     = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpRecipient, setOtpRecipient]     = useState('');  // the value that was verified

  const navigate = useNavigate();
  const phone    = watch('phone', '');
  const email    = watch('email', '');

  // Which value to use as recipient based on chosen channel
  const getRecipient = () => {
    if (otpChannel === 'email') return email.trim();
    const p = phone.trim().replace(/\s/g, '');
    if (p.length === 10 && !p.startsWith('+')) return `+91${p}`;
    return p;
  };

  // ── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    // Validate the relevant field first
    const fieldToValidate = otpChannel === 'email' ? 'email' : 'phone';
    const valid = await trigger(fieldToValidate);
    if (!valid) return;

    const recipient = getRecipient();
    if (!recipient) {
      toast.error(`Enter your ${otpChannel === 'email' ? 'email address' : 'phone number'} first`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendOTP(recipient, 'registration', otpChannel);
      setOtpSent(true);
      setOtpRecipient(recipient);

      // Dev mode — backend returns the OTP in the response
      if (res?.data?.otp) {
        toast.success(
          `OTP sent! Dev code: ${res.data.otp}`,
          { duration: 60000 }
        );
      } else {
        const channelLabel = otpChannel === 'email' ? `email (${recipient})` : `SMS (${recipient})`;
        toast.success(`OTP sent via ${channelLabel}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP. Check your details.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyOTP(otpRecipient, otp, 'registration');
      setOtpVerified(true);
      toast.success('Verified! You can now create your account.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Submit registration ──────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone or email first');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('full_name',     data.full_name);
      formData.append('email',         data.email);
      formData.append('password',      data.password);

      // Normalize phone
      const p = data.phone.trim().replace(/\s/g, '');
      formData.append('phone', p.length === 10 ? `+91${p}` : p);

      formData.append('otp_recipient', otpRecipient);  // phone or email that was verified

      if (data.residential_address) {
        formData.append('residential_address', data.residential_address);
      }

      await registerUnified(formData);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset OTP state when channel changes ─────────────────────────────────
  const handleChannelChange = (channel) => {
    setOtpChannel(channel);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setOtpRecipient('');
  };

  return (
    <div className="min-h-[100svh] bg-bg-primary flex relative overflow-x-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-3"></div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative z-10 border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 mb-12 absolute top-8 left-12">
          <Car className="w-8 h-8 text-brand-purple" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
            ParkEase
          </span>
        </Link>
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          One account.<br />Park or host.
        </h1>
        <p className="text-xl text-white/60 max-w-md mb-12">
          Register once and unlock both parking search and space listing.
        </p>
        <div className="space-y-6">
          {[
            { n: '1', color: 'brand-purple', text: 'Verify via SMS or Email OTP' },
            { n: '2', color: 'brand-pink',   text: 'Find nearby parking instantly' },
            { n: '3', color: 'brand-cyan',   text: 'List your space anytime to earn' },
          ].map(({ n, color, text }) => (
            <div key={n} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-${color}/20 flex items-center justify-center text-${color} font-bold`}>
                {n}
              </div>
              <p className="text-white/80">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <GlassCard className="w-full max-w-md p-8 animate-in fade-in slide-in-from-right-8 duration-500 my-auto">

          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
              ParkEase
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Create Account</h2>
          <p className="text-sm text-white/50 text-center mb-8">
            No role selection — park and list spaces with one account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <GlassInput
              label="Full Name"
              placeholder="Jane Doe"
              {...register('full_name', { required: 'Full name is required' })}
              error={errors.full_name?.message}
            />

            <GlassInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
              error={errors.email?.message}
            />

            <GlassInput
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              error={errors.password?.message}
            />

            <GlassInput
              label="Mobile Number"
              placeholder="+91XXXXXXXXXX or 10 digits"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[1-9]\d{9,14}$/,
                  message: 'Enter a valid phone number',
                },
              })}
              error={errors.phone?.message}
            />

            <GlassInput
              label="Residential Address (optional)"
              placeholder="Your home address"
              {...register('residential_address')}
            />

            {/* OTP Verification Block */}
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">

              <div>
                <p className="text-sm font-medium text-white/80 mb-3">
                  Verify via
                </p>
                {/* Channel selector */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleChannelChange('sms')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      otpChannel === 'sms'
                        ? 'bg-brand-purple/20 border-brand-purple text-brand-purple'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChannelChange('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      otpChannel === 'email'
                        ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>

                <p className="text-xs text-white/40 mt-2">
                  {otpChannel === 'sms'
                    ? 'OTP will be sent to your mobile number'
                    : 'OTP will be sent to your email address'}
                </p>
              </div>

              {/* Send OTP button */}
              {!otpVerified && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={handleSendOTP}
                  isLoading={isSendingOtp}
                  className="w-full"
                >
                  {otpSent ? 'Resend OTP' : `Send OTP via ${otpChannel === 'sms' ? 'SMS' : 'Email'}`}
                </GlassButton>
              )}

              {/* OTP input */}
              {otpSent && !otpVerified && (
                <div className="flex gap-3 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <GlassInput
                      label={`Enter OTP sent to ${otpChannel === 'sms' ? 'your phone' : 'your email'}`}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="font-mono tracking-widest text-center text-lg"
                      placeholder="• • • • • •"
                    />
                  </div>
                  <GlassButton
                    type="button"
                    onClick={handleVerifyOTP}
                    isLoading={isVerifyingOtp}
                    disabled={otp.length !== 6}
                    className="shrink-0 mb-0.5"
                  >
                    Verify
                  </GlassButton>
                </div>
              )}

              {/* Verified */}
              {otpVerified && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {otpChannel === 'sms' ? 'Phone' : 'Email'} verified successfully
                </div>
              )}
            </div>

            <GlassButton
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
              disabled={!otpVerified}
            >
              Create Account
            </GlassButton>
          </form>

          <p className="text-center text-sm text-white/60 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-cyan hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
```

---

## STEP 9 — Frontend: Replace Login.jsx

Replace the entire contents of `frontend/src/pages/Login.jsx`:

```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, Eye, EyeOff, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { sendOTP, verifyOTP, otpLogin, loginUser, getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function Login() {
  const { register, handleSubmit, watch, formState: { errors }, trigger } =
    useForm({ mode: 'onTouched' });

  const [showPassword, setShowPassword]     = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [step, setStep]                     = useState(0);     // 0=OTP, 1=password
  const [otpChannel, setOtpChannel]         = useState('sms'); // 'sms' | 'email'
  const [otpSent, setOtpSent]               = useState(false);
  const [otpVerified, setOtpVerified]       = useState(false);
  const [otp, setOtp]                       = useState('');
  const [isSendingOtp, setIsSendingOtp]     = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpRecipient, setOtpRecipient]     = useState('');

  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuthStore();

  const from  = location.state?.from?.pathname || null;
  const phone = watch('phone', '');
  const email = watch('email', '');

  const getRecipient = () => {
    if (otpChannel === 'email') return email.trim();
    const p = phone.trim().replace(/\s/g, '');
    if (p.length === 10 && !p.startsWith('+')) return `+91${p}`;
    return p;
  };

  const handleChannelChange = (channel) => {
    setOtpChannel(channel);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setOtpRecipient('');
  };

  // ── Step 0: Send OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const fieldToValidate = otpChannel === 'email' ? 'email' : 'phone';
    const valid = await trigger(fieldToValidate);
    if (!valid) return;

    const recipient = getRecipient();
    setIsSendingOtp(true);
    try {
      const res = await sendOTP(recipient, 'login', otpChannel);
      setOtpSent(true);
      setOtpRecipient(recipient);

      if (res?.data?.otp) {
        toast.success(`OTP sent! Dev code: ${res.data.otp}`, { duration: 60000 });
      } else {
        toast.success(`OTP sent via ${otpChannel === 'sms' ? 'SMS' : 'email'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Step 0: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyOTP(otpRecipient, otp, 'login');
      setOtpVerified(true);
      setStep(1);
      toast.success('Verified! Enter your password.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Step 1: Submit login ─────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let res;

      if (otpVerified) {
        res = await otpLogin({
          email:         data.email,
          password:      data.password,
          otp_recipient: otpRecipient,
        });
      } else {
        // Dev fallback — skip OTP
        res = await loginUser({ email: data.email, password: data.password });
      }

      const { access_token, refresh_token } = res.data;
      localStorage.setItem('parkease_access_token', access_token);

      const userRes = await getMe();
      login(userRes.data, access_token, refresh_token);
      toast.success('Welcome back!');

      const user = userRes.data;
      if (user.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        navigate('/seeker/map', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password');
      localStorage.removeItem('parkease_access_token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-bg-primary flex items-center justify-center p-4 relative overflow-x-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <GlassCard className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
              ParkEase
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-white/60 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Verify', 'Sign In'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step
                  ? 'bg-green-500 text-white'
                  : i === step
                  ? 'bg-brand-purple text-white ring-2 ring-brand-purple/30'
                  : 'bg-white/10 text-white/40'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-white' : 'text-white/40'}`}>
                {label}
              </span>
              {i === 0 && (
                <div className={`w-6 h-px mx-1 ${step > 0 ? 'bg-green-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Step 0: OTP Verification ──────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-white/60 text-center mb-2">
                Choose how to receive your verification code
              </p>

              {/* Channel selector */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChannelChange('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    otpChannel === 'sms'
                      ? 'bg-brand-purple/20 border-brand-purple text-brand-purple'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </button>
                <button
                  type="button"
                  onClick={() => handleChannelChange('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    otpChannel === 'email'
                      ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>

              {/* Phone or Email input */}
              {otpChannel === 'sms' ? (
                <GlassInput
                  label="Mobile Number"
                  placeholder="+91XXXXXXXXXX or 10 digits"
                  {...register('phone', {
                    required: 'Phone is required',
                    pattern: {
                      value: /^\+?[1-9]\d{9,14}$/,
                      message: 'Enter a valid phone number',
                    },
                  })}
                  error={errors.phone?.message}
                  disabled={otpVerified}
                />
              ) : (
                <GlassInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                  error={errors.email?.message}
                  disabled={otpVerified}
                />
              )}

              {/* Send OTP */}
              {!otpSent && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={handleSendOTP}
                  isLoading={isSendingOtp}
                  className="w-full"
                >
                  Send OTP via {otpChannel === 'sms' ? 'SMS' : 'Email'}
                </GlassButton>
              )}

              {/* OTP entry */}
              {otpSent && !otpVerified && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <GlassInput
                        label="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="font-mono tracking-widest text-center text-lg"
                        placeholder="• • • • • •"
                      />
                    </div>
                    <GlassButton
                      type="button"
                      onClick={handleVerifyOTP}
                      isLoading={isVerifyingOtp}
                      disabled={otp.length !== 6}
                      className="shrink-0 mb-0.5"
                    >
                      Verify
                    </GlassButton>
                  </div>
                  <p className="text-xs text-white/40 text-center">
                    Didn&apos;t receive it?{' '}
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-brand-cyan hover:text-white transition-colors underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>
              )}

              {/* Dev mode skip */}
              <p className="text-xs text-white/25 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-white/50 underline transition-colors"
                >
                  Skip verification (dev only)
                </button>
              </p>
            </div>
          )}

          {/* ── Step 1: Email + Password ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {otpVerified && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {otpChannel === 'sms' ? 'Phone' : 'Email'} verified
                </div>
              )}

              <GlassInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                error={errors.email?.message}
              />

              <div className="relative">
                <GlassInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <GlassButton type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign In
              </GlassButton>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-white/60 mt-8">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-cyan hover:text-white transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
```

---

## VERIFICATION CHECKLIST

### Cleanup
- [ ] `firebase` removed from frontend (`npm uninstall firebase`)
- [ ] `frontend/src/lib/firebase.js` deleted
- [ ] `frontend/index.html` has no `recaptcha-container` div
- [ ] `firebase-admin` removed from `backend/requirements.txt`
- [ ] `backend/app/utils/firebase_admin.py` deleted
- [ ] No firebase imports anywhere in the codebase

### Backend
- [ ] Backend starts without errors
- [ ] `POST /api/v1/auth/otp/send` with `{ "recipient": "+919876543210", "purpose": "registration" }` → SMS sent via Twilio (or OTP in console if Twilio not configured)
- [ ] `POST /api/v1/auth/otp/send` with `{ "recipient": "user@gmail.com", "purpose": "registration", "channel": "email" }` → email sent via SMTP
- [ ] In `APP_ENV=development`, response includes `{ "otp": "123456" }` for testing
- [ ] `POST /api/v1/auth/otp/verify` correctly validates the code
- [ ] `POST /api/v1/auth/register/unified` requires `otp_recipient` field
- [ ] `POST /api/v1/auth/otp-login` verifies OTP was done before issuing tokens
- [ ] Existing `POST /api/v1/auth/login` still works unchanged

### Frontend
- [ ] `npm run build` passes
- [ ] `/register` shows SMS / Email channel toggle buttons
- [ ] Selecting SMS → enters phone → Send OTP → SMS received (or dev toast shows code)
- [ ] Selecting Email → enters email → Send OTP → email received (or dev toast shows code)
- [ ] OTP input appears after Send, Verify button works
- [ ] Green "verified" badge appears after correct OTP
- [ ] Create Account button submits registration
- [ ] `/login` shows SMS / Email toggle
- [ ] After OTP verified → step 2 shows email + password fields
- [ ] Sign In completes login and navigates correctly
- [ ] "Skip verification (dev only)" link advances to password step in dev mode

### Dev mode test (no Twilio/SMTP configured)
1. Start backend with `APP_ENV=development`
2. POST `/auth/otp/send` → response contains `{ "otp": "XXXXXX" }` → toast shows it
3. POST `/auth/otp/verify` with that code → `{ "verified": true }`
4. Registration and login complete successfully

### Production test (Twilio configured)
1. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env`
2. POST `/auth/otp/send` with a real phone number → SMS arrives within 30 seconds
3. Enter OTP from SMS → verified

### Production test (SMTP/Gmail configured)
1. Set `SMTP_USER`, `SMTP_PASSWORD` (Gmail App Password), `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
2. POST `/auth/otp/send` with `channel=email` and a real email → email arrives
3. Enter OTP from email → verified
