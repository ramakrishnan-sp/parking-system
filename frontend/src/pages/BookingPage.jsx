import { useState, useEffect, useCallback } from 'react'
import { CalendarCheck, ReceiptText, Clock, CheckCircle } from 'lucide-react'
import { getMyBookings } from '../api/booking'
import BookingCard from '../components/booking/BookingCard'
import EmptyState from '../components/common/EmptyState'
import { StatCardSkeleton, BookingCardSkeleton } from '../components/common/Skeleton'
import StatCard from '../components/common/StatCard'
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
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={CalendarCheck} label="Total Bookings" value={total}                     color="brand" />
          <StatCard icon={Clock}         label="Active"         value={active}                    color="green" />
          <StatCard icon={CheckCircle}   label="Completed"      value={completed}                 color="blue" />
          <StatCard icon={ReceiptText}   label="Total Spent"    value={`₹${spent.toFixed(0)}`}   color="yellow" />
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <BookingCardSkeleton key={i} />)}
        </div>
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
