# PHASE 4 — Home Page + Common UI Components
# ParkEase Frontend Redesign
# ⚠️ Phases 1–3 must be complete before starting this phase.

---

## CONTEXT

You are continuing the ParkEase frontend rebuild. In this phase you will build:
1. The **Home** landing page (public, no sidebar)
2. All **reusable common UI components** needed across the app (StatCard, EmptyState, Modal wrapper, FileUpload)

---

## STEP 1 — Build the Home landing page

Replace `frontend/src/pages/Home.jsx`:

```jsx
import { Link } from 'react-router-dom'
import {
  MapPin, Shield, Clock, CreditCard,
  Star, Users, ArrowRight, Car,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Find Nearby Parking',
    desc: 'Instantly discover available private parking spaces within your preferred radius using live geolocation search.',
  },
  {
    icon: Shield,
    title: 'Privacy Protected',
    desc: 'Exact location is revealed only after payment. Masked coordinates are shown during search to protect owners.',
  },
  {
    icon: Clock,
    title: 'Flexible Booking',
    desc: 'Book by the hour for office, shopping, events, or long stays. Cancel anytime before your slot starts.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    desc: 'Razorpay-powered checkout with instant booking confirmation and hassle-free refunds when needed.',
  },
  {
    icon: Star,
    title: 'Verified Spaces',
    desc: 'Every space is admin-approved with owner KYC verification for your complete peace of mind.',
  },
  {
    icon: Users,
    title: 'Earn as an Owner',
    desc: 'Monetise your unused driveway, garage, or lot. Set your own price and availability schedule.',
  },
]

const STEPS = [
  { step: '01', title: 'Search',  desc: 'Enter your destination and see nearby available spaces on the map.' },
  { step: '02', title: 'Book',    desc: 'Choose a slot, select your time range, and pay securely online.' },
  { step: '03', title: 'Park',    desc: 'Receive the exact address after payment and navigate directly there.' },
]

const STATS = [
  { value: '2,400+', label: 'Parking spaces' },
  { value: '15,000+', label: 'Happy drivers' },
  { value: '₹12M+', label: 'Total saved' },
  { value: '4.8★', label: 'Average rating' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-brand grid place-items-center">
              <Car className="size-4 text-white" />
            </div>
            <span className="font-bold text-foreground">ParkEase</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sidebar-gradient text-white py-24 px-4">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6">
            <MapPin className="size-3.5" />
            Smart Peer-to-Peer Parking Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Park smarter.<br />
            Earn from your space.
          </h1>

          <p className="text-lg text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
            ParkEase connects drivers with private parking owners for affordable,
            flexible, and secure parking — right where you need it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand font-semibold text-sm hover:bg-white/90 shadow-lg transition-all"
            >
              Find Parking <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              List Your Space
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl bg-white/10 backdrop-blur px-4 py-5 text-center"
              >
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-white/75 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Everything you need
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for drivers and parking owners alike — with privacy, security, and simplicity at its core.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-card hover:shadow-float transition-shadow"
            >
              <div className="size-10 rounded-xl bg-brand/10 grid place-items-center mb-4">
                <Icon className="size-5 text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="bg-muted py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to your perfect parking spot.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative text-center">
                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-border" />
                )}
                <div className="size-12 rounded-full bg-brand text-white font-bold text-sm grid place-items-center mx-auto mb-4 relative z-10">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-3xl bg-sidebar-gradient text-white p-10 md:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative">
            Ready to get started?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto relative">
            Join thousands of drivers and space owners on ParkEase today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white text-brand font-semibold text-sm hover:bg-white/90 shadow-lg transition-all"
            >
              Create a free account
            </Link>
            <Link
              to="/login"
              className="text-white/80 text-sm font-medium hover:text-white transition-colors"
            >
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-brand grid place-items-center">
              <Car className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-foreground text-sm">ParkEase</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ParkEase. Smart P2P Parking Platform.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

---

## STEP 2 — Build the StatCard component

Create `frontend/src/components/common/StatCard.jsx`:

```jsx
import { cn } from '../../lib/utils'

const COLOR_MAP = {
  brand:  'bg-brand/10 text-brand',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray:   'bg-muted text-muted-foreground',
}

