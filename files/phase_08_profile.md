# PHASE 8 — Profile Page
# ParkEase Frontend Redesign
# ⚠️ Phases 1–7 must be complete before starting this phase.

---

## CONTEXT

You are building the Profile page (`/profile`). This is the last page in the rebuild. It is accessible to ALL authenticated users (seekers, owners, admins). It has 3 tabs:
- **Profile** — view and edit user info + avatar upload
- **Notifications** — list with unread indicator, mark all read
- **Security** — change password form

---

## STEP 1 — Update the users API file

Replace `frontend/src/api/users.js` with this complete version:

```js
import api from './axios'

export const getMyNotifications       = ()       => api.get('/users/notifications')
export const markAllNotificationsRead = ()       => api.post('/users/notifications/mark-read')
export const uploadProfilePhoto       = (fd)     => api.post('/users/profile-photo', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateSeekerProfile      = (data)   => api.put('/users/seeker-profile', data)
export const updateOwnerProfile       = (data)   => api.put('/users/owner-profile', data)
export const changePassword           = (data)   => api.post('/auth/change-password', data)
```

---

## STEP 2 — Build the Profile page

Replace `frontend/src/pages/Profile.jsx` entirely:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  User, Bell, Lock, Camera, CheckCheck,
  Eye, EyeOff, BellOff,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  getMyNotifications, markAllNotificationsRead,
  uploadProfilePhoto, updateSeekerProfile,
  updateOwnerProfile,
} from '../api/users'
import { changePassword } from '../api/auth'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { cn } from '../lib/utils'

const TABS = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'security',      label: 'Security',       icon: Lock },
]

export default function Profile() {
  const { user, refreshUser } = useAuthStore()
  const [tab, setTab] = useState('profile')

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 pb-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profile'       && <ProfileTab user={user} onUpdate={refreshUser} />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'security'      && <SecurityTab />}
    </div>
  )
}

/* ── Profile Tab ──────────────────────────────────────────── */

