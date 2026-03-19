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
  { value: '2,400+',  label: 'Parking spaces' },
  { value: '15,000+', label: 'Happy drivers' },
  { value: '₹12M+',   label: 'Total saved' },
  { value: '4.8★',    label: 'Average rating' },
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
