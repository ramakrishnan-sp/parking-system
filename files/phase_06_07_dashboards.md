# PHASE 6 — Owner Dashboard
# ParkEase Frontend Redesign
# ⚠️ Phases 1–5 must be complete before starting this phase.

---

## CONTEXT

You are building the Owner Dashboard. This is a protected page (`/owner`) accessible only to users with `user_type === 'owner'`. It has two tabs: "My Spaces" and "Incoming Bookings".

Important field name rules:
- `parking.is_approved` — boolean, whether admin approved it
- `parking.is_active` — boolean, whether owner has it enabled
- `parking.available_slots` — current available
- `parking.total_slots` — total capacity

---

## STEP 1 — Build the ParkingSpaceCard component

Create `frontend/src/components/owner/ParkingSpaceCard.jsx`:

```jsx
import { useState } from 'react'
import { Edit2, Trash2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { deleteParking, updateParking } from '../../api/parking'
import StatusBadge from '../common/StatusBadge'
import { cn } from '../../lib/utils'

function getSpaceStatus(ps) {
  if (!ps.is_active) return 'inactive'
  if (!ps.is_approved) return 'pending'
  return 'approved'
}

export default function ParkingSpaceCard({ space: ps, onEdit, onRefresh }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = getSpaceStatus(ps)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await updateParking(ps.id, { is_active: !ps.is_active })
      toast.success(ps.is_active ? 'Space deactivated' : 'Space activated')
      onRefresh?.()
    } catch {} finally { setToggling(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${ps.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteParking(ps.id)
      toast.success('Parking space removed')
      onRefresh?.()
    } catch {} finally { setDeleting(false) }
  }

  const slotPercent = ps.total_slots > 0
    ? Math.round((ps.available_slots / ps.total_slots) * 100)
    : 0

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden hover:shadow-float transition-shadow">
      {/* Photo */}
      {ps.photos?.[0] ? (
        <img
          src={ps.photos[0].photo_url}
          alt={ps.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-sidebar-gradient flex items-center justify-center">
          <MapPin className="size-8 text-white/60" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight">{ps.title}</h3>
          <StatusBadge status={status} />
        </div>

        {/* Price + slots */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand">₹{ps.price_per_hour}/hr</span>
          <span className="text-muted-foreground">
            {ps.total_slots} slot{ps.total_slots > 1 ? 's' : ''}
          </span>
        </div>

        {/* Availability bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Availability</span>
            <span>{ps.available_slots}/{ps.total_slots} free</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', slotPercent > 50 ? 'bg-green-500' : slotPercent > 20 ? 'bg-yellow-500' : 'bg-destructive')}
              style={{ width: `${slotPercent}%` }}
            />
          </div>
        </div>

        {/* Vehicle type + property type */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
            {ps.vehicle_type_allowed}
          </span>
          {ps.property_type && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
              {ps.property_type}
            </span>
          )}
        </div>

        {/* Pending approval notice */}
        {!ps.is_approved && ps.is_active && (
          <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2.5 py-1.5">
            ⏳ Awaiting admin approval
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          {/* Toggle active */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={toggling || !ps.is_approved}
              title={ps.is_approved ? (ps.is_active ? 'Deactivate' : 'Activate') : 'Awaiting approval'}
              className="disabled:opacity-40"
            >
              {ps.is_active
                ? <ToggleRight className="size-6 text-green-500" />
                : <ToggleLeft className="size-6 text-muted-foreground" />
              }
            </button>
            <span className="text-xs text-muted-foreground">
              {ps.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => onEdit?.(ps)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="size-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## STEP 2 — Build the ParkingForm component (Sheet)

Create `frontend/src/components/owner/ParkingForm.jsx`:

```jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { createParking, updateParking } from '../../api/parking'
import { cn } from '../../lib/utils'

const VEHICLE_TYPES = [
  { value: 'all',  label: 'All vehicles' },
  { value: 'car',  label: 'Cars only' },
  { value: 'bike', label: 'Bikes only' },
  { value: 'ev',   label: 'EVs only' },
]
const PROPERTY_TYPES = [
  { value: 'house',     label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'shop',      label: 'Shop' },
  { value: 'office',    label: 'Office' },
]
const AMENITY_OPTIONS = [
  'CCTV', 'Covered', 'Security Guard', 'EV Charging',
  '24/7 Access', 'Well-lit', 'Wheelchair Access',
]