function ProfileTab({ user, onUpdate }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      vehicle_number: user?.seeker_profile?.vehicle_number ?? '',
      vehicle_type:   user?.seeker_profile?.vehicle_type   ?? '',
      property_address: user?.owner_profile?.property_address ?? '',
      property_type:    user?.owner_profile?.property_type    ?? '',
    },
  })

  if (!user) return <LoadingSpinner text="Loading profile…" />

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB'); return }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      await uploadProfilePhoto(fd)
      toast.success('Profile photo updated!')
      onUpdate?.()
    } catch {} finally { setUploading(false) }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (user.user_type === 'seeker') {
        await updateSeekerProfile({
          vehicle_number: data.vehicle_number,
          vehicle_type:   data.vehicle_type,
        })
      } else if (user.user_type === 'owner') {
        await updateOwnerProfile({
          property_address: data.property_address,
          property_type:    data.property_type,
        })
      }
      toast.success('Profile updated!')
      onUpdate?.()
    } catch {} finally { setSaving(false) }
  }

  const roleColor = {
    seeker: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    owner:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    admin:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }[user.user_type]

  const input = 'h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all'

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt="Profile"
                className="size-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="size-20 rounded-2xl bg-brand flex items-center justify-center text-white text-2xl font-bold select-none">
                {user.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change photo"
              className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-brand text-white shadow flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {uploading
                ? <span className="size-3 rounded-full border border-white/40 border-t-white animate-spin" />
                : <Camera className="size-3.5" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          {/* Identity */}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', roleColor)}>
                {user.user_type}
              </span>
              {user.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCheck className="size-3" /> Verified
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Joined {format(new Date(user.created_at), 'MMM yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Static info */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Full name"    value={user.full_name} />
          <InfoRow label="Email"        value={user.email} />
          <InfoRow label="Phone"        value={user.phone} />
          <InfoRow label="Aadhaar"      value={user.aadhaar_number ? `****${user.aadhaar_number.slice(-4)}` : '—'} />
          <InfoRow label="Address"      value={user.residential_address ?? '—'} />
        </div>
        <p className="text-xs text-muted-foreground">To update name, email or Aadhaar, contact support.</p>
      </div>

      {/* Editable profile section (seeker / owner) */}
      {(user.user_type === 'seeker' || user.user_type === 'owner') && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-card ring-1 ring-border shadow-card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">
            {user.user_type === 'seeker' ? 'Vehicle Information' : 'Property Information'}
          </h3>

          {user.user_type === 'seeker' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vehicle number</label>
                <input {...register('vehicle_number')} className={input} placeholder="TN12AB1234" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vehicle type</label>
                <select {...register('vehicle_type')} className={cn(input)}>
                  <option value="">Select…</option>
                  {['car', 'bike', 'ev'].map((v) => (
                    <option key={v} value={v}>{v.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {user.user_type === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Property address</label>
                <input {...register('property_address')} className={input} placeholder="Address" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Property type</label>
                <select {...register('property_type')} className={cn(input)}>
                  <option value="">Select…</option>
                  {['house', 'apartment', 'shop', 'office'].map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 h-10 rounded-lg bg-brand text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving && <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  )
}

/* ── Notifications Tab ───────────────────────────────────── */

function NotificationsTab() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [marking, setMarking]             = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getMyNotifications()
      setNotifications(res.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleMarkAll = async () => {
    setMarking(true)
    try {
      await markAllNotificationsRead()
      toast.success('All notifications marked as read')
      load()
    } catch {} finally { setMarking(false) }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) return <LoadingSpinner text="Loading notifications…" />

  return (
    <div className="space-y-4">
      {/* Header with mark all */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={marking}
            className="flex items-center gap-1.5 text-sm text-brand hover:opacity-80 font-medium disabled:opacity-50 transition-opacity"
          >
            <CheckCheck className="size-4" />
            {marking ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <BellOff className="size-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground">You'll see booking updates and alerts here.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-4 px-5 py-4 transition-colors',
                !n.is_read ? 'bg-brand/5' : 'hover:bg-muted/40'
              )}
            >
              {/* Unread dot */}
              <div className="mt-1.5 shrink-0">
                {!n.is_read
                  ? <span className="size-2 rounded-full bg-brand block" />
                  : <span className="size-2 rounded-full bg-transparent block" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !n.is_read ? 'font-semibold text-foreground' : 'text-foreground')}>
                  {n.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {format(new Date(n.created_at), 'dd MMM yyyy, h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Security Tab ────────────────────────────────────────── */

function SecurityTab() {
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm()

  const newPwd = watch('new_password')

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await changePassword({
        old_password:     data.old_password,
        new_password:     data.new_password,
        confirm_password: data.confirm_password,
      })
      toast.success('Password changed successfully!')
      reset()
    } catch {} finally { setSaving(false) }
  }

  const input = 'h-10 w-full rounded-md bg-background ring-1 ring-border px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all'

  return (
    <div className="space-y-6 max-w-md">
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Change Password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Current password</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                className={cn(input, errors.old_password && 'ring-destructive')}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('old_password', { required: 'Current password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.old_password && <p className="text-xs text-destructive">{errors.old_password.message}</p>}
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={cn(input, errors.new_password && 'ring-destructive')}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register('new_password', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Min. 8 characters' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm new password</label>
            <input
              type="password"
              className={cn(input, errors.confirm_password && 'ring-destructive')}
              placeholder="Repeat new password"
              autoComplete="new-password"
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: (v) => v === newPwd || 'Passwords do not match',
              })}
            />
            {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-10 rounded-lg bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving && <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Session info note */}
      <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Session Security</p>
        <p>You will remain signed in after changing your password. To sign out all devices, use the sign out option in the sidebar.</p>
      </div>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────── */

function InfoRow({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value ?? '—'}</p>
    </div>
  )
}
```

---

## VERIFICATION CHECKLIST

Before marking Phase 8 (and the entire rebuild) complete:

- [ ] `/profile` renders with 3 tabs: Profile, Notifications, Security
- [ ] Profile tab shows user avatar (or initial letter), name, email, role badge, verified badge
- [ ] Camera button uploads new photo via `POST /users/profile-photo`
- [ ] Static info section shows masked Aadhaar, email, phone, address
- [ ] Seeker: editable vehicle number + vehicle type fields
- [ ] Owner: editable property address + property type fields
- [ ] "Save Changes" calls the correct API based on `user.user_type`
- [ ] Notifications tab loads list from `GET /users/notifications`
- [ ] Unread notifications have blue dot and subtle brand background
- [ ] "Mark all read" calls `POST /users/notifications/mark-read`
- [ ] Empty state shows when no notifications
- [ ] Security tab has current password + new password + confirm fields
- [ ] Password eye toggle works on both fields
- [ ] Passwords not matching shows inline error
- [ ] Change password calls `POST /auth/change-password`
- [ ] All 3 tabs render correctly in dark mode

---

## FINAL REBUILD CHECKLIST

Run through this to confirm the entire frontend is complete and working:

### Core infrastructure
- [ ] Vite builds without errors: `npm run build`
- [ ] All 10 original bugs fixed (see list below)
- [ ] No hardcoded colors anywhere — only `bg-brand`, `text-brand`, CSS variables
- [ ] Dark mode works on every page
- [ ] Brand color picker persists and applies on every page
- [ ] `sonner` toast replaces all `react-hot-toast` references

### Bug fixes confirmed
1. [ ] `ProtectedRoute` uses `allowedRoles` prop
2. [ ] `BookingPage` filters by `b.booking_status`
3. [ ] `BookingConfirmation` uses `booking.total_amount`
4. [ ] `Profile` uses `user.user_type`
5. [ ] `ParkingMap` uses Zustand store methods (not function calls)
6. [ ] `vite.config.js` has no `@googlemaps` or `@stripe` chunks
7. [ ] Payment uses Razorpay order+verify flow
8. [ ] Notifications uses `POST /users/notifications/mark-read`
9. [ ] `BookingForm` dynamically loads Razorpay script
10. [ ] `OwnerDashboard` uses `ps.is_approved` and `ps.is_active`

### Pages
- [ ] `/` — Landing page with hero, features, stats, CTA
- [ ] `/login` — Login form, redirects by role after login
- [ ] `/register` — Seeker/Owner tabs, OTP flow
- [ ] `/map` — Leaflet map + search panel + booking modal
- [ ] `/bookings` — Booking list with status filters
- [ ] `/booking-confirmation/:id` — Confirmation with maps link
- [ ] `/owner` — Owner dashboard with spaces + bookings tabs
- [ ] `/admin` — Admin dashboard with all 5 tabs + charts
- [ ] `/profile` — Profile, notifications, security tabs
- [ ] `/unauthorized` — 403 page
- [ ] `*` — 404 page

### Auth
- [ ] Login saves tokens to localStorage, session flag to sessionStorage
- [ ] JWT auto-refresh works (open Network tab — watch for refresh calls)
- [ ] Force-logout fires on 401 with no valid refresh token
- [ ] New tab/browser session silently refreshes token
- [ ] Logout clears all stored tokens and redirects to `/login`
