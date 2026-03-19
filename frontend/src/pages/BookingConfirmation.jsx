import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Navigation, Calendar } from 'lucide-react'
import { getBookingById as getBooking } from '../api/booking'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format } from 'date-fns'

export default function BookingConfirmation() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBooking(id)
      .then((r) => setBooking(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner text="Loading confirmation…" />

  if (!booking) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">Booking not found.</p>
      <Link to="/bookings" className="btn-primary mt-4 inline-block">View my bookings</Link>
    </div>
  )

  const hasExactLocation = booking.exact_latitude && booking.exact_longitude
  const mapsUrl = hasExactLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center px-4">
      <div className="card max-w-lg w-full shadow-xl text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-8">Your parking space is reserved. The exact location has been unlocked.</p>

        {/* Details */}
        <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-8">
          <Detail label="Reference" value={`#${booking.id.slice(0, 8).toUpperCase()}`} />
          <Detail label="Parking"   value={booking.parking_space?.title} />
          <Detail label="From"      value={format(new Date(booking.start_time), 'EEE, dd MMM yyyy • h:mm a')} />
          <Detail label="To"        value={format(new Date(booking.end_time),   'EEE, dd MMM yyyy • h:mm a')} />
          <Detail label="Purpose"   value={booking.purpose || '—'} />
          <Detail label="Amount"    value={`₹${booking.total_price}`} bold />
          {hasExactLocation && (
            <>
              <Detail label="Lat" value={booking.exact_latitude} />
              <Detail label="Lng" value={booking.exact_longitude} />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {hasExactLocation && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Navigation size={16} /> Navigate
            </a>
          )}
          <Link to="/bookings" className="btn-outline flex-1 flex items-center justify-center gap-2">
            <Calendar size={16} /> My Bookings
          </Link>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, bold }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-bold text-primary-700' : 'font-medium text-gray-900'}>{value}</span>
    </div>
  )
}
