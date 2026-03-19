import api from './axios'

export const createBooking = (data) => api.post('/bookings/', data)

export const getMyBookings = () => api.get('/bookings/my')

export const getBookingById = (id) => api.get(`/bookings/${id}`)

export const cancelBooking = (id, cancellation_reason = '') =>
  api.post(`/bookings/${id}/cancel`, { cancellation_reason })

export const submitReview = (booking_id, rating, comment) =>
  api.post(`/bookings/${booking_id}/review`, { booking_id, rating, comment })

export const getOwnerBookings = () => api.get('/bookings/owner/incoming')
