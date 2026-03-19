from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production-must-be-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/parking_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"
    ALLOWED_DOC_TYPES: str = "image/jpeg,image/png,application/pdf"

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "ap-south-1"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    PLATFORM_COMMISSION_PERCENT: float = 15.0

    # Twilio OTP
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    OTP_EXPIRE_MINUTES: int = 10

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@parkingsystem.com"

    # Google Maps
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Parking search config
    DEFAULT_SEARCH_RADIUS_METERS: int = 2000
    MAX_SEARCH_RADIUS_METERS: int = 5000
    LOCATION_MASK_MIN_METERS: int = 100
    LOCATION_MASK_MAX_METERS: int = 200

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_image_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]

    @property
    def allowed_doc_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_DOC_TYPES.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure upload directories exist
for sub in ["profiles", "documents", "parking_photos"]:
    os.makedirs(os.path.join(settings.UPLOAD_DIR, sub), exist_ok=True)
