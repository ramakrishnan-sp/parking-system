# PHASE 9 — Professional Refinement, QA & API Integration Audit
# ParkEase Frontend
# ⚠️ All 8 previous phases must be complete before starting this phase.
# This phase does NOT add new pages. It elevates everything already built
# to production-grade quality.

---

## WHAT THIS PHASE COVERS

This phase is a full-quality pass across the entire frontend. You will:

1. **API Integration Audit** — verify every API call, fix all field mismatches, ensure error handling is airtight
2. **UX Polish** — loading states, skeleton screens, empty states, transitions, micro-interactions
3. **Visual Refinement** — typography hierarchy, spacing consistency, responsive polish
4. **Form Hardening** — validation, disabled states, optimistic updates, double-submit prevention
5. **Edge Case Handling** — 0-slot parking, expired tokens, network failures, empty data sets
6. **Performance** — lazy loading, memoization, unnecessary re-renders
7. **Accessibility** — focus management, ARIA labels, keyboard navigation

Work through each section completely before moving to the next.

---

## SECTION 1 — GLOBAL CONSTANTS & SHARED CONFIG

### 1.1 — Create `src/lib/constants.js`

Create this file. It will be imported everywhere instead of hard-coding strings:

```js
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
export const DEFAULT_MAP_CENTER = { lat: 13.0827, lng: 80.2707 }
export const DEFAULT_MAP_ZOOM   = 14
export const DEFAULT_SEARCH_RADIUS = 2000
```

---

## SECTION 2 — API INTEGRATION AUDIT

Go through every file in `src/api/` and apply these fixes.

### 2.1 — Audit `src/api/axios.js`

Ensure the error interceptor handles these specific cases:

```js
// In the response error interceptor, REPLACE the generic error toast section with:

if (err.response) {
  const status = err.response.status
  const detail = err.response.data?.detail

  // Never show toast for 401 (handled by token refresh/logout)
  if (status === 401) return Promise.reject(err)

  // 422 Validation errors — extract all field messages
  if (status === 422) {
    const errors = err.response.data?.detail
    if (Array.isArray(errors)) {
      errors.forEach((e) => {
        const field = e.loc?.[e.loc.length - 1] ?? 'Field'
        toast.error(`${field}: ${e.msg}`)
      })
      return Promise.reject(err)
    }
  }

  // 403 — Permission denied
  if (status === 403) {
    toast.error('You do not have permission to perform this action.')
    return Promise.reject(err)
  }

  // 404 — Not found (do not toast — caller handles this)
  if (status === 404) return Promise.reject(err)

  // 429 — Rate limited
  if (status === 429) {
    toast.error('Too many requests. Please wait a moment and try again.')
    return Promise.reject(err)
  }

  // 500+ — Server errors
  if (status >= 500) {
    toast.error('A server error occurred. Please try again later.')
    return Promise.reject(err)
  }

  // Other errors — show detail or generic message
  const message = typeof detail === 'string'
    ? detail
    : err.message || 'Something went wrong'
  toast.error(message)
} else if (err.request) {
  // Network error — no response received
  toast.error('Network error. Check your internet connection.')
}

return Promise.reject(err)
```

### 2.2 — Audit all API files for correct endpoints

Open each file and verify these endpoints match exactly:

**`src/api/auth.js`** — verify these endpoint paths exist in the backend:
- `POST /auth/otp/send` → body: `{ phone, purpose }`
- `POST /auth/otp/verify` → body: `{ phone, otp, purpose }`
- `POST /auth/login` → body: `{ email, password }`
- `POST /auth/register/seeker` → multipart form
- `POST /auth/register/owner` → multipart form
- `POST /auth/refresh` → body: `{ refresh_token }`
- `POST /auth/logout` → body: `{ refresh_token }`
- `GET  /auth/me`
- `POST /auth/change-password` → body: `{ old_password, new_password, confirm_password }`

**`src/api/parking.js`** — verify:
- `GET /parking/nearby` → params: `{ lat, lng, radius, vehicle_type?, max_price?, sort_by? }`
- `GET /parking/{id}`
- `GET /parking/owner/my-spaces`
- `POST /parking/` → multipart
- `PUT /parking/{id}` → JSON
- `DELETE /parking/{id}`

