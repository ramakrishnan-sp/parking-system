import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Calendar, Clock, Tag, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBooking } from '../../api/booking'
import { createRazorpayOrder, verifyPayment } from '../../api/payment'

const PURPOSES = [
  { value: 'office',            label: 'Office' },
  { value: 'shopping',          label: 'Shopping' },
  { value: 'event',             label: 'Event' },
  { value: 'residential_visit', label: 'Residential Visit' },
  { value: 'short_stay',        label: 'Short Stay' },
  { value: 'long_stay',         label: 'Long Stay' },
  { value: 'other',             label: 'Other' },
]

function calcHours(start, end) {
  if (!start || !end) return 0
  const diff = (new Date(end) - new Date(start)) / 3600000
  return diff > 0 ? diff : 0
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BookingForm({ space, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { purpose: 'office' },
  })

  const startTime = watch('start_time')
  const endTime   = watch('end_time')
  const hours     = calcHours(startTime, endTime)
  const total     = (hours * (space?.price_per_hour || 0)).toFixed(2)

  const onSubmit = async (data) => {
    if (hours <= 0) {
      toast.error('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      // 1. Create booking
      const { data: booking } = await createBooking({
        parking_id: space.id,
        start_time: new Date(data.start_time).toISOString(),
        end_time:   new Date(data.end_time).toISOString(),
        purpose:    data.purpose,
      })

      // 2. Create Razorpay order on backend
      const { data: order } = await createRazorpayOrder(booking.id)

      // 3. Load Razorpay checkout script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Could not load payment gateway. Check your internet connection.')
        setLoading(false)
        return
      }

      // 4. Open Razorpay checkout popup
      const rzp = new window.Razorpay({
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'ParkEase',
        description: `Booking: ${space.title}`,
        order_id:    order.order_id,
        prefill: {},
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            // 5. Verify signature on backend → confirms booking
            await verifyPayment(
              booking.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            )
            toast.success('Booking confirmed! 🎉')
            onSuccess?.(booking)
          } catch {
            // axios interceptor shows error toast
          }
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

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDateTime = now.toISOString().slice(0, 16)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Parking summary */}
      <div className="bg-primary-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900">{space?.title}</h4>
        <p className="text-sm text-primary-700 font-medium">₹{space?.price_per_hour}/hr</p>
      </div>

      {/* Start time */}
      <div>
        <label className="label">
          <Calendar size={14} className="inline mr-1" /> Start Time
        </label>
        <input
          type="datetime-local"
          min={minDateTime}
          className={`input ${errors.start_time ? 'input-error' : ''}`}
          {...register('start_time', { required: 'Start time is required' })}
        />
        {errors.start_time && (
          <p className="text-xs text-red-500 mt-1">{errors.start_time.message}</p>
        )}
      </div>

      {/* End time */}
      <div>
        <label className="label">
          <Clock size={14} className="inline mr-1" /> End Time
        </label>
        <input
          type="datetime-local"
          min={startTime || minDateTime}
          className={`input ${errors.end_time ? 'input-error' : ''}`}
          {...register('end_time', { required: 'End time is required' })}
        />
        {errors.end_time && (
          <p className="text-xs text-red-500 mt-1">{errors.end_time.message}</p>
        )}
      </div>

      {/* Purpose */}
      <div>
        <label className="label">
          <Tag size={14} className="inline mr-1" /> Purpose of Parking
        </label>
        <select className="input" {...register('purpose', { required: true })}>
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Amount preview */}
      {hours > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-medium">{hours.toFixed(1)} hours</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-primary-700">₹{total}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || hours <= 0}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <CreditCard size={15} />
          )}
          {loading ? 'Processing…' : `Pay ₹${total}`}
        </button>
      </div>
    </form>
  )
}
