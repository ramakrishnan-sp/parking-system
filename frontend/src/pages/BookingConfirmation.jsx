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
        <div className="flex flex-col items-center mb-8">
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