**`src/api/booking.js`** — verify:
- `POST /bookings/` → body: `{ parking_id, start_time, end_time, purpose }`
- `GET /bookings/my`
- `GET /bookings/{id}`
- `POST /bookings/{id}/cancel` → body: `{ cancellation_reason }`
- `POST /bookings/{id}/review` → body: `{ booking_id, rating, comment }`
- `GET /bookings/owner/incoming`

**`src/api/payment.js`** — verify:
- `POST /payments/order` → body: `{ booking_id }`
- `POST /payments/verify` → body: `{ booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- `POST /payments/refund` → body: `{ booking_id, reason }`

**`src/api/users.js`** — verify:
- `GET /users/notifications`
- `POST /users/notifications/mark-read`
- `POST /users/profile-photo` → multipart
- `PUT /users/seeker-profile`
- `PUT /users/owner-profile`

**`src/api/admin.js`** — verify:
- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/{id}/toggle-active`
- `GET /admin/owners/pending`
- `POST /admin/owners/{id}/approve`
- `POST /admin/owners/{id}/reject`
- `GET /admin/parking/pending`
- `POST /admin/parking/{id}/approve`
- `DELETE /admin/parking/{id}`
- `GET /admin/bookings`
- `GET /admin/analytics/revenue`
- `GET /admin/analytics/bookings-by-purpose`

### 2.3 — Fix all response data access patterns

Scan every page and component. Ensure these are used consistently:

```js
// ✅ CORRECT usage
booking.booking_status       // NOT booking.status
booking.total_amount         // NOT booking.total_price
parking.is_approved          // NOT parking.status === 'approved'
parking.is_active            // NOT parking.is_available
user.user_type               // NOT user.role
useAuthStore().isAuthenticated()  // This is a function — call it: isAuthenticated()
useAuthStore().userType()         // This is a function — call it: userType()
```

### 2.4 — Add request cancellation for map search

In `ParkingMap.jsx`, prevent stale API responses from overwriting newer results:

```js
// At the top of the component:
const abortRef = useRef(null)

// In fetchNearby():
const fetchNearby = async (filters) => {
  // Cancel previous request
  if (abortRef.current) abortRef.current.abort()
  abortRef.current = new AbortController()

  setLoading(true)
  try {
    const params = { /* ... */ }
    const res = await getNearbyParking(params, {
      signal: abortRef.current.signal
    })
    setSpaces(res.data)
  } catch (err) {
    // Ignore cancellation errors
    if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
  } finally {
    setLoading(false)
  }
}

// Also update src/api/parking.js to accept signal:
export const getNearbyParking = (params, config = {}) =>
  api.get('/parking/nearby', { params, ...config })
```

---

## SECTION 3 — SKELETON LOADING SCREENS

Replace all `LoadingSpinner` instances on full-page loads with skeleton screens. This eliminates the jarring spinner-to-content jump and feels much more professional.

### 3.1 — Create `src/components/common/Skeleton.jsx`

```jsx
// src/components/common/Skeleton.jsx
import { cn } from '../../lib/utils'

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  )
}

// Stat card skeleton (matches StatCard layout)
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  )
}

// Booking card skeleton
export function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}

// Parking space card skeleton
export function ParkingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

// Notification skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <Skeleton className="mt-1.5 size-2 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full max-w-xs" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
```

### 3.2 — Apply skeletons in BookingPage

In `BookingPage.jsx`, replace the loading block:

```jsx
// Replace the loading ? <LoadingSpinner> : ... pattern with:

{loading ? (
  <>
    {/* Stat card skeletons */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    {/* Booking card skeletons */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  </>
) : ( /* existing content */ )}
```

### 3.3 — Apply skeletons in OwnerDashboard

```jsx
// Replace loading state in the "My Spaces" tab:
{loading && tab === 'My Spaces' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: 3 }).map((_, i) => <ParkingCardSkeleton key={i} />)}
  </div>
)}

// Replace loading state in "Incoming Bookings" tab with table row skeletons:
{loading && tab === 'Incoming Bookings' && (
  <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
    <table className="w-full"><tbody>
      {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
    </tbody></table>
  </div>
)}
```

