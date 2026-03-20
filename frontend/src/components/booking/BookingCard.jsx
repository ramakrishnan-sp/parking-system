import { GlassCard } from '../common/GlassCard';
import { GlassBadge } from '../common/GlassBadge';
import { GlassButton } from '../common/GlassButton';
import { format, parseISO } from 'date-fns';
import { MapPin, Navigation, Clock, Calendar, Star } from 'lucide-react';
import { BOOKING_STATUS } from '@/lib/constants';

export const BookingCard = ({ booking, onCancel, onReview }) => {
  const isPendingOrConfirmed = booking.booking_status === BOOKING_STATUS.PENDING || booking.booking_status === BOOKING_STATUS.CONFIRMED;
  const isCompleted = booking.booking_status === BOOKING_STATUS.COMPLETED;

  return (
    <GlassCard className="p-6 flex flex-col h-full hover">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-mono text-white/40 mb-1">REF: {booking.id.split('-')[0].toUpperCase()}</p>
          <h3 className="font-semibold text-lg text-white">{booking.parking_id}</h3>
        </div>
        <GlassBadge status={booking.booking_status} />
      </div>

      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center text-sm text-white/70">
          <Calendar className="w-4 h-4 mr-3 text-brand-purple" />
          <span>{format(parseISO(booking.start_time), 'MMM d, yyyy • h:mm a')}</span>
        </div>
        <div className="flex items-center text-sm text-white/70">
          <Clock className="w-4 h-4 mr-3 text-brand-pink" />
          <span>{booking.total_hours} hours ({booking.purpose})</span>
        </div>
        <div className="flex items-center text-sm text-white/70">
          <span className="w-4 h-4 mr-3 text-brand-cyan font-bold flex items-center justify-center">₹</span>
          <span className="font-semibold text-white">₹{booking.total_amount}</span>
          <GlassBadge status={booking.payment_status} className="ml-2 scale-75 origin-left" />
        </div>
      </div>

      {booking.location_revealed && booking.exact_latitude && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-300 mb-1">Location Revealed</p>
              <p className="text-xs text-green-200/70 mb-3">{booking.exact_latitude}, {booking.exact_longitude}</p>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.exact_latitude},${booking.exact_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
              >
                <Navigation className="w-3 h-3 mr-1" /> Navigate
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-auto pt-4 border-t border-white/10">
        {isPendingOrConfirmed && (
          <GlassButton variant="danger" className="w-full py-2 text-sm" onClick={() => onCancel(booking)}>
            Cancel Booking
          </GlassButton>
        )}
        {isCompleted && (
          <GlassButton variant="secondary" className="w-full py-2 text-sm" onClick={() => onReview(booking)}>
            <Star className="w-4 h-4 mr-2" /> Leave Review
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
};
