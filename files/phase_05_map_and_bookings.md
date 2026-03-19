# PHASE 5 — Parking Map + Booking Pages
# ParkEase Frontend Redesign
# ⚠️ Phases 1–4 must be complete before starting this phase.

---

## CONTEXT

You are continuing the ParkEase frontend rebuild. In this phase you will build the core seeker experience:
1. **ParkingMap** page — map + search panel + booking modal
2. **BookingPage** — list of user's bookings
3. **BookingConfirmation** — post-payment success screen

All API field names use: `booking.booking_status`, `booking.total_amount`, `parking.is_approved`, `parking.is_active`.

---

## STEP 1 — Update the parking and booking API files

Replace `frontend/src/api/parking.js`:

```js
import api from './axios'

export const getNearbyParking    = (params) => api.get('/parking/nearby', { params })
export const getParkingById      = (id)     => api.get(`/parking/${id}`)
export const getMyParkingSpaces  = ()       => api.get('/parking/owner/my-spaces')
export const createParking       = (fd)     => api.post('/parking/', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateParking       = (id, data) => api.put(`/parking/${id}`, data)
export const deleteParking       = (id)     => api.delete(`/parking/${id}`)
```

Replace `frontend/src/api/booking.js`:

```js
import api from './axios'

export const createBooking    = (data)          => api.post('/bookings/', data)
export const getMyBookings    = ()              => api.get('/bookings/my')
export const getBookingById   = (id)            => api.get(`/bookings/${id}`)
export const cancelBooking    = (id, reason='') => api.post(`/bookings/${id}/cancel`, { cancellation_reason: reason })
export const submitReview     = (booking_id, rating, comment) =>
  api.post(`/bookings/${booking_id}/review`, { booking_id, rating, comment })
export const getOwnerBookings = () => api.get('/bookings/owner/incoming')
```

Replace `frontend/src/api/payment.js`:

```js
import api from './axios'

export const createRazorpayOrder = (booking_id) =>
  api.post('/payments/order', { booking_id })

export const verifyPayment = (booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
  api.post('/payments/verify', {
    booking_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  })

export const requestRefund = (booking_id, reason = '') =>
  api.post('/payments/refund', { booking_id, reason })
```

---

## STEP 2 — Build the MapContainer component

Replace `frontend/src/components/map/MapContainer.jsx`:

```jsx
import { useEffect, useRef } from 'react'
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon broken paths with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Custom marker icons ───────────────────────────────────

export const parkingAvailableIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <defs><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/></filter></defs>
    <path d="M18 0C8.059 0 0 8.059 0 18c0 12.6 18 26 18 26S36 30.6 36 18C36 8.059 27.941 0 18 0z"
      fill="var(--brand, #9333ea)" filter="url(#s)"/>
    <circle cx="18" cy="18" r="9" fill="white"/>
    <text x="18" y="23" text-anchor="middle" fill="var(--brand, #9333ea)"
      font-size="12" font-weight="700" font-family="Inter,sans-serif">P</text>
  </svg>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
})

export const parkingFullIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path d="M18 0C8.059 0 0 8.059 0 18c0 12.6 18 26 18 26S36 30.6 36 18C36 8.059 27.941 0 18 0z"
      fill="#9ca3af"/>
    <circle cx="18" cy="18" r="9" fill="white"/>
    <text x="18" y="23" text-anchor="middle" fill="#9ca3af"
      font-size="12" font-weight="700" font-family="Inter,sans-serif">P</text>
  </svg>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
})

export const userLocationIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="var(--brand, #9333ea)" opacity="0.2"/>
    <circle cx="14" cy="14" r="7" fill="var(--brand, #9333ea)"/>
    <circle cx="14" cy="14" r="3" fill="white"/>
  </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// ── Helper: emit map instance ─────────────────────────────

function MapReadyEmitter({ onMapReady }) {
  const map = useMap()
  useEffect(() => { onMapReady?.(map) }, [map])
  return null
}

// ── Factory helpers (for imperative use) ─────────────────

export function createParkingMarker(map, position, isAvailable = true) {
  const icon = isAvailable ? parkingAvailableIcon : parkingFullIcon
  return L.marker([position.lat, position.lng], { icon }).addTo(map)
}

export function createUserMarker(map, position) {
  return L.marker([position.lat, position.lng], {
    icon: userLocationIcon,
    zIndexOffset: 1000,
  }).addTo(map)
}

// ── Main component ────────────────────────────────────────

export default function MapContainer({
  center = { lat: 13.0827, lng: 80.2707 },
  zoom = 13,
  onMapReady,
  className = '',
  children,
}) {
  return (
    <LeafletMap
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={`w-full h-full ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapReadyEmitter onMapReady={onMapReady} />
      {children}
    </LeafletMap>
  )
}
```

---

## STEP 3 — Build the SearchPanel component

Create `frontend/src/components/map/SearchPanel.jsx`:

```jsx
import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

