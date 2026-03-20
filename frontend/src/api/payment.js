import { api } from './axios';

export const createRazorpayOrder = (data) => api.post('/payments/order', data);
export const verifyPayment = (data) => api.post('/payments/verify', data);
export const requestRefund = (data) => api.post('/payments/refund', data);
