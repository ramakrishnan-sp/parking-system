# PHASE 2 — Authentication System
# ParkEase Frontend Redesign
# ⚠️ Phase 1 must be complete before starting this phase.

---

## CONTEXT

You are continuing the ParkEase frontend rebuild. Phase 1 (design system foundation) is complete. In this phase you will implement the complete authentication system: Zustand auth store, Axios interceptor with JWT refresh logic, and the ProtectedRoute component.

The backend auth endpoints are at `/api/v1/auth/`. The backend is NOT to be modified.

---

## BACKEND AUTH CONTRACT

The backend returns this shape on `POST /api/v1/auth/login`:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "token_type": "bearer",
  "user_type": "seeker",
  "user_id": "uuid-string"
}
```

`GET /api/v1/auth/me` returns the full user object:
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "user_type": "seeker",
  "is_verified": true,
  "is_active": true,
  "profile_photo_url": null,
  "created_at": "2024-01-01T00:00:00",
  "seeker_profile": { ... } | null,
  "owner_profile": { ... } | null
}
```

Token lifetimes: access token = 60 minutes, refresh token = 30 days.

---

## STEP 1 — Create the API base client

Replace `frontend/src/api/axios.js` entirely:

```js
import axios from 'axios'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parkease_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: handle 401 + token refresh ─────
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until token is refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('parkease_refresh_token')
      if (!refreshToken) {
        // No refresh token → force logout
        _forceLogout()
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        // Store new tokens
        localStorage.setItem('parkease_access_token', data.access_token)
        localStorage.setItem('parkease_refresh_token', data.refresh_token)
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`

        processQueue(null, data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`

        // Update store without causing a re-render loop
        window.dispatchEvent(new CustomEvent('parkease:token-refreshed', { detail: data }))

        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        _forceLogout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // Show error toast for non-401 errors
    if (err.response?.status !== 401) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Something went wrong'
      toast.error(typeof message === 'string' ? message : JSON.stringify(message))
    }

    return Promise.reject(err)
  }
)

function _forceLogout() {
  localStorage.removeItem('parkease_access_token')
  localStorage.removeItem('parkease_refresh_token')
  sessionStorage.removeItem('parkease_session_active')
  window.dispatchEvent(new Event('parkease:force-logout'))
}

export default api
```

---

## STEP 2 — Create the auth API module

Replace `frontend/src/api/auth.js` entirely:

```js
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
```

---

## STEP 3 — Create the Zustand auth store

Replace `frontend/src/store/authStore.js` entirely:

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMe } from '../api/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      // ── Called after successful login ──────────────────
      login: async (tokenData) => {
        const { access_token, refresh_token } = tokenData

        // Store tokens in localStorage
        localStorage.setItem('parkease_access_token', access_token)
        localStorage.setItem('parkease_refresh_token', refresh_token)

        // Set session flag (cleared on browser close)
        sessionStorage.setItem('parkease_session_active', '1')

        set({ accessToken: access_token, refreshToken: refresh_token, isLoading: true })

        // Fetch full user profile
        try {
          const { data } = await getMe()
          set({ user: data, isLoading: false })
        } catch {
          set({ user: null, isLoading: false })
        }
      },

      // ── Called on logout ───────────────────────────────
      logout: () => {
        localStorage.removeItem('parkease_access_token')
        localStorage.removeItem('parkease_refresh_token')
        sessionStorage.removeItem('parkease_session_active')
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false })
      },

      // ── Update user object directly ────────────────────
      setUser: (user) => set({ user }),

      // ── Called after token refresh event ──────────────
      updateTokens: (access_token, refresh_token) => {
        localStorage.setItem('parkease_access_token', access_token)
        localStorage.setItem('parkease_refresh_token', refresh_token)
        set({ accessToken: access_token, refreshToken: refresh_token })
      },

      // ── Re-fetch user from API ─────────────────────────
      refreshUser: async () => {
        set({ isLoading: true })
        try {
          const { data } = await getMe()
          set({ user: data, isLoading: false })
        } catch {
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Derived helpers ────────────────────────────────
      isAuthenticated: () => !!get().accessToken,
      userType: () => get().user?.user_type ?? null,
      isAdmin: () => get().user?.user_type === 'admin',
      isOwner: () => get().user?.user_type === 'owner',
      isSeeker: () => get().user?.user_type === 'seeker',
    }),
    {
      name: 'parkease-auth',
      // Only persist tokens + user, not loading state
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)

