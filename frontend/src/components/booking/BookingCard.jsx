import { useState } from 'react'
import { Calendar, Clock, Tag, Car, Navigation, Star } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cancelBooking, submitReview } from '../../api/booking'
import Modal from '../common/Modal'
import StatusBadge from '../common/StatusBadge'

export default function BookingCard({ booking, onUpdate }) {
  const [cancelling, setCancelling] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating]         = useState(5)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canCancel = ['pending', 'confirmed'].includes(booking.booking_status)
  const canReview = booking.booking_status === 'completed' && !booking.review
  const isRevealed = booking.location_revealed

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return
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

  const openNav = () => {
    if (booking.exact_latitude && booking.exact_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`,
        '_blank'
      )
    }
  }

  return (
    <>
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5 hover:shadow-float transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">#{booking.id.slice(0, 8).toUpperCase()}</p>
            <h4 className="font-semibold text-foreground mt-0.5 leading-tight">
              {booking.parking_space?.title || 'Parking Space'}
            </h4>
          </div>
          <StatusBadge status={booking.booking_status} />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span className="truncate">{format(new Date(booking.start_time), 'dd MMM, h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span>{format(new Date(booking.end_time), 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span className="capitalize">{booking.purpose?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Car className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span>{booking.total_hours}h</span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Total amount</span>
          <span className="font-bold text-brand">₹{booking.total_amount}</span>
        </div>

        {/* Location revealed */}
        {isRevealed && booking.exact_latitude && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              📍 Exact location unlocked
            </p>
            <button
              onClick={openNav}
              className="flex items-center gap-1.5 text-sm font-medium text-brand hover:opacity-80"
            >
              <Navigation className="size-4" /> Navigate
            </button>
          </div>
        )}

        {/* Actions */}
        {(canCancel || canReview) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 h-9 rounded-lg border border-destructive text-destructive text-sm font-medium hover:bg-destructive/5 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
            {canReview && (
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 h-9 rounded-lg bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors"
              >
                <Star className="size-4" /> Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review">
        <form onSubmit={handleReview} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star className={`size-7 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comment (optional)</label>
            <textarea
              rows={3}
              className="w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50 resize-none"
              placeholder="Share your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </Modal>
    </>
  )
}