### 3.4 — Apply skeletons in Profile > Notifications tab

```jsx
// Replace loading state:
{loading && (
  <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden divide-y divide-border">
    {Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
  </div>
)}
```

### 3.5 — Apply skeletons in AdminDashboard

In the overview tab, wrap the stat cards in the existing `loading` check and use `StatCardSkeleton` for each of the 4 cards. In the Users/Bookings tabs, use `TableRowSkeleton` while loading.

---

## SECTION 4 — FORM UX HARDENING

### 4.1 — Double-submit prevention

Every form submit button must be disabled while submitting. Audit these components and ensure the submit button has `disabled={loading}` AND visually shows a spinner:

- `Login.jsx` ✓ (already has this)
- `Register.jsx` ✓
- `BookingForm.jsx` ✓
- `ParkingForm.jsx` ✓
- `Profile.jsx` > SecurityTab ✓

For any missing, add this pattern:
```jsx
<button
  type="submit"
  disabled={isSubmitting}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting ? (
    <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
  ) : null}
  {isSubmitting ? 'Saving…' : 'Save'}
</button>
```

### 4.2 — Input focus rings

Ensure ALL inputs across the entire app use this exact focus style:
```
focus:outline-none focus:ring-2 focus:ring-brand/50
```

Global fix — add to `src/index.css` (in the `@layer base` block):
```css
input:focus, select:focus, textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--brand) 50%, transparent);
}
```

### 4.3 — Inline validation feedback timing

In all `react-hook-form` forms, change validation mode to `onTouched` so errors only show after a field has been touched (not immediately):

```jsx
const { register, handleSubmit, ... } = useForm({
  mode: 'onTouched',  // Add this to every useForm call
  defaultValues: { ... }
})
```

Apply to: Login, Register, BookingForm, ParkingForm, SecurityTab.

### 4.4 — BookingForm: prevent booking in the past

Add this validator to the `start_time` field:

```jsx
{...register('start_time', {
  required: 'Start time is required',
  validate: (v) => {
    const diff = new Date(v) - new Date()
    if (diff < 0) return 'Start time cannot be in the past'
    if (diff < 5 * 60 * 1000) return 'Start time must be at least 5 minutes from now'
    return true
  }
})}
```

And for `end_time`, add cross-field validation:
```jsx
{...register('end_time', {
  required: 'End time is required',
  validate: (v, form) => {
    if (!form.start_time) return true
    const hours = (new Date(v) - new Date(form.start_time)) / 3600000
    if (hours <= 0) return 'End time must be after start time'
    if (hours < 0.5) return 'Minimum booking duration is 30 minutes'
    if (hours > 72) return 'Maximum booking duration is 72 hours'
    return true
  }
})}
```

---

## SECTION 5 — VISUAL POLISH

### 5.1 — Typography hierarchy

Apply consistent type sizes across the app:

```
Page titles (h1):        text-2xl font-bold
Section titles (h2/h3):  text-lg font-semibold  or  text-sm font-semibold (for card sections)
Labels:                  text-sm font-medium
Body text:               text-sm
Secondary text:          text-xs text-muted-foreground
Mono IDs:                text-xs font-mono
```

Go through every page and verify these rules are followed. Common violations to fix:
- Admin dashboard table header text should be `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Section headings inside cards should be `text-sm font-semibold text-foreground` (not larger)
- Stat card values should be `text-2xl font-bold` (not text-3xl)

### 5.2 — Consistent spacing inside cards

Every `rounded-2xl bg-card` element should have `p-5` or `p-6` padding. Not `p-4` on some and `p-8` on others. Audit and unify:
- Stat cards: `p-5`
- Content cards: `p-6`
- Modal bodies: `p-6` (already set by shadcn DialogContent)
- Table wrapper: `p-0` (table rows have their own padding)

### 5.3 — Button consistency

Three button variants used across the app:

```jsx
// PRIMARY — brand CTA
className="h-10 px-5 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"

// SECONDARY — outlined action
className="h-10 px-5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"

