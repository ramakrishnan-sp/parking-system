import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { GlassInput } from '../common/GlassInput';
import { GlassButton } from '../common/GlassButton';
import { BOOKING_PURPOSES } from '@/lib/constants';
import { differenceInMinutes, parseISO } from 'date-fns';
import { createBooking } from '@/api/booking';
import { createRazorpayOrder, verifyPayment } from '@/api/payment';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const BookingForm = ({ space, onClose }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ mode: 'onTouched' });
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const startTime = watch('start_time');
  const endTime = watch('end_time');

  useEffect(() => {
    if (startTime && endTime && space) {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      const mins = differenceInMinutes(end, start);
      if (mins > 0) {
        const hours = Math.ceil(mins / 60);
        setTotal(hours * space.price_per_hour);
      } else {
        setTotal(0);
      }
    }
  }, [startTime, endTime, space]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const onSubmit = async (data) => {
    if (total <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    setIsProcessing(true);
    try {
      const resLoaded = await loadRazorpay();
      if (!resLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 1. Create booking
      const bookingRes = await createBooking({
        parking_id: space.id,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        purpose: data.purpose,
      });
      const booking = bookingRes.data;

      // 2. Create order
      const orderRes = await createRazorpayOrder({ booking_id: booking.id });
      const order = orderRes.data;

      // 3. Open Razorpay
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkEase',
        description: `Booking for ${space.title}`,
        order_id: order.order_id,
        handler: async function (response) {
          try {
            await verifyPayment({
              booking_id: booking.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            navigate(`/seeker/booking/${booking.id}`);
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#7c3aed',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
        <h4 className="font-semibold text-white">{space.title}</h4>
        <p className="text-sm text-white/60">₹{space.price_per_hour}/hr</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassInput
          label="Start Time"
          type="datetime-local"
          {...register('start_time', { required: 'Required' })}
          error={errors.start_time?.message}
        />
        <GlassInput
          label="End Time"
          type="datetime-local"
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
          <option value="" className="bg-bg-secondary text-white">Select purpose</option>
          {Object.values(BOOKING_PURPOSES).map(p => (
            <option key={p} value={p} className="bg-bg-secondary text-white">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        {errors.purpose && <p className="mt-1.5 text-sm text-red-400">{errors.purpose.message}</p>}
      </div>

      <div className="flex justify-between items-center py-4 border-t border-white/10 mt-4">
        <span className="text-white/80 font-medium">Total Amount</span>
        <span className="text-2xl font-bold text-brand-cyan">₹{total}</span>
      </div>

      <div className="flex gap-3 pt-2">
        <GlassButton type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
        <GlassButton type="submit" disabled={total <= 0 || isProcessing} className="flex-1">
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Pay ₹${total}`}
        </GlassButton>
      </div>
    </form>
  );
};
