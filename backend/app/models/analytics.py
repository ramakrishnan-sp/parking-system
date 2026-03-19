import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..database import Base


class ParkingEvent(Base):
    __tablename__ = "parking_events"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(30), nullable=False)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    parking_id = Column(UUID(as_uuid=True), ForeignKey("parking_spaces.id"), nullable=True)
    payload    = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
