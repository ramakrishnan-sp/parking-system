import { api } from './axios';

// ── Existing endpoints (unchanged) ───────────────────────────────────────────
export const getMyNotifications       = ()         => api.get('/users/notifications');
export const markAllNotificationsRead = ()         => api.post('/users/notifications/mark-read');
export const uploadProfilePhoto       = (formData) =>
	api.post('/users/profile-photo', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
export const updateSeekerProfile      = (data)     => api.put('/users/seeker-profile', data);
export const updateOwnerProfile       = (data)     => api.put('/users/owner-profile', data);

// ── New profile setup endpoints (Phase 3 backend) ────────────────────────────

/**
 * Set up seeker profile (vehicle details, driving license).
 * Can be called by any authenticated user post-registration.
 * Sets user.is_seeker = true on the backend.
 */
export const setupSeekerProfile = (formData) =>
	api.post('/users/setup/seeker', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});

/**
 * Set up owner profile (property details, KYC documents).
 * Can be called by any authenticated user post-registration.
 * Sets user.is_owner = true on the backend.
 */
export const setupOwnerProfile = (formData) =>
	api.post('/users/setup/owner', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
