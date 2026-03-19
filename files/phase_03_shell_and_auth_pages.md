# PHASE 3 — Dashboard Shell + Auth Pages (Login & Register)
# ParkEase Frontend Redesign
# ⚠️ Phases 1 and 2 must be complete before starting this phase.

---

## CONTEXT

You are continuing the ParkEase frontend rebuild. In this phase you will build:
1. The **DashboardLayout** (sidebar + topbar shell used by all protected pages)
2. The **Login** page
3. The **Register** page (with OTP phone verification)

All styling uses the CSS variables and Tailwind tokens from Phase 1. All auth logic uses the store and API from Phase 2.

---

## STEP 1 — Build the Sidebar component

Create `frontend/src/components/common/Sidebar.jsx`:

```jsx
import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  MapPin, CalendarCheck, Building2, LayoutDashboard,
  Users, Car, User, LogOut, ChevronFirst, ChevronLast,
  Settings,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useAuthStore from '../../store/authStore'
import { logoutUser } from '../../api/auth'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const NAV_BY_ROLE = {
  seeker: [
    { href: '/map',      label: 'Find Parking', icon: MapPin },
    { href: '/bookings', label: 'My Bookings',  icon: CalendarCheck },
    { href: '/profile',  label: 'Profile',      icon: User },
  ],
  owner: [
    { href: '/owner',    label: 'My Spaces',    icon: Building2 },
    { href: '/profile',  label: 'Profile',      icon: User },
  ],
  admin: [
    { href: '/admin',    label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/profile',  label: 'Profile',      icon: User },
  ],
}

export function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, accessToken } = useAuthStore()
  const [open, setOpen] = useState(true)

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('parkease-sidebar-open')
    if (saved !== null) setOpen(saved === '1')
  }, [])
  useEffect(() => {
    localStorage.setItem('parkease-sidebar-open', open ? '1' : '0')
  }, [open])

  const navItems = NAV_BY_ROLE[user?.user_type] ?? []

  const handleLogout = async () => {
    const rt = localStorage.getItem('parkease_refresh_token')
    try {
      if (rt) await logoutUser(rt)
    } catch {}
    logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const isActive = (href) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href + '/'))

  return (
    <aside
      className={cn(
        'bg-sidebar-gradient text-white flex flex-col h-full transition-[width] duration-300 shrink-0',
        open ? 'w-52' : 'w-[72px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 rounded-xl bg-white/20 grid place-items-center font-bold text-sm shrink-0">
            PE
          </div>
          {open && (
            <span className="text-sm font-semibold truncate">ParkEase</span>
          )}
        </div>
        <button
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg bg-white/20 p-1.5 hover:bg-white/30 shrink-0"
        >
          {open
            ? <ChevronFirst className="size-4" />
            : <ChevronLast  className="size-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-1">
        <ul className="flex flex-col gap-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  to={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
                    active
                      ? 'bg-white text-brand font-medium'
                      : 'text-white/90 hover:bg-white/15'
                  )}
                >
                  <Icon className={cn('size-5 shrink-0', active ? 'text-brand' : 'text-white')} />
                  {open && <span className="text-sm">{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer: tip + logout */}
      <div className="px-3 pb-5 pt-2 space-y-2">
        {open && (
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs leading-5 text-white/80">
              {user?.user_type === 'seeker'
                ? 'Find and book nearby parking in seconds.'
                : user?.user_type === 'owner'
                ? 'Manage your spaces and track earnings.'
                : 'Manage the platform from here.'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 w-full',
            'text-white/80 hover:bg-white/15 transition-colors'
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {open && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
```

---

## STEP 2 — Build the Topbar component

Create `frontend/src/components/common/Topbar.jsx`:

