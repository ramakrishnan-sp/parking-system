import { api } from './axios';

export const getMyNotifications = () => api.get('/users/notifications');
export const markAllNotificationsRead = () => api.post('/users/notifications/mark-read');
export const uploadProfilePhoto = (formData) => api.post('/users/profile-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateSeekerProfile = (data) => api.put('/users/seeker-profile', data);
export const updateOwnerProfile = (data) => api.put('/users/owner-profile', data);
