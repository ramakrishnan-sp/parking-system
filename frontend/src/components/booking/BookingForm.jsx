import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Calendar, Clock, Tag, CreditCard, Car } from 'lucide-react'
import { toast } from 'sonner'
import { createBooking } from '../../api/booking'
import { createRazorpayOrder, verifyPayment } from '../../api/payment'
import { BOOKING_PURPOSES, RAZORPAY_SCRIPT_URL } from '../../lib/constants'

function calcHours(start, end) {
  if (!start || !end) return 0
  const diff = (new Date(end) - new Date(start)) / 3600000
  return diff > 0 ? diff : 0
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = RAZORPAY_SCRIPT_URL
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function BookingForm({ space, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: { purpose: 'office' } })

  const startTime = watch('start_time')
  const endTime   = watch('end_time')
  const hours     = calcHours(startTime, endTime)
  const total     = (hours * (parseFloat(space?.price_per_hour) || 0)).toFixed(2)

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDateTime = now.toISOString().slice(0, 16)

  // ── Edge case: 0 available slots ──────────────────────────
  if (space?.available_slots === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="size-12 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
          <Car className="size-6 text-destructive" />
        </div>
        <p className="font-semibold text-foreground">No slots available</p>
        <p className="text-sm text-muted-foreground">This space is currently full. Try again later.</p>
        <button
          onClick={onCancel}
          className="h-9 px-5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to map
        </button>
      </div>
    )
  }

  const onSubmit = async (data) => {
    if (hours <= 0) { toast.error('End time must be after start time'); return }

    setLoading(true)
    try {
      // 1. Create booking
      const { data: booking } = await createBooking({
        parking_id: space.id,
        start_time: new Date(data.start_time).toISOString(),
        end_time:   new Date(data.end_time).toISOString(),
        purpose:    data.purpose,
      })

      // 2. Create Razorpay order
      const { data: order } = await createRazorpayOrder(booking.id)

      // 3. Load Razorpay checkout JS
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Could not load payment gateway. Check your internet connection.')
        setLoading(false)
        return
      }

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'ParkEase',
        description: `Booking: ${space.title}`,
        order_id:    order.order_id,
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#9333ea' },
        handler: async (response) => {
          try {
            await verifyPayment(
              booking.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            )
            toast.success('Booking confirmed! 🎉')
            onSuccess?.(booking)
          } catch {}
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
    } catch {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Space summary */}
      <div className="rounded-xl bg-brand/10 p-4">
        <h4 className="font-semibold text-foreground">{space?.title}</h4>
        <p className="text-sm text-brand font-medium">₹{space?.price_per_hour}/hr</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {space?.available_slots} slot(s) available
        </p>
      </div>

      {/* Start time */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" /> Start time
        </label>
        <input
          type="datetime-local"
          min={minDateTime}
          className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          {...register('start_time', {
            required: 'Start time is required',
            validate: (v) => {
              const diff = new Date(v) - new Date()
              if (diff < 0) return 'Start time cannot be in the past'
              if (diff < 5 * 60 * 1000) return 'Start time must be at least 5 minutes from now'
              return true
            },
          })}
        />
        {errors.start_time && <p className="text-xs text-destructive">{errors.start_time.message}</p>}
      </div>

      {/* End time */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" /> End time
        </label>
        <input
          type="datetime-local"
          min={startTime || minDateTime}
          className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          {...register('end_time', {
            required: 'End time is required',
            validate: (v, form) => {
              if (!form.start_time) return true
              const hrs = (new Date(v) - new Date(form.start_time)) / 3600000
              if (hrs <= 0)   return 'End time must be after start time'
              if (hrs < 0.5)  return 'Minimum booking duration is 30 minutes'
              if (hrs > 72)   return 'Maximum booking duration is 72 hours'
              return true
            },
          })}
        />
        {errors.end_time && <p className="text-xs text-destructive">{errors.end_time.message}</p>}
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Tag className="size-3.5 text-muted-foreground" /> Purpose
        </label>
        <select
          className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
          {...register('purpose', { required: true })}
        >
          {BOOKING_PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Amount preview */}
      {hours > 0 && (
        <div className="rounded-xl bg-muted p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{hours.toFixed(1)} hours</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-brand">₹{total}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || hours <= 0}
          className="flex-1 h-10 rounded-xl bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading
            ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <CreditCard className="size-4" />
          }
          {loading ? 'Processing…' : `Pay ₹${total}`}
        </button>
      </div>
    </form>
  )
}
