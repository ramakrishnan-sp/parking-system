import api from './axios'

export const sendOTP = (phone, purpose = 'registration') =>
  api.post('/auth/otp/send', { phone, purpose })

export const verifyOTP = (phone, otp, purpose = 'registration') =>
  api.post('/auth/otp/verify', { phone, otp, purpose })

export const loginUser = (data) =>
  api.post('/auth/login', data)

export const registerSeeker = (formData) =>
  api.post('/auth/register/seeker', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const registerOwner = (formData) =>
  api.post('/auth/register/owner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const refreshToken = (refresh_token) =>
  api.post('/auth/refresh', { refresh_token })

export const logoutUser = (refresh_token) =>
  api.post('/auth/logout', { refresh_token })

export const getMe = () =>
  api.get('/auth/me')

export const changePassword = (data) =>
  api.post('/auth/change-password', data)

export const verifyPhone = (phone, otp) =>
  api.post('/auth/verify-phone', { phone, otp, purpose: 'registration' })