```jsx
import { Bell, Search, Settings, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { ThemeToggle } from './ThemeToggle'
import { ColorThemePicker } from './ColorThemePicker'
import useAuthStore from '../../store/authStore'
import { getMyNotifications } from '../../api/users'

export function Topbar({ onMenuClick }) {
  const { user } = useAuthStore()
  const [q, setQ] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    getMyNotifications()
      .then((r) => {
        const unread = r.data.filter((n) => !n.is_read).length
        setUnreadCount(unread)
      })
      .catch(() => {})
  }, [user])

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  const roleLabel = {
    seeker: 'Seeker',
    owner: 'Owner',
    admin: 'Admin',
  }[user?.user_type] ?? ''

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6">
      <div className="h-16 px-4 flex items-center justify-between gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-full p-2 hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <label className="relative block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search parking, bookings…"
              className="w-full rounded-full border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </label>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative rounded-full p-2 hover:bg-muted transition-colors focus:outline-none">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex items-center justify-center bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount === 0
                ? <DropdownMenuItem className="text-muted-foreground">No new notifications</DropdownMenuItem>
                : <DropdownMenuItem asChild>
                    <Link to="/profile">View all notifications</Link>
                  </DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none">
                <Settings className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <ThemeToggle />
              </div>
              <ColorThemePicker />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-1 hover:bg-muted transition-colors focus:outline-none">
                {user?.profile_photo_url ? (
                  <img
                    src={user.profile_photo_url}
                    alt="Profile"
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-brand text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm truncate">{user?.full_name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  <span className="text-xs text-brand font-medium">{roleLabel}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile & Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" asChild>
                <Link to="/login">Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
```

---

## STEP 3 — Build the DashboardLayout component

Create `frontend/src/components/common/DashboardLayout.jsx`:

```jsx
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-2 py-3 sm:px-4 sm:py-5">
        {/* Outer rounded card */}
        <div className="rounded-3xl bg-card shadow-card ring-1 ring-border overflow-hidden">

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex h-[95vh]">
            {/* Sidebar */}
            <div
              className={`
                fixed inset-y-0 left-0 z-50
                lg:relative lg:z-auto
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}
            >
              <Sidebar
                mobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </div>

            {/* Main content */}
            <main className="flex-1 min-w-0 bg-muted rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none overflow-auto px-4 py-3 sm:px-6 sm:py-5 md:px-8">
              <Topbar onMenuClick={() => setSidebarOpen(true)} />
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## STEP 4 — Update App.jsx to wrap protected pages in DashboardLayout

Update `frontend/src/App.jsx`. Import `DashboardLayout` and wrap all protected routes:

```jsx
// Add this import at the top
import DashboardLayout from './components/common/DashboardLayout'

// Wrap every protected route like this:
<Route path="/map" element={
  <ProtectedRoute allowedRoles={['seeker', 'owner']}>
    <DashboardLayout>
      <ParkingMap />
    </DashboardLayout>
  </ProtectedRoute>
} />

// Apply the same pattern to: /bookings, /booking-confirmation/:id,
// /owner, /admin, /profile
// Public routes (/, /login, /register) do NOT use DashboardLayout
```

---

## STEP 5 — Build the Login page

Replace `frontend/src/pages/Login.jsx`:

```jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Car } from 'lucide-react'
import { toast } from 'sonner'
import { loginUser } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginUser(data)
      await login(res.data)

      toast.success('Welcome back!')

      // Redirect to original page or role default
      const from = location.state?.from?.pathname
      const userType = res.data.user_type

      if (from && from !== '/login') {
        navigate(from, { replace: true })
        return
      }

      if (userType === 'admin')  navigate('/admin',  { replace: true })
      else if (userType === 'owner') navigate('/owner', { replace: true })
      else navigate('/map', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-10 rounded-xl bg-brand grid place-items-center">
            <Car className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">ParkEase</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card p-7 ring-1 ring-border shadow-card animate-slide-up">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Welcome back. Enter your credentials.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                })}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## STEP 6 — Build the Register page

Replace `frontend/src/pages/Register.jsx`:

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Car, Building2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { registerSeeker, registerOwner, sendOTP, verifyOTP } from '../api/auth'

const VEHICLE_TYPES = ['car', 'bike', 'ev']
const PROPERTY_TYPES = ['house', 'apartment', 'shop', 'office']

export default function Register() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('seeker')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm()

  const handleSendOtp = async () => {
    const phone = getValues('phone')
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    setOtpLoading(true)
    try {
      const res = await sendOTP(phone)
      setOtpSent(true)
      // In dev mode, backend returns the OTP — show it in toast
      if (res.data?.otp) {
        toast.success(`OTP sent! Your OTP is: ${res.data.otp}`, { duration: 20000 })
      } else {
        toast.success('OTP sent to your mobile number')
      }
    } catch {} finally { setOtpLoading(false) }
  }

  const handleVerifyOtp = async () => {
    const phone = getValues('phone')
    setOtpLoading(true)
    try {
      await verifyOTP(phone, otpValue)
      setOtpVerified(true)
      toast.success('Phone number verified!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP')
    } finally { setOtpLoading(false) }
  }

  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone number first')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()

      // Append all text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof FileList) {
          if (value[0]) fd.append(key, value[0])
        } else if (value !== undefined && value !== '') {
          fd.append(key, value)
        }
      })

      // Override phone with the verified one
      fd.set('phone', `+91${getValues('phone')}`)

      if (tab === 'seeker') {
        await registerSeeker(fd)
      } else {
        await registerOwner(fd)
      }

      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const switchTab = (t) => {
    setTab(t)
    reset()
    setOtpSent(false)
    setOtpVerified(false)
    setOtpValue('')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel (desktop only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-sidebar-gradient flex-col items-center justify-center p-12 text-white">
        <div className="size-16 rounded-2xl bg-white/20 grid place-items-center mb-6">
          <Car className="size-8" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-center">Join ParkEase</h2>
        <p className="text-white/80 text-center leading-relaxed">
          Find nearby parking in seconds, or earn by listing your unused parking space.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-xs">
          {[
            ['2,400+', 'Parking spaces'],
            ['15,000+', 'Happy drivers'],
            ['₹12M+', 'Total saved'],
            ['4.8★', 'Average rating'],
          ].map(([val, lbl]) => (
            <div key={lbl} className="rounded-xl bg-white/10 p-3 text-center">
              <p className="font-bold text-lg">{val}</p>
              <p className="text-xs text-white/70 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 overflow-auto">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="size-9 rounded-xl bg-brand grid place-items-center">
              <Car className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold">ParkEase</span>
          </div>

          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-card animate-slide-up">
            <h1 className="text-2xl font-semibold mb-1">Create account</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Join and start parking smarter.
            </p>

            {/* Tab switcher */}
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              {[
                { key: 'seeker', label: 'Seeker', icon: Car },
                { key: 'owner',  label: 'Owner',  icon: Building2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === key
                      ? 'bg-card shadow text-brand'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />{label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Full name */}
              <Field label="Full name" error={errors.full_name?.message}>
                <input
                  {...register('full_name', { required: 'Full name is required' })}
                  className={inputCls(errors.full_name)}
                  placeholder="Jane Doe"
                />
              </Field>

              {/* Email */}
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  type="email"
                  className={inputCls(errors.email)}
                  placeholder="you@example.com"
                />
              </Field>

              {/* Password */}
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Min 8 characters' },
                    })}
                    type={showPwd ? 'text' : 'password'}
                    className={`${inputCls(errors.password)} pr-10`}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {/* Phone + OTP */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mobile number</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      +91
                    </span>
                    <input
                      {...register('phone', { required: 'Phone is required', pattern: { value: /^\d{10}$/, message: '10 digits required' } })}
                      type="tel"
                      maxLength={10}
                      disabled={otpVerified}
                      className={`${inputCls(errors.phone)} pl-12`}
                      placeholder="10-digit number"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {otpLoading ? '…' : otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                  {otpVerified && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium px-2">
                      <CheckCircle className="size-4" /> Verified
                    </span>
                  )}
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              {/* OTP input */}
              {otpSent && !otpVerified && (
                <div className="space-y-1.5 animate-slide-up">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <div className="flex gap-2">
                    <input
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      maxLength={6}
                      className="flex-1 h-10 rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 tracking-widest text-center font-mono"
                      placeholder="• • • • • •"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpValue.length < 6}
                      className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Residential address */}
              <Field label="Residential address" error={errors.residential_address?.message}>
                <input
                  {...register('residential_address', { required: 'Address is required' })}
                  className={inputCls(errors.residential_address)}
                  placeholder="Your home address"
                />
              </Field>

              {/* Aadhaar */}
              <Field label="Aadhaar number" error={errors.aadhaar_number?.message}>
                <input
                  {...register('aadhaar_number', {
                    required: 'Aadhaar is required',
                    pattern: { value: /^\d{12}$/, message: '12-digit Aadhaar required' },
                  })}
                  maxLength={12}
                  className={inputCls(errors.aadhaar_number)}
                  placeholder="12-digit Aadhaar"
                />
              </Field>

              {/* Aadhaar proof */}
              <Field label="Aadhaar proof (image / PDF)" error={errors.aadhaar_proof?.message}>
                <input
                  {...register('aadhaar_proof', { required: 'Required' })}
                  type="file"
                  accept="image/*,application/pdf"
                  className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
                />
              </Field>

              {/* ── Seeker-only fields ── */}
              {tab === 'seeker' && (
                <>
                  <Field label="Driving license number" error={errors.driving_license_number?.message}>
                    <input
                      {...register('driving_license_number', { required: 'Required' })}
                      className={inputCls(errors.driving_license_number)}
                      placeholder="e.g. TN0120210012345"
                    />
                  </Field>

                  <Field label="License proof (image / PDF)" error={errors.license_proof?.message}>
                    <input
                      {...register('license_proof', { required: 'Required' })}
                      type="file"
                      accept="image/*,application/pdf"
                      className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Vehicle number" error={errors.vehicle_number?.message}>
                      <input
                        {...register('vehicle_number', { required: 'Required' })}
                        className={inputCls(errors.vehicle_number)}
                        placeholder="TN12AB1234"
                      />
                    </Field>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Vehicle type</label>
                      <select
                        {...register('vehicle_type', { required: 'Required' })}
                        className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
                      >
                        <option value="">Select…</option>
                        {VEHICLE_TYPES.map((v) => (
                          <option key={v} value={v}>{v.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── Owner-only fields ── */}
              {tab === 'owner' && (
                <>
                  <Field label="Property address" error={errors.property_address?.message}>
                    <input
                      {...register('property_address', { required: 'Required' })}
                      className={inputCls(errors.property_address)}
                      placeholder="Address of your parking space"
                    />
                  </Field>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Property type</label>
                    <select
                      {...register('property_type', { required: 'Required' })}
                      className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
                    >
                      <option value="">Select…</option>
                      {PROPERTY_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field label="Govt. ID proof (image / PDF)" error={errors.govt_id_proof?.message}>
                    <input
                      {...register('govt_id_proof', { required: 'Required' })}
                      type="file"
                      accept="image/*,application/pdf"
                      className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
                    />
                  </Field>
                </>
              )}

              {/* Profile photo (optional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Profile photo <span className="text-xs">(optional)</span>
                </label>
                <input
                  {...register('profile_photo')}
                  type="file"
                  accept="image/*"
                  className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:text-xs file:font-medium"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading && (
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper sub-components ─────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return `h-10 w-full rounded-md bg-background ring-1 ${
    error ? 'ring-destructive' : 'ring-border'
  } px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all`
}
```