const VEHICLE_TYPES = [
  { value: '',     label: 'All' },
  { value: 'car',  label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'ev',   label: 'EV' },
]

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'price',    label: 'Cheapest first' },
  { value: 'rating',   label: 'Best rated' },
]

export default function SearchPanel({ onSearch, loading = false, resultCount = 0 }) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    vehicle_type: '',
    max_price: '',
    radius: '2000',
    sort_by: 'distance',
  })

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.({
      ...filters,
      radius: parseInt(filters.radius),
      max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
    })
  }

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-float p-4 w-full max-w-sm">
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Find Parking</h2>
            {resultCount > 0 && (
              <p className="text-xs text-muted-foreground">{resultCount} spaces found</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors',
              showFilters ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <SlidersHorizontal className="size-3.5" /> Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t border-border animate-slide-up">
            {/* Vehicle type */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Vehicle type</p>
              <div className="flex gap-1.5 flex-wrap">
                {VEHICLE_TYPES.map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => set('vehicle_type', vt.value)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      filters.vehicle_type === vt.value
                        ? 'bg-brand text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Max price / hr (₹)</p>
              <input
                type="number"
                min="0"
                placeholder="No limit"
                value={filters.max_price}
                onChange={(e) => set('max_price', e.target.value)}
                className="h-9 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>

            {/* Radius slider */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Radius: {(parseInt(filters.radius) / 1000).toFixed(1)} km
              </p>
              <input
                type="range" min="500" max="5000" step="500"
                value={filters.radius}
                onChange={(e) => set('radius', e.target.value)}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>0.5km</span><span>5km</span>
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Sort by</p>
              <select
                value={filters.sort_by}
                onChange={(e) => set('sort_by', e.target.value)}
                className="h-9 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-9 w-full rounded-lg bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading
            ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <Search className="size-4" />
          }
          {loading ? 'Searching…' : 'Search Nearby'}
        </button>
      </form>
    </div>
  )
}
```

---

## STEP 4 — Build the BookingForm component (with Razorpay)

Create `frontend/src/components/booking/BookingForm.jsx`:

```jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Calendar, Clock, Tag, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { createBooking } from '../../api/booking'
import { createRazorpayOrder, verifyPayment } from '../../api/payment'

const PURPOSES = [
  { value: 'office',            label: 'Office' },
  { value: 'shopping',          label: 'Shopping' },
  { value: 'event',             label: 'Event' },
  { value: 'residential_visit', label: 'Residential Visit' },
  { value: 'short_stay',        label: 'Short Stay' },
  { value: 'long_stay',         label: 'Long Stay' },
  { value: 'other',             label: 'Other' },
]

function calcHours(start, end) {
  if (!start || !end) return 0
  const diff = (new Date(end) - new Date(start)) / 3600000
  return diff > 0 ? diff : 0
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function BookingForm({ space, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm({ defaultValues: { purpose: 'office' } })

  const startTime = watch('start_time')
  const endTime   = watch('end_time')
  const hours     = calcHours(startTime, endTime)
  const total     = (hours * (parseFloat(space?.price_per_hour) || 0)).toFixed(2)

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDateTime = now.toISOString().slice(0, 16)

  const onSubmit = async (data) => {
    if (hours <= 0) { toast.error('End time must be after start time'); return }

    setLoading(true)
    try {
      // 1. Create booking
      const { data: booking } = await createBooking({
        parking_id: space.id,
        start_time: new Date(data.start_time).toISOString(),
        end_time:   new Date(data.end_time).toISOString(),
        purpose:    data.purpose,
      })

      // 2. Create Razorpay order
      const { data: order } = await createRazorpayOrder(booking.id)

      // 3. Load Razorpay checkout JS
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Could not load payment gateway. Check your internet connection.')
        setLoading(false)
        return
      }

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'ParkEase',
        description: `Booking: ${space.title}`,
        order_id:    order.order_id,
        theme:       { color: getComputedStyle(document.documentElement).getPropertyValue('--brand') || '#9333ea' },
        handler: async (response) => {
          try {
            await verifyPayment(
              booking.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            )
            toast.success('Booking confirmed! 🎉')
            onSuccess?.(booking)
          } catch {
            // Axios interceptor already shows error toast
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
    } catch {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Space summary */}
      <div className="rounded-xl bg-brand/10 p-4">
        <h4 className="font-semibold text-foreground">{space?.title}</h4>
        <p className="text-sm text-brand font-medium">₹{space?.price_per_hour}/hr</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {space?.available_slots} slot(s) available
        </p>
      </div>

      {/* Start time */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" /> Start time
        </label>
        <input
          type="datetime-local"
          min={minDateTime}
          className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          {...register('start_time', { required: 'Start time required' })}
        />
        {errors.start_time && <p className="text-xs text-destructive">{errors.start_time.message}</p>}
      </div>

      {/* End time */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" /> End time
        </label>
        <input
          type="datetime-local"
          min={startTime || minDateTime}
          className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          {...register('end_time', { required: 'End time required' })}
        />
        {errors.end_time && <p className="text-xs text-destructive">{errors.end_time.message}</p>}
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Tag className="size-3.5 text-muted-foreground" /> Purpose
        </label>
        <select
          className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
          {...register('purpose', { required: true })}
        >
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Amount preview */}
      {hours > 0 && (
        <div className="rounded-xl bg-muted p-3 flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{hours.toFixed(1)} hours</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-brand">₹{total}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || hours <= 0}
          className="flex-1 h-10 rounded-lg bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading
            ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <CreditCard className="size-4" />
          }
          {loading ? 'Processing…' : `Pay ₹${total}`}
        </button>
      </div>
    </form>
  )
}
```

---

## STEP 5 — Build the ParkingCard component

Create `frontend/src/components/map/ParkingCard.jsx`:

```jsx
import { Star, MapPin, Clock, Car, Navigation, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ParkingCard({ parking, onBook, onClose }) {
  if (!parking) return null

  const primaryPhoto = parking.photos?.find((p) => p.is_primary) || parking.photos?.[0]
  const distKm = parking.distance_meters != null
    ? parking.distance_meters < 1000
      ? `${Math.round(parking.distance_meters)}m`
      : `${(parking.distance_meters / 1000).toFixed(1)}km`
    : null

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-float w-72 overflow-hidden animate-slide-up">
      {/* Cover */}
      {primaryPhoto ? (
        <div className="relative h-36 bg-muted">
          <img src={primaryPhoto.photo_url} alt={parking.title} className="w-full h-full object-cover" />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 size-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ) : onClose && (
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="size-7 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight">{parking.title}</h3>
          <span className="text-brand font-bold text-sm whitespace-nowrap">₹{parking.price_per_hour}/hr</span>
        </div>

        {/* Rating */}
        {parking.total_reviews > 0 && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn('size-3', i < Math.round(parking.avg_rating || 0)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground/30'
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({parking.total_reviews})</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {distKm && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 text-brand" /> {distKm}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Car className="size-3" />
            {parking.vehicle_type_allowed === 'all' ? 'All vehicles' : parking.vehicle_type_allowed}
          </span>
          <span className={cn(
            'flex items-center gap-1 font-medium',
            parking.available_slots > 0 ? 'text-green-600' : 'text-destructive'
          )}>
            <Clock className="size-3" />
            {parking.available_slots > 0
              ? `${parking.available_slots} slot${parking.available_slots > 1 ? 's' : ''} free`
              : 'Full'
            }
          </span>
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <MapPin className="size-3 shrink-0" /> Exact location shown after booking
        </p>

        {/* CTA */}
        <button
          onClick={() => onBook?.(parking)}
          disabled={parking.available_slots === 0}
          className="w-full h-9 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {parking.available_slots > 0 ? 'Book Now' : 'No slots available'}
        </button>
      </div>
    </div>
  )
}
```

---

## STEP 6 — Build the ParkingMap page

Replace `frontend/src/pages/ParkingMap.jsx`:

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getNearbyParking } from '../api/parking'
import MapContainer, { createParkingMarker, createUserMarker } from '../components/map/MapContainer'
import SearchPanel from '../components/map/SearchPanel'
import ParkingCard from '../components/map/ParkingCard'
import BookingForm from '../components/booking/BookingForm'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import useAuthStore from '../store/authStore'

export default function ParkingMap() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)

  const [userPos, setUserPos] = useState(null)
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [bookingTarget, setBookingTarget] = useState(null)
  const [searchFilters, setSearchFilters] = useState({
    radius: 2000, vehicle_type: '', sort_by: 'distance',
  })

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPos({ lat: 13.0827, lng: 80.2707 }) // Chennai fallback
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setUserPos({ lat: 13.0827, lng: 80.2707 })
        toast.info('Using default location. Enable location access for better results.')
      }
    )
  }, [])

  // Fetch on location ready
  useEffect(() => {
    if (userPos) fetchNearby(searchFilters)
  }, [userPos])

  const fetchNearby = async (filters) => {
    if (!userPos) return
    setLoading(true)
    try {
      const params = {
        lat: userPos.lat,
        lng: userPos.lng,
        radius: filters.radius,
        sort_by: filters.sort_by,
        ...(filters.vehicle_type && { vehicle_type: filters.vehicle_type }),
        ...(filters.max_price    && { max_price: filters.max_price }),
      }
      const res = await getNearbyParking(params)
      setSpaces(res.data)
    } catch {} finally { setLoading(false) }
  }

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }

  const handleMapReady = useCallback((map) => {
    mapRef.current = map
    if (userPos) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = createUserMarker(map, userPos)
    }
  }, [userPos])

  // Place markers when spaces change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    clearMarkers()
    spaces.forEach((ps) => {
      const marker = createParkingMarker(map, {
        lat: ps.public_latitude,
        lng: ps.public_longitude,
      }, ps.available_slots > 0)

      marker.on('click', () => {
        setSelected(ps)
        map.panTo([ps.public_latitude, ps.public_longitude])
      })
      markersRef.current.push(marker)
    })
  }, [spaces])

  const handleBookNow = (ps) => {
    if (user?.user_type !== 'seeker') {
      toast.error('Only seekers can book parking spaces')
      return
    }
    setSelected(null)
    setBookingTarget(ps)
  }

  const handleSearch = (filters) => {
    setSearchFilters(filters)
    fetchNearby(filters)
  }

  return (
    <div className="h-full flex gap-4">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
        <SearchPanel
          onSearch={handleSearch}
          loading={loading}
          resultCount={spaces.length}
        />

        {/* Results list */}
        {spaces.length > 0 && (
          <div className="space-y-2">
            {spaces.map((ps) => (
              <div
                key={ps.id}
                onClick={() => {
                  setSelected(ps)
                  mapRef.current?.panTo([ps.public_latitude, ps.public_longitude])
                }}
                className={`rounded-xl bg-card ring-1 cursor-pointer p-3 hover:shadow-card transition-all ${
                  selected?.id === ps.id ? 'ring-brand shadow-card' : 'ring-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ps.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ps.distance_meters
                        ? ps.distance_meters < 1000
                          ? `${Math.round(ps.distance_meters)}m away`
                          : `${(ps.distance_meters / 1000).toFixed(1)}km away`
                        : ''}
                    </p>
                  </div>
                  <span className="text-brand font-bold text-xs shrink-0">₹{ps.price_per_hour}/hr</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative rounded-2xl overflow-hidden">
        {userPos ? (
          <MapContainer
            center={userPos}
            zoom={14}
            onMapReady={handleMapReady}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-2xl">
            <LoadingSpinner text="Getting your location…" />
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center rounded-2xl">
            <LoadingSpinner />
          </div>
        )}

        {/* Selected parking popup */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <ParkingCard
              parking={selected}
              onBook={handleBookNow}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Booking modal */}
      <Modal
        isOpen={!!bookingTarget}
        onClose={() => setBookingTarget(null)}
        title={`Book: ${bookingTarget?.title}`}
        maxWidth="sm:max-w-md"
      >
        {bookingTarget && (
          <BookingForm
            space={bookingTarget}
            onSuccess={(booking) => {
              setBookingTarget(null)
              navigate(`/booking-confirmation/${booking.id}`)
            }}
            onCancel={() => setBookingTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}
```

---

## STEP 7 — Build the BookingCard component

Create `frontend/src/components/booking/BookingCard.jsx`:

```jsx
import { useState } from 'react'
import { Calendar, Clock, Tag, Car, Navigation, Star, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cancelBooking, submitReview } from '../../api/booking'
import Modal from '../common/Modal'
import StatusBadge from '../common/StatusBadge'

export default function BookingCard({ booking, onUpdate }) {
  const [cancelling, setCancelling] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating]         = useState(5)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canCancel = ['pending', 'confirmed'].includes(booking.booking_status)
  const canReview = booking.booking_status === 'completed' && !booking.review
  const isRevealed = booking.location_revealed

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return
    setCancelling(true)
    try {
      await cancelBooking(booking.id)
      toast.success('Booking cancelled')
      onUpdate?.()
    } catch {} finally { setCancelling(false) }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitReview(booking.id, rating, comment)
      toast.success('Review submitted!')
      setShowReview(false)
      onUpdate?.()
    } catch {} finally { setSubmitting(false) }
  }

  const openNav = () => {
    if (booking.exact_latitude && booking.exact_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`,
        '_blank'
      )
    }
  }

  return (
    <>
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5 hover:shadow-float transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">#{booking.id.slice(0, 8).toUpperCase()}</p>
            <h4 className="font-semibold text-foreground mt-0.5 leading-tight">
              {booking.parking_space?.title || 'Parking Space'}
            </h4>
          </div>
          <StatusBadge status={booking.booking_status} />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span className="truncate">{format(new Date(booking.start_time), 'dd MMM, h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span>{format(new Date(booking.end_time), 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span className="capitalize">{booking.purpose?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Car className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span>{booking.total_hours}h</span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Total amount</span>
          <span className="font-bold text-brand">₹{booking.total_amount}</span>
        </div>

        {/* Location revealed */}
        {isRevealed && booking.exact_latitude && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              📍 Exact location unlocked
            </p>
            <button
              onClick={openNav}
              className="flex items-center gap-1.5 text-sm font-medium text-brand hover:opacity-80"
            >
              <Navigation className="size-4" /> Navigate
            </button>
          </div>
        )}

        {/* Actions */}
        {(canCancel || canReview) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 h-9 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/5 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
            {canReview && (
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 h-9 rounded-lg bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors"
              >
                <Star className="size-4" /> Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <form onSubmit={handleReview} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star className={`size-7 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comment (optional)</label>
            <textarea
              rows={3}
              className="w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50 resize-none"
              placeholder="Share your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </Modal>
    </>
  )
}
```

---

## STEP 8 — Build the BookingPage

Replace `frontend/src/pages/BookingPage.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react'
import { CalendarCheck, ReceiptText, Clock, CheckCircle } from 'lucide-react'
import { getMyBookings } from '../api/booking'
import BookingCard from '../components/booking/BookingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import StatCard from '../components/common/StatCard'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function BookingPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyBookings()
      setBookings(res.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [])

  const filtered = tab === 'all'
    ? bookings
    : bookings.filter((b) => b.booking_status === tab)

  // Stats
  const total     = bookings.length
  const active    = bookings.filter((b) => b.booking_status === 'active').length
  const completed = bookings.filter((b) => b.booking_status === 'completed').length
  const spent     = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((s, b) => s + parseFloat(b.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarCheck className="size-6 text-brand" />
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Total Bookings"  value={total}              color="brand" loading={loading} />
        <StatCard icon={Clock}         label="Active"          value={active}             color="green" loading={loading} />
        <StatCard icon={CheckCircle}   label="Completed"       value={completed}          color="blue"  loading={loading} />
        <StatCard icon={ReceiptText}   label="Total Spent"     value={`₹${spent.toFixed(0)}`} color="yellow" loading={loading} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0',
              tab === t.key
                ? 'bg-brand text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t.label}
            {t.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({bookings.filter((b) => b.booking_status === t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading bookings…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings yet"
          message={tab === 'all'
            ? "You haven't made any bookings yet. Find a parking spot to get started."
            : `No ${tab} bookings found.`}
          action={tab === 'all' ? { label: 'Find Parking', href: '/map' } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## STEP 9 — Build the BookingConfirmation page

Replace `frontend/src/pages/BookingConfirmation.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Navigation, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { getBookingById } from '../api/booking'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function BookingConfirmation() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBookingById(id)
      .then((r) => setBooking(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner text="Loading confirmation…" />
    </div>
  )

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Booking not found.</p>
        <Link to="/bookings" className="px-4 py-2 bg-brand text-white rounded-lg text-sm">
          View my bookings
        </Link>
      </div>
    </div>
  )

  const hasLocation = booking.exact_latitude && booking.exact_longitude
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-background dark:from-green-950/20 dark:to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="flex flex-col items-center mb-8 animate-scale-in">
          <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Booking Confirmed! 🎉</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center max-w-xs">
            Your parking spot is reserved. {hasLocation ? 'The exact location has been unlocked.' : ''}
          </p>
        </div>

        {/* Details card */}
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-6 space-y-3 mb-6 animate-slide-up">
          <Detail label="Reference" value={`#${booking.id.slice(0, 8).toUpperCase()}`} />
          {booking.parking_space?.title && (
            <Detail label="Parking" value={booking.parking_space.title} />
          )}
          <Detail
            label="From"
            value={format(new Date(booking.start_time), 'EEE, dd MMM yyyy • h:mm a')}
          />
          <Detail
            label="To"
            value={format(new Date(booking.end_time), 'EEE, dd MMM yyyy • h:mm a')}
          />
          <Detail label="Duration"  value={`${booking.total_hours}h`} />
          <Detail label="Purpose"   value={booking.purpose?.replace('_', ' ')} capitalize />
          <div className="pt-2 border-t border-border">
            <Detail label="Total Paid" value={`₹${booking.total_amount}`} bold />
          </div>

          {hasLocation && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                <MapPin className="size-3" /> Exact location revealed
              </p>
              <Detail label="Latitude"  value={booking.exact_latitude} />
              <Detail label="Longitude" value={booking.exact_longitude} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
          {hasLocation && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 rounded-xl bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Navigation className="size-4" /> Open in Maps
            </a>
          )}
          <Link
            to="/bookings"
            className="flex-1 h-11 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Calendar className="size-4" /> My Bookings
          </Link>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, bold, capitalize }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-foreground ${bold ? 'text-brand font-bold' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
```

---

## VERIFICATION CHECKLIST

Before marking Phase 5 complete:

- [ ] Visiting `/map` shows the two-panel layout (search panel left, Leaflet map right)
- [ ] "Search Nearby" button fetches from `/api/v1/parking/nearby`
- [ ] Blue markers appear on map for available spaces, gray for full
- [ ] Clicking a marker shows ParkingCard popup at bottom center of map
- [ ] "Book Now" in ParkingCard opens the booking modal
- [ ] BookingForm calculates total in real time as date/times are selected
- [ ] "Pay ₹X" button loads the Razorpay checkout script and opens the popup
- [ ] After payment success, navigates to `/booking-confirmation/:id`
- [ ] Booking confirmation shows all details and "Open in Maps" button (if location revealed)
- [ ] `/bookings` shows 4 stat cards at top
- [ ] Status filter tabs correctly filter bookings by `booking.booking_status` (NOT `booking.status`)
- [ ] Cancel button calls `POST /bookings/:id/cancel`
- [ ] Review modal submits to `POST /bookings/:id/review`
- [ ] Empty state shows with "Find Parking" CTA when no bookings
- [ ] All pages render correctly in dark mode
