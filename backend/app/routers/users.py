from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
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