---

## STEP 7 — Create the users API module

Create `frontend/src/api/users.js`:

```js
import api from './axios'

export const getMyNotifications  = ()  => api.get('/users/notifications')
export const markAllNotificationsRead = () => api.post('/users/notifications/mark-read')
export const uploadProfilePhoto  = (fd) => api.post('/users/profile-photo', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
```

---

## VERIFICATION CHECKLIST

Before marking Phase 3 complete:

- [ ] `npm run dev` starts without errors
- [ ] Visiting `/` shows either Home stub or your Home page
- [ ] Visiting `/login` shows the new login form with brand gradient decoration
- [ ] Visiting `/register` shows the seeker/owner tab switcher
- [ ] Logging in with `admin@parkingsystem.com` / `Admin@1234` redirects to `/admin`
- [ ] After login, visiting `/map` shows the Map stub wrapped inside the sidebar + topbar layout
- [ ] Sidebar collapses/expands on desktop
- [ ] On mobile (<1024px), sidebar is hidden and hamburger shows it as an overlay
- [ ] Dark mode toggle in the settings dropdown works
- [ ] Brand color picker in settings dropdown changes accent color
- [ ] Logging out from the sidebar redirects to `/login` and clears stored tokens
- [ ] OTP send button hits `POST /api/v1/auth/otp/send` (check Network tab)
- [ ] `localStorage` contains `parkease_access_token` after login
- [ ] `sessionStorage` contains `parkease_session_active` after login
