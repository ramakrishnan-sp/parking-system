import { api } from './axios';

// Supports both:
//   createRazorpayOrder(booking_id)
//   createRazorpayOrder({ booking_id })
export const createRazorpayOrder = (booking_id_or_data) => {
	if (booking_id_or_data && typeof booking_id_or_data === 'object') {
		return api.post('/payments/order', booking_id_or_data);
	}
	return api.post('/payments/order', { booking_id: booking_id_or_data });
};

// Supports both:
//   verifyPayment(booking_id, order_id, payment_id, signature)
//   verifyPayment({ booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature })
export const verifyPayment = (
	booking_id_or_data,
	razorpay_order_id,
	razorpay_payment_id,
	razorpay_signature
) => {
	if (booking_id_or_data && typeof booking_id_or_data === 'object') {
		return api.post('/payments/verify', booking_id_or_data);
	}
	return api.post('/payments/verify', {
		booking_id: booking_id_or_data,
		razorpay_order_id,
		razorpay_payment_id,
		razorpay_signature,
	});
};

// Supports both:
//   requestRefund(booking_id, reason)
//   requestRefund({ booking_id, reason })
export const requestRefund = (booking_id_or_data, reason = '') => {
	if (booking_id_or_data && typeof booking_id_or_data === 'object') {
		return api.post('/payments/refund', booking_id_or_data);
	}
	return api.post('/payments/refund', { booking_id: booking_id_or_data, reason });
};
