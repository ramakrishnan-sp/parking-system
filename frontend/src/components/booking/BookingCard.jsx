import { useState } from 'react'
import {
  MapPin, Clock, Calendar, Car, Tag,
  CheckCircle, XCircle, Navigation, Star,
} from 'lucide-react'
import { format } from 'date-fns'
import { cancelBooking, submitReview } from '../../api/booking'
import { requestRefund } from '../../api/payment'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'

const STATUS_STYLES = {
  pending:   'badge-yellow',
  confirmed: 'badge-blue',
  active:    'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
}

export default function BookingCard({ booking, onUpdate }) {
  const [cancelling, setCancelling]   = useState(false)
  const [showReview, setShowReview]  = useState(false)
  const [rating, setRating]          = useState(5)
  const [comment, setComment]        = useState('')
  const [submitting, setSubmitting]  = useState(false)

  const canCancel  = ['pending', 'confirmed'].includes(booking.booking_status)
  const canReview  = booking.booking_status === 'completed'
  const isRevealed = booking.location_revealed

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(true)
    try {
      await cancelBooking(booking.id)
      toast.success('Booking cancelled')
      onUpdate?.()
    } catch {} finally { setCancelling(false) }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitReview(booking.id, rating, comment)
      toast.success('Review submitted!')
      setShowReview(false)
      onUpdate?.()
    } catch {} finally { setSubmitting(false) }
  }

  const openNavigation = () => {
    if (booking.exact_latitude && booking.exact_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`,
        '_blank',
      )
    }
  }

  return (
    <>
      <div className="card hover:shadow-float transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 font-mono">#{booking.id.slice(0, 8)}</p>
            <h4 className="font-semibold text-gray-900 leading-tight mt-0.5">
              {booking.parking_space?.title || 'Parking Space'}
            </h4>
          </div>
          <span className={STATUS_STYLES[booking.booking_status] || 'badge-gray'}>
            {booking.booking_status}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span>{format(new Date(booking.start_time), 'dd MMM, hh:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} className="text-gray-400" />
            <span>{format(new Date(booking.end_time), 'hh:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Tag size={14} className="text-gray-400" />
            <span className="capitalize">{booking.purpose?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Car size={14} className="text-gray-400" />
            <span>{booking.total_hours} hrs</span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold text-primary-700">₹{booking.total_amount}</span>
        </div>

        {/* Exact location (revealed after payment) */}
        {isRevealed && booking.exact_latitude && (
          <div className="mt-2 bg-green-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle size={16} />
              <span>Exact location unlocked</span>
            </div>
            <button
              onClick={openNavigation}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Navigation size={14} /> Navigate
            </button>
          </div>
        )}

        {/* Actions */}
        {(canCancel || canReview) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-danger flex-1 text-sm py-2"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
            {canReview && (
              <button
                onClick={() => setShowReview(true)}
                className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1"
              >
                <Star size={14} /> Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <form onSubmit={handleReview} className="space-y-4">
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star
                    size={28}
                    className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Share your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </Modal>
    </>
  )
}
