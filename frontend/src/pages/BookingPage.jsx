import { useState, useEffect } from 'react'
import { getMyBookings } from '../api/booking'
import BookingCard from '../components/booking/BookingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { CalendarCheck } from 'lucide-react'

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

  const loadBookings = async () => {
    setLoading(true)
    try {
      const res = await getMyBookings()
      setBookings(res.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadBookings() }, [])

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <CalendarCheck size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading bookings…" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} onRefresh={loadBookings} />
          ))}
        </div>
      )}
    </div>
  )
}