// DESTRUCTIVE — cancel/delete
className="h-10 px-5 rounded-xl border border-destructive text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
```

Audit all action buttons and normalise them to one of these three variants. Remove any button that uses raw `bg-green-600`, `bg-red-500` etc. — use the correct variant instead.

### 5.4 — Badge width

All `StatusBadge` and inline status labels should use `whitespace-nowrap` to prevent wrapping in table cells:
```jsx
// In StatusBadge.jsx, add to className:
'inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium capitalize'
```

### 5.5 — Table responsiveness

Wrap all `<table>` elements in a scroll container to prevent layout breaks on mobile:
```jsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[640px] text-sm">
    ...
  </table>
</div>
```

The `min-w-[640px]` ensures tables scroll horizontally rather than squashing on mobile. Apply to all 4 tables in AdminDashboard and the bookings table in OwnerDashboard.

### 5.6 — Landing page hero height

The hero section should fill the visible viewport on first load (without the navbar). Replace `py-24` with:

```jsx
<section className="relative overflow-hidden bg-sidebar-gradient text-white min-h-[calc(100vh-4rem)] flex items-center py-16 px-4">
```

### 5.7 — Smooth page transitions

Add this to `DashboardLayout.jsx` to fade-in page content on every navigation:

```jsx
// Wrap {children} in:
<div key={location.pathname} className="animate-fade-in">
  {children}
</div>
```

You'll need to import `useLocation` from `react-router-dom` in `DashboardLayout.jsx`.

### 5.8 — Card hover animations

Every `bg-card ring-1 ring-border` card that is interactive (ParkingSpaceCard, BookingCard, result list items) should have:
```
transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float
```

This subtle lift on hover communicates interactivity without being distracting.

---

## SECTION 6 — EDGE CASES & ERROR STATES

### 6.1 — ParkingMap: handle 0 results

When the search returns an empty array, show this in the left panel above the search button:

```jsx
{!loading && spaces.length === 0 && searchPerformed && (
  <div className="rounded-xl bg-muted p-4 text-center">
    <MapPin className="size-8 text-muted-foreground/40 mx-auto mb-2" />
    <p className="text-sm font-medium text-foreground">No spaces found</p>
    <p className="text-xs text-muted-foreground mt-1">
      Try increasing the search radius or removing filters.
    </p>
  </div>
)}
```

Track `searchPerformed` with a `useState(false)` that gets set to `true` after the first search call returns.

### 6.2 — Booking form: handle full parking space

At the top of `BookingForm.jsx`, add an early guard:

```jsx
if (space?.available_slots === 0) {
  return (
    <div className="py-8 text-center space-y-3">
      <div className="size-12 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
        <Car className="size-6 text-destructive" />
      </div>
      <p className="font-semibold text-foreground">No slots available</p>
      <p className="text-sm text-muted-foreground">This space is currently full. Try again later.</p>
      <button onClick={onCancel} className="h-9 px-5 rounded-lg border border-border text-sm hover:bg-muted">
        Back to map
      </button>
    </div>
  )
}
```

### 6.3 — Handle unapproved parking for owners

In `OwnerDashboard.jsx`, the toggle switch should show a tooltip when disabled due to pending approval:

```jsx
<div className="relative group">
  <button
    onClick={handleToggle}
    disabled={toggling || !ps.is_approved}
    className="disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {ps.is_active ? <ToggleRight .../> : <ToggleLeft .../>}
  </button>
  {!ps.is_approved && (
    <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
      Awaiting admin approval
    </span>
  )}
</div>
```

### 6.4 — Handle `null` / undefined photo URLs

In `ParkingCard.jsx` and `ParkingSpaceCard.jsx`, guard photo rendering:

```jsx
// Replace: const primaryPhoto = parking.photos?.find(p => p.is_primary) || parking.photos?.[0]
// With:
const primaryPhoto = parking.photos?.find((p) => p.is_primary && p.photo_url) 
  || parking.photos?.find((p) => p.photo_url)

