import { api } from './axios';

export const sendOTP = (data) => api.post('/auth/otp/send', data);
export const verifyOTP = (data) => api.post('/auth/otp/verify', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const registerSeeker = (formData) => api.post('/auth/register/seeker', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const registerOwner = (formData) => api.post('/auth/register/owner', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const refreshToken = (data) => api.post('/auth/refresh', data);
export const logoutUser = (data) => api.post('/auth/logout', data);
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.post('/auth/change-password', data);
