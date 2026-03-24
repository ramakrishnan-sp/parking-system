import { api } from './axios';

export const createBooking = (data) => api.post('/bookings/', data);
export const getMyBookings = () => api.get('/bookings/my');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
// Supports both:
//   cancelBooking(id, reasonString)
//   cancelBooking(id, { cancellation_reason: ... })
export const cancelBooking = (id, reason = '') => {
	const payload = (reason && typeof reason === 'object')
		? reason
		: { cancellation_reason: reason || '' };
	return api.post(`/bookings/${id}/cancel`, payload);
};

// Supports both:
//   submitReview(booking_id, rating, comment)
//   submitReview(booking_id, { booking_id, rating, comment })
export const submitReview = (booking_id, ratingOrData, comment = '') => {
	const payload = (ratingOrData && typeof ratingOrData === 'object')
		? ratingOrData
		: { booking_id, rating: ratingOrData, comment };
	return api.post(`/bookings/${booking_id}/review`, payload);
};
export const getOwnerBookings = () => api.get('/bookings/owner/incoming');
