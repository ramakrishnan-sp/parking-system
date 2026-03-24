import { api } from './axios';

// ── Core auth ─────────────────────────────────────────────────────────────────
export const loginUser      = (data) => api.post('/auth/login', data);
export const logoutUser     = (data) => api.post('/auth/logout', data);
export const refreshToken   = (data) => api.post('/auth/refresh', data);
export const getMe          = ()     => api.get('/auth/me');
export const changePassword = (data) => api.post('/auth/change-password', data);

// ── OTP (SMS or Email) ────────────────────────────────────────────────────────

export const sendOTP = (recipient, purpose = 'registration', channel = 'auto') =>
	api.post('/auth/otp/send', { recipient, purpose, channel });

export const verifyOTP = (recipient, otp, purpose = 'registration') =>
	api.post('/auth/otp/verify', { recipient, otp, purpose });

// ── Unified registration ──────────────────────────────────────────────────────

export const registerUnified = (formData) =>
	api.post('/auth/register/unified', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});

// ── OTP-verified login ────────────────────────────────────────────────────────

export const otpLogin = (data) => api.post('/auth/otp-login', data);

// ── Legacy endpoints (keep for backward compat) ───────────────────────────────
export const registerSeeker = (formData) =>
	api.post('/auth/register/seeker', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});

export const registerOwner = (formData) =>
	api.post('/auth/register/owner', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
