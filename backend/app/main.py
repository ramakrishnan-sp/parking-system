from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

from .config import settings
from .database import Base, engine
from .routers import auth, parking, booking, payment, admin, users

# ── Create all tables (dev convenience – use Alembic migrations in prod) ──────
Base.metadata.create_all(bind=engine)

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ParkEase – Smart P2P Parking Platform",
    description="Connect drivers with private parking space owners in urban areas.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
cors_kwargs = {
    "allow_origins": settings.cors_origins_list,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

# LAN/dev hosting: browsers will block cross-origin requests unless CORS allows the
# origin. In development we allow any http(s) origin to reduce setup friction.
if settings.APP_ENV == "development":
    cors_kwargs["allow_origin_regex"] = r"^https?://.*$"

app.add_middleware(CORSMiddleware, **cors_kwargs)

# ── Static file serving (uploaded documents / photos) ────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,    prefix="/api/v1")
app.include_router(parking.router, prefix="/api/v1")
app.include_router(booking.router, prefix="/api/v1")
app.include_router(payment.router, prefix="/api/v1")
app.include_router(admin.router,   prefix="/api/v1")
app.include_router(users.router,   prefix="/api/v1")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    return JSONResponse({"message": "ParkEase API – visit /api/docs for documentation"})
