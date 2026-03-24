import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookingById } from '@/api/booking';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassButton } from '@/components/common/GlassButton';
import { CheckCircle, MapPin, Navigation, Calendar, Clock, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FullPageLoader } from '@/components/common/LoadingSpinner';

export default function BookingConfirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await getBookingById(id);
        setBooking(res.data);
      } catch (error) {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (isLoading) return <FullPageLoader />;
  if (!booking) return <div className="text-center text-white mt-20">Booking not found</div>;

  const title = booking.parking_space?.title || booking.parking_space?.name || booking.parking_id || 'Parking Space';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-white/60">Your parking space has been successfully reserved.</p>
        </div>

        <GlassCard className="p-6 space-y-4 mb-8">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <span className="text-white/60 text-sm">Reference ID</span>
            <span className="font-mono text-white font-medium">{booking.id.split('-')[0].toUpperCase()}</span>
          </div>
          
          <div className="flex items-start gap-3 py-2">
            <MapPin className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/60 mb-1">Parking Space</p>
              <p className="font-medium text-white">{title}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <Calendar className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/60 mb-1">Date & Time</p>
              <p className="font-medium text-white">
                {format(parseISO(booking.start_time), 'MMM d, h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <Clock className="w-5 h-5 text-brand-pink shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/60 mb-1">Duration</p>
              <p className="font-medium text-white">{booking.total_hours} hours</p>
            </div>
          </div>

          {booking.purpose && (
            <div className="flex items-start gap-3 py-2">
              <div className="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center text-brand-cyan font-bold">•</div>
              <div>
                <p className="text-sm text-white/60 mb-1">Purpose</p>
                <p className="font-medium text-white">{String(booking.purpose).replace('_', ' ')}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 py-2 border-t border-white/10 pt-4">
            <CreditCard className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div className="flex-1 flex justify-between items-center">
              <p className="font-medium text-white">Total Paid</p>
              <p className="font-bold text-xl text-green-400">₹{booking.total_amount}</p>
            </div>
          </div>
        </GlassCard>

        {booking.location_revealed && booking.exact_latitude && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 mb-8 text-center">
            <p className="text-sm font-medium text-green-300 mb-2">📍 Exact location revealed</p>
            <p className="text-xs text-green-200/70 mb-4">{booking.exact_latitude}, {booking.exact_longitude}</p>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full"
            >
              <GlassButton className="w-full bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <Navigation className="w-4 h-4 mr-2" /> Open in Maps
              </GlassButton>
            </a>
          </div>
        )}

        <div className="flex justify-center">
          <Link to="/seeker/bookings" className="w-full">
            <GlassButton variant="ghost" className="w-full border border-white/20">
              View My Bookings
            </GlassButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
