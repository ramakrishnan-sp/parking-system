from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import hashlib
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(subject: str, user_type: str,
                         expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    data = {"sub": subject, "type": user_type, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token() -> Tuple[str, str]:
    """Return (raw_token, hashed_token)."""
    raw = secrets.token_urlsafe(64)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    from ..models.user import User   # local import to avoid circular

    payload = decode_access_token(credentials.credentials)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(*roles: str):
    def _dependency(current_user=Depends(get_current_user)):
        if current_user.user_type not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {roles}",
            )
        return current_user
    return _dependency


def require_seeker(current_user=Depends(get_current_user)):
    """Allow access if user can act as a seeker (seeker/owner/admin)."""
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    if current_user.user_type in ("seeker", "owner", "admin", "user"):
        return current_user
    raise HTTPException(
        status_code=403,
        detail="Seeker access required. Please complete your profile to enable bookings.",
    )


def require_owner(current_user=Depends(get_current_user)):
    """Allow access if user is an owner (or admin)."""
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    if current_user.user_type in ("owner", "admin"):
        return current_user
    raise HTTPException(
        status_code=403,
        detail="Owner access required. List a parking space first to unlock owner features.",
    )


def require_admin(current_user=Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
