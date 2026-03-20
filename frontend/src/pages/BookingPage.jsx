import { useState, useEffect } from 'react';
import { getMyBookings, cancelBooking, submitReview } from '@/api/booking';
import { BookingCard } from '@/components/booking/BookingCard';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { BookingCardSkeleton, StatCardSkeleton } from '@/components/common/Skeleton';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { GlassButton } from '@/components/common/GlassButton';
import { CalendarCheck, IndianRupee, Clock, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { BOOKING_STATUS } from '@/lib/constants';

export default function BookingPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
    setConfirmModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    try {
      await cancelBooking(bookingToCancel.id, { cancellation_reason: 'User requested' });
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setBookingToCancel(null);
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    setIsSubmittingReview(true);
    try {
      await submitReview(selectedBooking.id, { booking_id: selectedBooking.id, rating, comment });
      toast.success('Review submitted successfully');
      setReviewModalOpen(false);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings?.filter(b => b.booking_status === filter) || [];

  const stats = {
    total: bookings?.length || 0,
    active: bookings?.filter(b => b.booking_status === BOOKING_STATUS.ACTIVE)?.length || 0,
    completed: bookings?.filter(b => b.booking_status === BOOKING_STATUS.COMPLETED)?.length || 0,
    spent: bookings?.filter(b => b.booking_status === BOOKING_STATUS.COMPLETED || b.booking_status === BOOKING_STATUS.ACTIVE)
                   ?.reduce((acc, b) => acc + b.total_amount, 0) || 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
        <p className="text-white/60">Manage your parking reservations and history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={CalendarCheck} label="Total Bookings" value={stats.total} color="brand-purple" />
            <StatCard icon={Clock} label="Active Now" value={stats.active} color="brand-cyan" />
            <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color="green-500" />
            <StatCard icon={IndianRupee} label="Total Spent" value={`₹${stats.spent}`} color="brand-pink" />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
        {['all', BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              filter === f 
                ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <BookingCardSkeleton key={i} />)}
        </div>
      ) : filteredBookings?.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings found"
          message={filter === 'all' ? "You haven't made any parking bookings yet." : `You have no ${filter} bookings.`}
          actionText="Find Parking"
          onAction={() => window.location.href = '/seeker/map'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings?.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onCancel={handleCancelClick}
              onReview={openReviewModal}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal open={reviewModalOpen} onOpenChange={setReviewModalOpen} title="Rate your experience">
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                <Star className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-[14px] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all min-h-[100px]"
              placeholder="How was the parking space?"
            />
          </div>
          <GlassButton onClick={handleReviewSubmit} isLoading={isSubmittingReview} className="w-full">
            Submit Review
          </GlassButton>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        onConfirm={handleConfirmCancel}
        confirmText="Yes, Cancel"
        isDestructive={true}
      />
    </div>
  );
}
