from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class RazorpayOrderCreate(BaseModel):
    booking_id: UUID


class RazorpayVerify(BaseModel):
    booking_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RefundRequest(BaseModel):
    booking_id: UUID
    reason: Optional[str] = None


class PaymentOut(BaseModel):
    id: UUID
    booking_id: UUID
    user_id: UUID
    amount: float
    currency: str
    payment_gateway: str
    gateway_payment_id: Optional[str] = None
    payment_status: str
    refund_id: Optional[str] = None
    refund_amount: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}
