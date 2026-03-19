import api from './axios'

export const getNearbyParking = (params) =>
  api.get('/parking/nearby', { params })

export const getParkingById = (id) => api.get(`/parking/${id}`)

export const getMyParkingSpaces = () => api.get('/parking/owner/my-spaces')

export const createParking = (formData) =>
  api.post('/parking/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateParking = (id, data) => api.put(`/parking/${id}`, data)

export const deleteParking = (id) => api.delete(`/parking/${id}`)

export const toggleParkingAvailability = (id) => api.patch(`/parking/${id}/toggle`)
