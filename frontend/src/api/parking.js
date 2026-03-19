import api from './axios'

export const getNearbyParking    = (params, config = {}) => api.get('/parking/nearby', { params, ...config })
export const getParkingById      = (id)     => api.get(`/parking/${id}`)
export const getMyParkingSpaces  = ()       => api.get('/parking/owner/my-spaces')
export const createParking       = (fd)     => api.post('/parking/', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateParking       = (id, data) => api.put(`/parking/${id}`, data)
export const deleteParking       = (id)     => api.delete(`/parking/${id}`)
