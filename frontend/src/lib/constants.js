// src/lib/constants.js

export const USER_TYPES = {
  SEEKER: 'seeker',
  OWNER:  'owner',
  ADMIN:  'admin',
}

export const BOOKING_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const PAYMENT_STATUS = {
  PENDING:  'pending',
  PAID:     'paid',
  REFUNDED: 'refunded',
  FAILED:   'failed',
}

export const PARKING_VEHICLE_TYPES = ['all', 'car', 'bike', 'ev']
export const PARKING_PROPERTY_TYPES = ['house', 'apartment', 'shop', 'office']

export const BOOKING_PURPOSES = [
  { value: 'office',            label: 'Office' },
  { value: 'shopping',          label: 'Shopping' },
  { value: 'event',             label: 'Event' },
  { value: 'residential_visit', label: 'Residential Visit' },
  { value: 'short_stay',        label: 'Short Stay' },
  { value: 'long_stay',         label: 'Long Stay' },
  { value: 'other',             label: 'Other' },
]

export const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

// Default center: Chennai
export const DEFAULT_MAP_CENTER  = { lat: 13.0827, lng: 80.2707 }
export const DEFAULT_MAP_ZOOM    = 14
export const DEFAULT_SEARCH_RADIUS = 2000
