import api from './axios'

export const getMyNotifications = () => api.get('/users/notifications')
export const markNotificationRead = (id) => api.patch(`/users/notifications/${id}/read`)
