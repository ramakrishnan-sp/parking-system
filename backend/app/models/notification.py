import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    title      = Column(String(255), nullable=False)
    message    = Column(Text, nullable=False)
    type       = Column(String(20), nullable=False)
    is_read    = Column(Boolean, default=False, nullable=False)
    metadata_  = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