export default useAuthStore
```

---

## STEP 4 — Create the session initializer hook

Create `frontend/src/hooks/useSessionInit.js`:

```js
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Runs once on app boot. 
 * If we have tokens but the session flag is missing (new browser session / tab),
 * attempt a silent token refresh. If it fails, force logout.
 * Also listens for the force-logout event fired by the Axios interceptor.
 */
export function useSessionInit() {
  const { accessToken, refreshToken: storedRefresh, updateTokens, logout, refreshUser } =
    useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const sessionActive = sessionStorage.getItem('parkease_session_active')

    if (accessToken && !sessionActive) {
      // New session: try to refresh silently
      const rt = localStorage.getItem('parkease_refresh_token')
      if (!rt) {
        logout()
        return
      }

      axios
        .post(`${API_URL}/api/v1/auth/refresh`, { refresh_token: rt })
        .then(({ data }) => {
          updateTokens(data.access_token, data.refresh_token)
          sessionStorage.setItem('parkease_session_active', '1')
          refreshUser()
        })
        .catch(() => {
          logout()
          navigate('/login', { replace: true })
        })
    } else if (accessToken && sessionActive) {
      // Existing session: just re-fetch user to ensure it's fresh
      refreshUser()
    }

    // Listen for force-logout events from axios interceptor
    const handleForceLogout = () => {
      logout()
      navigate('/login', { replace: true })
    }

    // Listen for token refresh events from axios interceptor
    const handleTokenRefreshed = (e) => {
      updateTokens(e.detail.access_token, e.detail.refresh_token)
    }

    window.addEventListener('parkease:force-logout', handleForceLogout)
    window.addEventListener('parkease:token-refreshed', handleTokenRefreshed)

    return () => {
      window.removeEventListener('parkease:force-logout', handleForceLogout)
      window.removeEventListener('parkease:token-refreshed', handleTokenRefreshed)
    }
  }, []) // Intentionally empty — runs only once on mount
}
```

---

## STEP 5 — Create ProtectedRoute component

Replace `frontend/src/components/common/ProtectedRoute.jsx`:

```jsx
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { FullPageLoader } from './LoadingSpinner'

