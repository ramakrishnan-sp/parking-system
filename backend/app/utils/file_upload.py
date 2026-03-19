import os
import uuid
import mimetypes
from pathlib import Path
from typing import Optional, Tuple

import aiofiles
from fastapi import UploadFile, HTTPException

from ..config import settings


# ── MIME type validation ──────────────────────────────────────────────────────

def _validate_mime(content_type: str, allowed: list[str]) -> None:
    if content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{content_type}' not allowed. Allowed: {allowed}",
        )


# ── Async save to local disk ──────────────────────────────────────────────────

async def save_upload(
    file: UploadFile,
    sub_dir: str,
    allowed_types: Optional[list[str]] = None,
) -> str:
    """
    Save an uploaded file and return the relative URL path.
    sub_dir: e.g. 'profiles', 'documents', 'parking_photos'
    """
    content_type = file.content_type or ""
    allowed = allowed_types or settings.allowed_image_types_list
    _validate_mime(content_type, allowed)

    # Read content into memory and check size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds max size of {settings.MAX_FILE_SIZE_MB} MB",
        )

    # Build safe filename
    ext = mimetypes.guess_extension(content_type) or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = Path(settings.UPLOAD_DIR) / sub_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(content)

    return f"/uploads/{sub_dir}/{filename}"


# ── Delete file from disk ─────────────────────────────────────────────────────

def delete_upload(url_path: str) -> None:
    """Remove a file given its URL path like /uploads/profiles/xxx.jpg"""
    if not url_path:
        return
    relative = url_path.lstrip("/")   # strips leading slash
    full_path = Path(relative)
    if full_path.exists():
        full_path.unlink(missing_ok=True)
