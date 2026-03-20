import { api } from './axios';

export const createBooking = (data) => api.post('/bookings/', data);
export const getMyBookings = () => api.get('/bookings/my');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const cancelBooking = (id, data) => api.post(`/bookings/${id}/cancel`, data);
export const submitReview = (id, data) => api.post(`/bookings/${id}/review`, data);
export const getOwnerBookings = () => api.get('/bookings/owner/incoming');