/**
 * Wraps a route with authentication + role guards.
 *
 * Usage:
 *   <ProtectedRoute>                          → any authenticated user
 *   <ProtectedRoute allowedRoles={['seeker']} → seeker only
 *   <ProtectedRoute allowedRoles={['admin']}  → admin only
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { accessToken, user, isLoading } = useAuthStore()
  const location = useLocation()

  // Still initializing / fetching user
  if (isLoading) {
    return <FullPageLoader text="Loading…" />
  }

  // Not authenticated → redirect to login (save current path)
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
```

---

## STEP 6 — Create LoadingSpinner component

Create `frontend/src/components/common/LoadingSpinner.jsx`:

```jsx
export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <svg
        className={`animate-spin text-brand ${sizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export function FullPageLoader({ text = 'Loading…' }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
```

---

## STEP 7 — Update App.jsx to use session init + corrected routes

Replace `frontend/src/App.jsx` with:

```jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import { useSessionInit } from './hooks/useSessionInit'

// Pages (stubs for now — will be built in later phases)
import Home               from './pages/Home'
import Login              from './pages/Login'
import Register           from './pages/Register'
import ParkingMap         from './pages/ParkingMap'
import BookingPage        from './pages/BookingPage'
import BookingConfirmation from './pages/BookingConfirmation'
import OwnerDashboard     from './pages/OwnerDashboard'
import AdminDashboard     from './pages/AdminDashboard'
import Profile            from './pages/Profile'

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">403</p>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
        <a href="/" className="inline-block px-4 py-2 bg-brand text-white rounded-lg text-sm">
          Go home
        </a>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <p className="text-muted-foreground">Page not found.</p>
        <a href="/" className="inline-block px-4 py-2 bg-brand text-white rounded-lg text-sm">
          Go home
        </a>
      </div>
    </div>
  )
}

// Inner component so useSessionInit can use router hooks
function AppRoutes() {
  useSessionInit()

  // Apply saved brand color on boot
  useEffect(() => {
    const saved = localStorage.getItem('parkease-brand') || 'purple'
    document.documentElement.setAttribute('data-brand', saved)
  }, [])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"            element={<Home />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/register"    element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Seeker + Owner: map */}
      <Route path="/map" element={
        <ProtectedRoute allowedRoles={['seeker', 'owner']}>
          <ParkingMap />
        </ProtectedRoute>
      } />

      {/* Seeker only */}
      <Route path="/bookings" element={
        <ProtectedRoute allowedRoles={['seeker']}>
          <BookingPage />
        </ProtectedRoute>
      } />
      <Route path="/booking-confirmation/:id" element={
        <ProtectedRoute allowedRoles={['seeker']}>
          <BookingConfirmation />
        </ProtectedRoute>
      } />

      {/* Owner only */}
      <Route path="/owner" element={
        <ProtectedRoute allowedRoles={['owner']}>
          <OwnerDashboard />
        </ProtectedRoute>
      } />

      {/* Admin only */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* All authenticated */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
```

---

## STEP 8 — Create page stubs (temporary)

For every page that doesn't exist yet, create a minimal stub so the app compiles. Create these files only if they don't already exist:

`frontend/src/pages/Home.jsx`:
```jsx
export default function Home() {
  return <div className="p-8 text-foreground">Home — coming in Phase 4</div>
}
```

`frontend/src/pages/Login.jsx`:
```jsx
export default function Login() {
  return <div className="p-8 text-foreground">Login — coming in Phase 3</div>
}
```

`frontend/src/pages/Register.jsx`:
```jsx
export default function Register() {
  return <div className="p-8 text-foreground">Register — coming in Phase 3</div>
}
```

`frontend/src/pages/ParkingMap.jsx`:
```jsx
export default function ParkingMap() {
  return <div className="p-8 text-foreground">Map — coming in Phase 5</div>
}
```

`frontend/src/pages/BookingPage.jsx`:
```jsx
export default function BookingPage() {
  return <div className="p-8 text-foreground">Bookings — coming in Phase 5</div>
}
```

`frontend/src/pages/BookingConfirmation.jsx`:
```jsx
export default function BookingConfirmation() {
  return <div className="p-8 text-foreground">Confirmation — coming in Phase 5</div>
}
```

`frontend/src/pages/OwnerDashboard.jsx`:
```jsx
export default function OwnerDashboard() {
  return <div className="p-8 text-foreground">Owner Dashboard — coming in Phase 6</div>
}
```

`frontend/src/pages/AdminDashboard.jsx`:
```jsx
export default function AdminDashboard() {
  return <div className="p-8 text-foreground">Admin Dashboard — coming in Phase 7</div>
}
```

`frontend/src/pages/Profile.jsx`:
```jsx
export default function Profile() {
  return <div className="p-8 text-foreground">Profile — coming in Phase 8</div>
}
```

---

## VERIFICATION CHECKLIST

Before marking Phase 2 complete:

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors (we are using .jsx/.js)
- [ ] `src/api/axios.js` has both request and response interceptors
- [ ] `src/store/authStore.js` exports `useAuthStore` as default
- [ ] `src/hooks/useSessionInit.js` exists
- [ ] `src/components/common/ProtectedRoute.jsx` uses `allowedRoles` prop (NOT `roles`)
- [ ] `src/components/common/LoadingSpinner.jsx` exports both `default` and `FullPageLoader`
- [ ] All 9 page stubs exist and import correctly in `App.jsx`
- [ ] Navigating to `/admin` in the browser redirects to `/login` (because not authenticated)
- [ ] Navigating to `/login` shows the stub page

---

## IMPORTANT: Field Name Reference

These field names from the backend API must be used consistently everywhere going forward:

| Use this | NOT this |
|----------|----------|
| `user.user_type` | `user.role` |
| `booking.booking_status` | `booking.status` |
| `booking.total_amount` | `booking.total_price` |
| `parking.is_approved` + `parking.is_active` | `parking.status` or `parking.is_available` |
| `allowedRoles` prop | `roles` prop on ProtectedRoute |