/**
 * KPI stat card used on dashboards.
 *
 * Props:
 *   icon     — Lucide icon component
 *   label    — e.g. "Total Bookings"
 *   value    — e.g. "1,234" or "₹45,200"
 *   sub      — optional sub-label e.g. "₹12,000 this month"
 *   color    — 'brand' | 'green' | 'red' | 'yellow' | 'blue' | 'gray'
 *   loading  — show skeleton if true
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'brand',
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card hover:shadow-float transition-shadow">
      <div className="flex items-center gap-4">
        <div className={cn('size-12 rounded-2xl flex items-center justify-center shrink-0', COLOR_MAP[color])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/75 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
```

---

## STEP 3 — Build the EmptyState component

Create `frontend/src/components/common/EmptyState.jsx`:

```jsx
import { cn } from '../../lib/utils'

/**
 * Reusable empty state.
 *
 * Props:
 *   icon     — Lucide icon component
 *   title    — heading text
 *   message  — description text
 *   action   — optional { label: string, onClick: fn } or { label: string, href: string }
 */
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {Icon && <Icon className="size-7 text-muted-foreground/60" />}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{message}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## STEP 4 — Build the Modal wrapper component

Create `frontend/src/components/common/Modal.jsx`:

```jsx
import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

/**
 * Thin wrapper around shadcn Dialog for consistent modal styling.
 *
 * Props:
 *   isOpen    — boolean
 *   onClose   — function
 *   title     — string (optional)
 *   maxWidth  — tailwind max-width class e.g. 'max-w-lg' (default)
 *   children
 */
export default function Modal({ isOpen, onClose, title, maxWidth = 'sm:max-w-lg', children }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={maxWidth}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

---

## STEP 5 — Build the FileUpload component

Create `frontend/src/components/common/FileUpload.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Drag-and-drop or click file upload with image preview.
 *
 * Props:
 *   label       — string
 *   accept      — MIME type string e.g. 'image/*,application/pdf'
 *   required    — boolean
 *   onChange    — (File | null) => void
 *   error       — string
 *   helpText    — string
 */
export default function FileUpload({
  label,
  accept = 'image/*',
  required = false,
  onChange,
  error,
  helpText = 'JPG, PNG or PDF up to 10MB',
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
    onChange?.(file)
  }

  const handleChange = (e) => handleFile(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange?.(null)
  }

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors',
          dragging
            ? 'border-brand bg-brand/5'
            : error
            ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-brand/50 bg-muted/50 hover:bg-brand/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          required={required}
        />

        {fileName ? (
          <div className="flex items-center gap-3">
            {preview ? (
              <img src={preview} alt="preview" className="size-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="size-14 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="size-6 text-brand" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-brand">
                {dragging ? 'Drop here' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{helpText}</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
```

---

## STEP 6 — Build the Badge component helper

Create `frontend/src/components/common/StatusBadge.jsx` for reusable status indicators:

```jsx
import { cn } from '../../lib/utils'

const VARIANTS = {
  // Booking statuses
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Approval
  approved:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Payments
  paid:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  refunded:  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  failed:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Roles
  seeker:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  owner:     'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  admin:     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function StatusBadge({ status, className }) {
  const variant = VARIANTS[status?.toLowerCase()] ?? VARIANTS.completed
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        variant,
        className
      )}
    >
      {status?.replace('_', ' ')}
    </span>
  )
}
```

---

## VERIFICATION CHECKLIST

Before marking Phase 4 complete:

- [ ] Visiting `/` shows the full landing page with hero, features, how-it-works, stats, and CTA sections
- [ ] Hero section shows brand gradient background
- [ ] "Get started" and "Find Parking" buttons navigate to `/register`
- [ ] Dark mode renders the landing page correctly (no hardcoded whites/grays)
- [ ] `StatCard` renders with loading skeleton when `loading={true}`
- [ ] `EmptyState` renders icon, title, message, and optional action button
- [ ] `Modal` opens and closes using the shadcn Dialog component
- [ ] `FileUpload` shows drag-and-drop UI, preview on image select, PDF icon for PDFs, clear button
- [ ] `StatusBadge` shows correct colors for 'pending', 'confirmed', 'cancelled', 'approved', etc.
- [ ] All components use `cn()` from `src/lib/utils.js` for conditional classNames
- [ ] No hardcoded color values anywhere — only CSS variables via Tailwind tokens