// Then in the img tag:
{primaryPhoto?.photo_url ? (
  <img
    src={primaryPhoto.photo_url}
    alt={parking.title}
    className="w-full h-full object-cover"
    onError={(e) => { e.target.style.display = 'none' }} // hide broken images
  />
) : (
  /* fallback gradient div */
)}
```

### 6.5 — Handle API timeout in the map

If `getNearbyParking` takes more than 10 seconds, the user is stuck with the loading overlay. Add a timeout message:

```jsx
// In ParkingMap.jsx:
const [slowNetwork, setSlowNetwork] = useState(false)

// In fetchNearby():
const timer = setTimeout(() => setSlowNetwork(true), 8000)
try {
  // ... fetch
} finally {
  clearTimeout(timer)
  setSlowNetwork(false)
  setLoading(false)
}

// In the loading overlay:
{loading && (
  <div className="absolute inset-0 bg-background/40 flex flex-col items-center justify-center rounded-2xl gap-3">
    <LoadingSpinner />
    {slowNetwork && (
      <p className="text-sm text-muted-foreground animate-fade-in">
        Taking longer than usual…
      </p>
    )}
  </div>
)}
```

### 6.6 — Guard admin stats rendering

In `AdminDashboard.jsx`, the overview tab renders `stats.users.total`, `stats.revenue` etc. These will crash if `stats` is null. Add null guards:

```jsx
// Wrap the entire overview content in:
{tab === 'overview' && stats ? (
  /* content */
) : tab === 'overview' ? (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
  </div>
) : null}
```

---

## SECTION 7 — PERFORMANCE

### 7.1 — Memoize parking list items

In `ParkingMap.jsx`, the result list re-renders every time `selected` changes. Wrap the space list item in `useCallback` for the click handler:

```jsx
// Wrap spaces.map in useMemo:
const spaceListItems = useMemo(() => spaces.map((ps) => (
  <div key={ps.id} onClick={() => { setSelected(ps); ... }}>
    ...
  </div>
)), [spaces, selected?.id]) // Only re-renders when spaces or selected changes
```

### 7.2 — Debounce map search on filter changes

In `SearchPanel.jsx`, the current implementation only searches on button click which is fine. No change needed here.

### 7.3 — Lazy load heavy pages

In `App.jsx`, lazy load pages that have heavy dependencies (recharts for admin, leaflet for map):

```jsx
import { lazy, Suspense } from 'react'
import { FullPageLoader } from './components/common/LoadingSpinner'

