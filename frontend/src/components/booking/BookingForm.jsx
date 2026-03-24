import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { GlassInput } from '../common/GlassInput';
import { GlassButton } from '../common/GlassButton';
import { BOOKING_PURPOSES } from '@/lib/constants';
import { createBooking } from '@/api/booking';
import { createRazorpayOrder, verifyPayment } from '@/api/payment';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2 } from 'lucide-react';

function calcHours(start, end) {
  if (!start || !end) return 0;
  const diff = (new Date(end) - new Date(start)) / 3600000;
  return diff > 0 ? diff : 0;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const BookingForm = ({ space, onSuccess, onCancel, onClose }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { purpose: Object.values(BOOKING_PURPOSES)[0] || 'other' },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const startTime = watch('start_time');
  const endTime = watch('end_time');
  const hours = useMemo(() => calcHours(startTime, endTime), [startTime, endTime]);
  const total = useMemo(() => {
    const rate = parseFloat(space?.price_per_hour) || 0;
    return hours > 0 ? hours * rate : 0;
  }, [hours, space?.price_per_hour]);

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const close = () => (onCancel || onClose)?.();

  const onSubmit = async (data) => {
    if (!space?.id) {
      toast.error('No parking space selected');
      return;
    }
    if (hours <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    setIsProcessing(true);
    try {
      // 1) Create booking
      const { data: booking } = await createBooking({
        parking_id: space.id,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        purpose: data.purpose,
      });

      // 2) Create Razorpay order
      const { data: order } = await createRazorpayOrder(booking.id);

      // 3) Load Razorpay checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load payment gateway. Check your internet connection.');
        setIsProcessing(false);
        return;
      }

      const themeColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--brand-purple')
          .trim() || '#7c3aed';

      // 4) Open checkout
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'ParkEase',
        description: `Booking: ${space.title}`,
        order_id: order.order_id,
        theme: { color: themeColor },
        handler: async (response) => {
          try {
            await verifyPayment(
              booking.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            toast.success('Booking confirmed!');
            onSuccess?.(booking);
            if (!onSuccess) {
              navigate(`/seeker/booking/${booking.id}`);
            }
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      });

      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
        <h4 className="font-semibold text-white">{space?.title}</h4>
        <p className="text-sm text-white/60">₹{space?.price_per_hour}/hr</p>
        <p className="text-xs text-white/40 mt-1">{space?.available_slots} slot(s) available</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassInput
          label="Start Time"
          type="datetime-local"
          min={minDateTime}
          {...register('start_time', { required: 'Required' })}
          error={errors.start_time?.message}
        />
        <GlassInput
          label="End Time"
          type="datetime-local"
          min={startTime || minDateTime}
          {...register('end_time', { required: 'Required' })}
          error={errors.end_time?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">Purpose</label>
        <select
          {...register('purpose', { required: 'Required' })}
          className="w-full bg-white/5 border border-white/15 rounded-[14px] px-4 py-3 text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
        >
          {Object.values(BOOKING_PURPOSES).map((p) => (
            <option key={p} value={p} className="bg-bg-secondary text-white">
              {p.replace('_', ' ').charAt(0).toUpperCase() + p.replace('_', ' ').slice(1)}
            </option>
          ))}
        </select>
        {errors.purpose && <p className="mt-1.5 text-sm text-red-400">{errors.purpose.message}</p>}
      </div>

      {hours > 0 && (
        <div className="flex justify-between items-center py-4 border-t border-white/10">
          <div>
            <p className="text-xs text-white/50">Duration</p>
            <p className="text-sm font-medium text-white">{hours.toFixed(1)} hours</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">Total</p>
            <p className="text-2xl font-bold text-brand-cyan">₹{total.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <GlassButton type="button" variant="ghost" onClick={close} className="flex-1" disabled={isProcessing}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" disabled={hours <= 0 || isProcessing} className="flex-1">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            <span className="inline-flex items-center justify-center">
              <CreditCard className="w-4 h-4 mr-2" /> Pay ₹{total.toFixed(2)}
            </span>
          )}
        </GlassButton>
      </div>
    </form>
  );
};
