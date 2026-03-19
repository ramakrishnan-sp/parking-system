import api from './axios'

export const createRazorpayOrder = (booking_id) =>
  api.post('/payments/order', { booking_id })

export const verifyPayment = (booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
  api.post('/payments/verify', {
    booking_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  })

export const requestRefund = (booking_id, reason = '') =>
  api.post('/payments/refund', { booking_id, reason })