export default function ParkingForm({ initialData, onSuccess, onCancel }) {
  const isEdit = !!initialData?.id
  const [loading, setLoading] = useState(false)
  const [amenities, setAmenities] = useState(initialData?.amenities || [])
  const [photos, setPhotos] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          price_per_hour: initialData.price_per_hour,
          total_slots: initialData.total_slots,
          vehicle_type_allowed: initialData.vehicle_type_allowed || 'all',
          property_type: initialData.property_type,
        }
      : { vehicle_type_allowed: 'all', total_slots: 1 },
  })

  const toggleAmenity = (a) =>
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (isEdit) {
        await updateParking(initialData.id, { ...data, amenities })
        toast.success('Parking space updated!')
      } else {
        const fd = new FormData()
        Object.entries({ ...data, amenities: JSON.stringify(amenities) }).forEach(([k, v]) =>
          fd.append(k, v)
        )
        photos.forEach((f) => fd.append('photos', f))
        await createParking(fd)
        toast.success('Submitted for admin approval!')
      }
      onSuccess?.()
    } catch {} finally { setLoading(false) }
  }

  const input = 'h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title *</label>
        <input {...register('title', { required: 'Title is required' })}
          className={cn(input, errors.title && 'ring-destructive')}
          placeholder="e.g. Safe parking near MG Road" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea {...register('description')} rows={3}
          className="w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          placeholder="Describe your space…" />
      </div>

      {/* Price + Slots */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Price/hr (₹) *</label>
          <input {...register('price_per_hour', { required: true, min: 1 })}
            type="number" min="1" step="0.5" className={input} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total slots *</label>
          <input {...register('total_slots', { required: true, min: 1 })}
            type="number" min="1" className={input} />
        </div>
      </div>

      {/* Location (new only) */}
      {!isEdit && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Latitude *</label>
              <input {...register('exact_latitude', { required: true })}
                type="number" step="any" className={input} placeholder="13.0827" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Longitude *</label>
              <input {...register('exact_longitude', { required: true })}
                type="number" step="any" className={input} placeholder="80.2707" />
            </div>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <MapPin className="size-3 shrink-0" />
            Exact coordinates are kept private. Seekers see a masked location.
          </p>
        </div>
      )}

      {/* Vehicle type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Allowed vehicles</label>
        <div className="flex gap-2 flex-wrap">
          {VEHICLE_TYPES.map((v) => (
            <label key={v.value} className="cursor-pointer">
              <input {...register('vehicle_type_allowed')} type="radio" value={v.value} className="sr-only" />
              <span className="px-3 py-1.5 rounded-full text-sm border border-border hover:border-brand transition-colors">
                {v.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Property type</label>
        <select {...register('property_type')} className={cn(input, 'h-10')}>
          <option value="">Select…</option>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a} type="button" onClick={() => toggleAmenity(a)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                amenities.includes(a) ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Photos (new only) */}
      {!isEdit && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Photos (up to 8)</label>
          <input
            type="file" multiple accept="image/*"
            onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 8))}
            className="w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
          />
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {photos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt="" className="size-16 rounded-lg object-cover" />
                  {i === 0 && (
                    <span className="absolute inset-x-0 bottom-0 text-center text-[10px] bg-brand text-white rounded-b-lg">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}
          className="flex-1 h-10 rounded-lg bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
          {loading && <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  )
}
```

---

## STEP 3 — Build the OwnerDashboard page

Replace `frontend/src/pages/OwnerDashboard.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react'
import { Building2, PlusCircle, CalendarCheck, Star, DollarSign } from 'lucide-react'
import { getMyParkingSpaces } from '../api/parking'
import { getOwnerBookings } from '../api/booking'
import ParkingSpaceCard from '../components/owner/ParkingSpaceCard'
import ParkingForm from '../components/owner/ParkingForm'
import BookingCard from '../components/booking/BookingCard'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import StatusBadge from '../components/common/StatusBadge'
import { cn } from '../lib/utils'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'

const TABS = ['My Spaces', 'Incoming Bookings']

export default function OwnerDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('My Spaces')
  const [spaces, setSpaces]   = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([getMyParkingSpaces(), getOwnerBookings()])
      setSpaces(s.data)
      setBookings(b.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [])

  // Stats
  const totalSpaces  = spaces.length
  const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.booking_status)).length
  const totalEarnings  = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((s, b) => s + parseFloat(b.owner_payout || 0), 0)
  const avgRating = spaces.length
    ? (spaces.reduce((s, sp) => s + parseFloat(sp.avg_rating || 0), 0) / spaces.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-sidebar-gradient p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-2xl font-semibold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-white/80 text-sm mt-1">
          Managing {totalSpaces} parking space{totalSpaces !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2}     label="Total Spaces"     value={totalSpaces}              color="brand"  loading={loading} />
        <StatCard icon={CalendarCheck} label="Active Bookings"  value={activeBookings}           color="green"  loading={loading} />
        <StatCard icon={DollarSign}    label="Total Earnings"   value={`₹${totalEarnings.toFixed(0)}`} color="yellow" loading={loading} />
        <StatCard icon={Star}          label="Avg Rating"       value={avgRating}                color="blue"   loading={loading} />
      </div>

      {/* Tabs header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 pb-2 text-sm font-medium border-b-2 transition-colors',
                tab === t
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
              {t === 'Incoming Bookings' && activeBookings > 0 && (
                <span className="ml-1.5 bg-brand text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeBookings}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'My Spaces' && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="size-4" /> Add Space
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading…" />
      ) : tab === 'My Spaces' ? (
        spaces.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No parking spaces yet"
            message="Add your first parking space and start earning."
            action={{ label: 'Add Space', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((ps) => (
              <ParkingSpaceCard
                key={ps.id}
                space={ps}
                onEdit={(ps) => { setEditing(ps); setShowForm(true) }}
                onRefresh={loadAll}
              />
            ))}
          </div>
        )
      ) : (
        /* Incoming bookings — owner view table */
        bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings yet" message="Bookings for your spaces will appear here." />
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    {['Ref', 'Space', 'Seeker', 'From', 'To', 'Amount', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{b.id.slice(0,8).toUpperCase()}</td>
                      <td className="px-4 py-3 font-medium truncate max-w-36">
                        {b.parking_space?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{b.user?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(b.start_time), 'dd MMM, h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(b.end_time), 'dd MMM, h:mm a')}
                      </td>
                      <td className="px-4 py-3 font-medium text-brand">₹{b.total_amount}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.booking_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Parking Space' : 'Add New Parking Space'}
        maxWidth="sm:max-w-2xl"
      >
        <ParkingForm
          initialData={editing}
          onSuccess={() => { setShowForm(false); loadAll() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
```

---

## VERIFICATION CHECKLIST — Phase 6

- [ ] `/owner` page shows welcome banner with brand gradient
- [ ] 4 stat cards load correctly from API data
- [ ] "My Spaces" tab shows parking cards in a grid
- [ ] Each card shows: photo (or gradient placeholder), title, price, slots, status badge, availability progress bar
- [ ] Toggle switch calls `PUT /parking/:id` to toggle `is_active`
- [ ] Edit button opens modal with pre-filled form
- [ ] Delete shows confirm dialog then calls `DELETE /parking/:id`
- [ ] "Add Space" opens empty form modal
- [ ] Submitted form POSTs multipart to `/parking/`
- [ ] "Incoming Bookings" tab shows table with correct `booking_status` field
- [ ] Empty states show with appropriate messages
- [ ] All works in dark mode

---
---

# PHASE 7 — Admin Dashboard
# ParkEase Frontend Redesign
# ⚠️ Phases 1–6 must be complete before starting this phase.

---

## CONTEXT

You are building the Admin Dashboard. Accessible only by users with `user_type === 'admin'`. Has 5 tabs: Overview, Users, Parking, Bookings, KYC Queue.

---

## STEP 1 — Update the admin API file

Replace `frontend/src/api/admin.js`:

```js
import api from './axios'

export const getAdminStats        = ()        => api.get('/admin/stats')
export const listUsers            = (params)  => api.get('/admin/users', { params })
export const toggleUserActive     = (id)      => api.patch(`/admin/users/${id}/toggle-active`)
export const getPendingOwners     = ()        => api.get('/admin/owners/pending')
export const approveOwner         = (id)      => api.post(`/admin/owners/${id}/approve`)
export const rejectOwner          = (id, reason) => api.post(`/admin/owners/${id}/reject`, null, { params: { reason } })
export const getPendingParking    = ()        => api.get('/admin/parking/pending')
export const approveParking       = (id)      => api.post(`/admin/parking/${id}/approve`)
export const removeParking        = (id)      => api.delete(`/admin/parking/${id}`)
export const getAllBookings        = (params)  => api.get('/admin/bookings', { params })
export const getRevenueAnalytics  = ()        => api.get('/admin/analytics/revenue')
export const getBookingsByPurpose = ()        => api.get('/admin/analytics/bookings-by-purpose')
export const getTopParking        = ()        => api.get('/admin/analytics/top-parking')
```

---

## STEP 2 — Build AdminDashboard page

Replace `frontend/src/pages/AdminDashboard.jsx` with a comprehensive implementation:

```jsx
import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, Building2, CalendarCheck, ShieldCheck,
  TrendingUp, DollarSign, Car, Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  getAdminStats, listUsers, getPendingOwners, getPendingParking,
  getAllBookings, getRevenueAnalytics, getBookingsByPurpose,
  toggleUserActive, approveOwner, rejectOwner, approveParking, removeParking,
} from '../api/admin'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { cn } from '../lib/utils'

const TABS = [
  { key: 'overview',  label: 'Overview',   icon: LayoutDashboard },
  { key: 'users',     label: 'Users',      icon: Users },
  { key: 'parking',   label: 'Parking',    icon: Building2 },
  { key: 'bookings',  label: 'Bookings',   icon: CalendarCheck },
  { key: 'kyc',       label: 'KYC Queue',  icon: ShieldCheck },
]

const CHART_COLORS = ['#9333ea', '#2563eb', '#0d9488', '#ea580c', '#db2777']

export default function AdminDashboard() {
  const [tab, setTab]               = useState('overview')
  const [stats, setStats]           = useState(null)
  const [users, setUsers]           = useState([])
  const [pendingOwners, setPO]      = useState([])
  const [pendingParking, setPP]     = useState([])
  const [bookings, setBookings]     = useState([])
  const [revenue, setRevenue]       = useState([])
  const [purposeData, setPurpose]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [actionId, setActionId]     = useState(null)
  const [selectedParking, setSelectedParking] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, u, po, pp, bk, rv, pu] = await Promise.all([
        getAdminStats(),
        listUsers(),
        getPendingOwners(),
        getPendingParking(),
        getAllBookings(),
        getRevenueAnalytics(),
        getBookingsByPurpose(),
      ])
      setStats(s.data)
      setUsers(u.data)
      setPO(po.data)
      setPP(pp.data)
      setBookings(bk.data)
      setRevenue(rv.data)
      setPurpose(pu.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [])

  const handleToggleUser = async (id) => {
    setActionId(id)
    try { await toggleUserActive(id); toast.success('User status updated'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleApproveOwner = async (userId) => {
    setActionId(userId)
    try { await approveOwner(userId); toast.success('Owner approved'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleRejectOwner = async (userId) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    setActionId(userId)
    try { await rejectOwner(userId, reason); toast.success('Owner rejected'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleApproveParking = async (id) => {
    setActionId(id)
    try { await approveParking(id); toast.success('Parking approved'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleRemoveParking = async (id) => {
    if (!confirm('Remove this parking space?')) return
    setActionId(id)
    try { await removeParking(id); toast.success('Removed'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const thCls = 'text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'
  const tdCls = 'px-4 py-3'

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 pb-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              tab === key
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {label}
            {key === 'kyc' && pendingOwners.length > 0 && (
              <span className="ml-1 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingOwners.length}
              </span>
            )}
            {key === 'parking' && pendingParking.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingParking.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading dashboard…" /> : (
        <>
          {/* ── OVERVIEW ─────────────────────────── */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.users.total.toLocaleString()}
                  sub={`${stats.users.seekers} seekers · ${stats.users.owners} owners`}
                  color="brand"
                />
                <StatCard
                  icon={Building2}
                  label="Parking Spaces"
                  value={stats.parking.total.toLocaleString()}
                  sub={`${stats.parking.pending_approval} pending approval`}
                  color="blue"
                />
                <StatCard
                  icon={CalendarCheck}
                  label="Total Bookings"
                  value={stats.bookings.total.toLocaleString()}
                  sub={`${stats.bookings.confirmed} confirmed`}
                  color="green"
                />
                <StatCard
                  icon={DollarSign}
                  label="Platform Revenue"
                  value={`₹${stats.revenue.platform_commission.toLocaleString()}`}
                  sub={`₹${stats.revenue.total_processed.toLocaleString()} total`}
                  color="yellow"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Revenue bar chart */}
                <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5">
                  <h3 className="text-sm font-semibold mb-4">Monthly Revenue</h3>
                  {revenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={(v) => format(new Date(v), 'MMM')}
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <Tooltip
                          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                          formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={TrendingUp} title="No revenue data" message="Revenue chart will appear once payments are processed." />
                  )}
                </div>

                {/* Purpose pie chart */}
                <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5">
                  <h3 className="text-sm font-semibold mb-4">Bookings by Purpose</h3>
                  {purposeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={purposeData}
                          dataKey="count"
                          nameKey="purpose"
                          cx="50%" cy="50%"
                          outerRadius={80}
                          label={({ purpose }) => purpose?.replace('_', ' ')}
                          labelLine={false}
                        >
                          {purposeData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={CalendarCheck} title="No booking data" message="Booking purpose breakdown will appear here." />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="h-9 w-full rounded-lg bg-background ring-1 ring-border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
              <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>{['User', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className={tdCls}>
                            <div className="flex items-center gap-3">
                              {u.profile_photo_url
                                ? <img src={u.profile_photo_url} alt="" className="size-8 rounded-full object-cover" />
                                : <div className="size-8 rounded-full bg-brand/20 grid place-items-center text-brand text-xs font-bold">{u.full_name?.[0]}</div>
                              }
                              <div>
                                <p className="font-medium">{u.full_name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className={tdCls}><StatusBadge status={u.user_type} /></td>
                          <td className={cn(tdCls, 'text-muted-foreground text-xs')}>{u.phone}</td>
                          <td className={tdCls}>
                            <StatusBadge status={u.is_active ? 'approved' : 'cancelled'} />
                          </td>
                          <td className={cn(tdCls, 'text-muted-foreground text-xs')}>{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                          <td className={tdCls}>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleToggleUser(u.id)}
                                disabled={actionId === u.id}
                                className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors', u.is_active ? 'text-destructive hover:bg-destructive/10' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20')}
                              >
                                {u.is_active ? 'Disable' : 'Enable'}
                              </button>
                              {u.user_type === 'owner' && u.owner_profile?.verification_status === 'pending' && (
                                <>
                                  <button onClick={() => handleApproveOwner(u.id)} disabled={actionId === u.id} className="px-2.5 py-1 rounded text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Approve</button>
                                  <button onClick={() => handleRejectOwner(u.id)} disabled={actionId === u.id} className="px-2.5 py-1 rounded text-xs font-medium text-destructive hover:bg-destructive/10">Reject</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && <EmptyState icon={Users} title="No users found" />}
                </div>
              </div>
            </div>
          )}

          {/* ── PARKING ──────────────────────────── */}
          {tab === 'parking' && (
            <div className="space-y-5">
              {pendingParking.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    Pending Approval
                    <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full">{pendingParking.length}</span>
                  </h2>
                  <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted"><tr>{['Title', 'Owner', 'Price/hr', 'Vehicles', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-border">
                          {pendingParking.map((ps) => (
                            <tr key={ps.id} className="hover:bg-muted/30 transition-colors">
                              <td className={tdCls}>
                                <p className="font-medium">{ps.title}</p>
                                <p className="text-xs text-muted-foreground">{ps.total_slots} slots</p>
                              </td>
                              <td className={cn(tdCls, 'text-muted-foreground')}>{ps.owner?.full_name ?? '—'}</td>
                              <td className={cn(tdCls, 'font-medium text-brand')}>₹{ps.price_per_hour}</td>
                              <td className={tdCls}><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{ps.vehicle_type_allowed}</span></td>
                              <td className={tdCls}>
                                <div className="flex gap-1.5">
                                  <button onClick={() => setSelectedParking(ps)} className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:bg-muted">View</button>
                                  <button onClick={() => handleApproveParking(ps.id)} disabled={actionId === ps.id} className="px-2.5 py-1 rounded text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Approve</button>
                                  <button onClick={() => handleRemoveParking(ps.id)} disabled={actionId === ps.id} className="px-2.5 py-1 rounded text-xs font-medium text-destructive hover:bg-destructive/10">Remove</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {pendingParking.length === 0 && (
                <EmptyState icon={Building2} title="No pending approvals" message="All parking spaces have been reviewed." />
              )}
            </div>
          )}

          {/* ── BOOKINGS ─────────────────────────── */}
          {tab === 'bookings' && (
            <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted"><tr>{['Ref', 'Space', 'From', 'To', 'Amount', 'Status'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className={cn(tdCls, 'font-mono text-xs')}>{b.id.slice(0,8).toUpperCase()}</td>
                        <td className={tdCls}>{b.parking_space?.title ?? '—'}</td>
                        <td className={cn(tdCls, 'text-xs text-muted-foreground')}>{format(new Date(b.start_time), 'dd MMM, h:mm a')}</td>
                        <td className={cn(tdCls, 'text-xs text-muted-foreground')}>{format(new Date(b.end_time), 'dd MMM, h:mm a')}</td>
                        <td className={cn(tdCls, 'font-medium text-brand')}>₹{b.total_amount}</td>
                        <td className={tdCls}><StatusBadge status={b.booking_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookings.length === 0 && <EmptyState icon={CalendarCheck} title="No bookings" />}
              </div>
            </div>
          )}

          {/* ── KYC QUEUE ────────────────────────── */}
          {tab === 'kyc' && (
            <div>
              {pendingOwners.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No pending verifications" message="All owner KYC requests have been processed." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingOwners.map((p) => (
                    <div key={p.profile_id} className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{p.full_name}</h3>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                          <p className="text-xs text-muted-foreground">{p.phone}</p>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">Pending KYC</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p><span className="font-medium text-foreground">Property:</span> {p.property_address}</p>
                        <p><span className="font-medium text-foreground">Type:</span> {p.property_type}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {p.govt_id_proof_url && (
                          <a href={p.govt_id_proof_url} target="_blank" rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors">
                            View Govt ID
                          </a>
                        )}
                        {p.aadhaar_proof_url && (
                          <a href={p.aadhaar_proof_url} target="_blank" rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors">
                            View Aadhaar
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-border">
                        <button
                          onClick={() => handleApproveOwner(p.user_id)}
                          disabled={actionId === p.user_id}
                          className="flex-1 h-8 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectOwner(p.user_id)}
                          disabled={actionId === p.user_id}
                          className="flex-1 h-8 rounded-lg border border-destructive text-destructive text-xs font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Parking detail modal */}
      <Modal
        isOpen={!!selectedParking}
        onClose={() => setSelectedParking(null)}
        title="Parking Space Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedParking && (
          <div className="space-y-4">
            {selectedParking.photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedParking.photos.map((p) => (
                  <img key={p.id} src={p.photo_url} alt="" className="rounded-xl h-24 w-full object-cover" />
                ))}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Title',       selectedParking.title],
                ['Price/hr',    `₹${selectedParking.price_per_hour}`],
                ['Slots',       selectedParking.total_slots],
                ['Vehicle',     selectedParking.vehicle_type_allowed],
                ['Property',    selectedParking.property_type ?? '—'],
                ['Amenities',   selectedParking.amenities?.join(', ') || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground mb-0.5">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => { handleApproveParking(selectedParking.id); setSelectedParking(null) }}
              className="w-full h-10 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Approve this space
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
```

---

## VERIFICATION CHECKLIST — Phase 7

- [ ] `/admin` page loads with 5 tabs
- [ ] Overview tab shows 4 KPI stat cards with real data
- [ ] Monthly revenue bar chart renders using recharts
- [ ] Bookings by purpose pie chart renders using recharts
- [ ] Users tab shows table with search, role badges, enable/disable actions
- [ ] Approve/Reject buttons appear for pending owners in Users tab
- [ ] Parking tab shows pending spaces with Approve/Remove actions
- [ ] "View" button opens modal with photos + details
- [ ] Bookings tab shows all bookings table with status badges
- [ ] KYC Queue tab shows owner cards with document links
- [ ] KYC Approve/Reject buttons work and refresh data
- [ ] Tab counter badges show correct counts (KYC queue, pending parking)
- [ ] All works in dark mode
- [ ] No hardcoded colors — all use CSS variables