const ParkingMap    = lazy(() => import('./pages/ParkingMap'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

// Wrap all routes in Suspense:
<Suspense fallback={<FullPageLoader text="Loading…" />}>
  <Routes>
    ...
  </Routes>
</Suspense>
```

### 7.4 — Don't re-fetch on every tab switch

In `OwnerDashboard.jsx`, `loadAll()` is called in `useEffect([], [])` which is correct. Ensure there is NO `useEffect` that calls `loadAll()` when `tab` changes — the tabs only filter already-loaded data.

Same for `AdminDashboard.jsx` — `loadAll()` runs once on mount only.

### 7.5 — Stable map markers

The current implementation in `ParkingMap.jsx` clears and re-adds ALL markers every time `spaces` changes. Add a check to avoid this when `spaces` hasn't changed:

```jsx
useEffect(() => {
  const map = mapRef.current
  if (!map || spaces.length === 0) return
  clearMarkers()
  // ... add markers
}, [spaces]) // This is already optimal — just ensure `spaces` reference only changes when data changes
             // Ensure setSpaces(res.data) always sets a NEW array (axios always returns new objects, so this is fine)
```

---

## SECTION 8 — ACCESSIBILITY

### 8.1 — ARIA labels for icon-only buttons

Every button that contains only an icon (no text) MUST have `aria-label`:

```jsx
// Examples — audit these across the app:
<button aria-label="Close" onClick={onClose}><X /></button>
<button aria-label="Toggle sidebar"><ChevronFirst /></button>
<button aria-label="Open notifications"><Bell /></button>
<button aria-label="Open settings"><Settings /></button>
<button aria-label="User menu"><img ... /></button>
<button aria-label="Change profile photo"><Camera /></button>
<button aria-label="Clear file"><X /></button>
<button aria-label="Toggle password visibility"><Eye /></button>
```

Go through Sidebar, Topbar, BookingCard, ParkingSpaceCard, FileUpload, and Login — add `aria-label` to every icon-only button.

### 8.2 — Form labels

Every `<input>`, `<select>`, and `<textarea>` must be associated with a `<label>`. Use `htmlFor` on labels and matching `id` on inputs, OR use the wrapper pattern that is already in place (label immediately before input).

Quick audit — search for any `<input` not preceded by a `<label` within 3 lines and add one.

### 8.3 — Modal focus trap

shadcn's Dialog already handles focus trapping. Confirm this is working:
- Open the BookingForm modal
- Tab through fields
- Focus should NOT escape to the background

### 8.4 — Skip navigation for keyboard users

Not required for this app (dashboard is not public content), but DO ensure Tab order is logical on every page: sidebar → topbar → main content → first interactive element.

### 8.5 — Colour contrast

All text on `bg-brand` backgrounds must be white (`text-white`). Check:
- Sidebar active item: white text on `bg-white` with `text-brand` colour — ✓
- Buttons: `bg-brand text-white` — ✓
- StatusBadge: ensure text-to-background ratios are accessible (the existing OKLCH colours have been chosen to be accessible, so no change needed)

---

## SECTION 9 — MOBILE RESPONSIVENESS AUDIT

Go through each page at 375px viewport width and fix any of these issues:

### 9.1 — ParkingMap: mobile layout

On mobile, the two-panel map layout (left panel + map) will be unusable. Fix:

```jsx
// In ParkingMap.jsx, change the outer flex container:
<div className="h-full flex flex-col lg:flex-row gap-4">

  {/* Left panel — full width on mobile, fixed width on desktop */}
  <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
    <SearchPanel ... />
    
    {/* On mobile: show results as horizontal scroll, not vertical list */}
    {spaces.length > 0 && (
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
        {spaces.map(...)}
      </div>
    )}
  </div>

  {/* Map — fixed height on mobile, flex-1 on desktop */}
  <div className="flex-1 relative rounded-2xl overflow-hidden h-[50vh] lg:h-full">
    ...
  </div>
</div>
```

### 9.2 — Booking page stats grid

The `grid-cols-2 lg:grid-cols-4` pattern is already responsive. Ensure all 4 stat cards fit on mobile without overflow.

### 9.3 — Admin KYC queue cards

The `md:grid-cols-2` grid for KYC cards is fine. On mobile they stack at full width.

### 9.4 — Register page

On mobile, the left decorative panel (`.hidden lg:flex`) already hides. The form should be full-width. Ensure there's no horizontal overflow.

### 9.5 — Tables on mobile

All tables must be inside `overflow-x-auto` containers (covered in Section 5.5 above).

---

## SECTION 10 — INTEGRATION SMOKE TEST SCRIPT

After all changes are applied, perform this end-to-end test to verify frontend ↔ backend integration:

### Test 1: Seeker Flow (complete booking)
1. Register as a new seeker (use a new email each time)
2. Verify OTP flow works (check toast shows OTP in dev mode)
3. Login → should redirect to `/map`
4. Allow geolocation → markers should appear on map
5. Click a marker → ParkingCard popup appears
6. Click "Book Now" → BookingForm modal opens
7. Select future start/end times → total amount updates in real time
8. Click "Pay ₹X" → Razorpay checkout opens
9. Complete test payment → redirected to `/booking-confirmation/:id`
10. Check confirmation shows: booking ID, dates, total amount, exact location (if revealed)
11. Go to `/bookings` → booking appears with status `confirmed`
12. Cancel the booking → status changes to `cancelled`

### Test 2: Owner Flow
1. Login as an approved owner
2. Go to `/owner` → spaces and bookings load
3. Add a new space → submits for admin approval
4. New space shows with `pending` status badge
5. Toggle active switch is disabled (awaiting approval)
6. View incoming bookings table

### Test 3: Admin Flow
1. Login as admin (`admin@parkingsystem.com` / `Admin@1234`)
2. Overview → all 4 KPI cards load, charts render
3. Users tab → table loads, search works
4. Parking tab → pending approvals show
5. Approve a parking space → it disappears from pending list
6. KYC tab → approve an owner → they no longer appear in queue
7. Bookings tab → all bookings visible

### Test 4: Auth Flow
1. Login, close the browser tab, reopen → should auto-refresh token
2. Open the app in a new incognito tab → should redirect to `/login` (no session)
3. Let the access token expire (modify localStorage to set an invalid token) → should auto-refresh
4. Set both access AND refresh token to invalid strings → should force logout to `/login`

### Test 5: Dark Mode + Brand Color
1. Toggle dark mode → entire app goes dark, no white flashes
2. Change brand to each of 5 colors → sidebar gradient, buttons, rings, badges all change
3. Refresh the page → same theme persists
4. Test all 5 brand colors in both light and dark mode

---

## SECTION 11 — FINAL POLISH CHECKLIST

Go through every item and confirm it works:

### Loading states
- [ ] All pages show skeleton screens (not spinners) on initial data load
- [ ] Submit buttons show inline spinner and are disabled when submitting
- [ ] Map shows loading overlay with brand spinner when searching

### Transitions
- [ ] Page changes animate with `animate-fade-in`
- [ ] Modal opens/closes smoothly (shadcn handles this)
- [ ] Sidebar collapse/expand animates smoothly (300ms transition)
- [ ] Brand color change updates instantly everywhere

### Empty states
- [ ] BookingPage with 0 bookings → EmptyState with "Find Parking" CTA
- [ ] OwnerDashboard with 0 spaces → EmptyState with "Add Space" CTA
- [ ] Notifications with 0 items → EmptyState with bell-off icon
- [ ] AdminDashboard KYC with 0 pending → EmptyState
- [ ] Map with 0 results → inline message in search panel

### Error states
- [ ] Network error → sonner toast "Network error. Check your internet connection."
- [ ] 422 validation from backend → field-level error toast
- [ ] 403 → "You don't have permission..." toast
- [ ] 500 → "A server error occurred..." toast
- [ ] Broken image URLs → gracefully falls back to gradient placeholder

### Responsive
- [ ] All pages usable at 375px (iPhone SE)
- [ ] All pages usable at 768px (iPad)
- [ ] All pages usable at 1280px (laptop)
- [ ] No horizontal scroll on any page (except inside table scroll containers)
- [ ] Map is usable on mobile (stacked layout, half-height map)

### Accessibility
- [ ] All icon-only buttons have `aria-label`
- [ ] All form inputs have associated labels
- [ ] Tab order is logical on every page
- [ ] Focus rings are visible on all focusable elements (using `focus:ring-2 focus:ring-brand/50`)

### Visual quality
- [ ] No hardcoded colours anywhere — only CSS variables via Tailwind
- [ ] Dark mode looks great on every page (no pure-white elements in dark mode)
- [ ] All cards use `rounded-2xl` (not `rounded-lg` or `rounded-xl` inconsistently)
- [ ] Spacing is consistent: `gap-4` between cards, `gap-6` between sections
- [ ] Typography hierarchy is followed on every page

### API correctness
- [ ] `booking.booking_status` used everywhere (never `booking.status`)
- [ ] `booking.total_amount` used everywhere (never `booking.total_price`)
- [ ] `parking.is_approved` and `parking.is_active` used everywhere
- [ ] `user.user_type` used everywhere (never `user.role`)
- [ ] `allowedRoles` prop on `ProtectedRoute` (never `roles`)
- [ ] Razorpay flow: create order → open checkout → verify payment
- [ ] Notifications: `POST /users/notifications/mark-read` (not `/mark-all-read`)

---

## NOTES FOR THE AGENT

- Do NOT change the backend. Only the `frontend/src/` directory.
- Do NOT add new pages or routes — this is a refinement phase only.
- Do NOT change the overall visual design — refine and polish what exists.
- If you find an API endpoint path that doesn't match the backend, flag it with a comment `// ⚠️ VERIFY ENDPOINT` and implement it as written in the backend docs — do not guess.
- Make changes incrementally. After each section (1–11), verify `npm run build` still passes before moving to the next.
- The goal is: a developer looking at this codebase for the first time should find it clean, consistent, and production-ready.
