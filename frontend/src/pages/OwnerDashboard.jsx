import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getMyParkingSpaces, createParking, updateParking, deleteParking } from '@/api/parking';
import { getOwnerBookings } from '@/api/booking';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ParkingSpaceCard } from '@/components/owner/ParkingSpaceCard';
import { ParkingForm } from '@/components/owner/ParkingForm';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { GlassButton } from '@/components/common/GlassButton';
import { GlassBadge } from '@/components/common/GlassBadge';
import { StatCardSkeleton, ParkingCardSkeleton, TableRowSkeleton } from '@/components/common/Skeleton';
import { Car, CalendarCheck, IndianRupee, Star, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('spaces');
  
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState(null);

  useEffect(() => {
    fetchSpaces();
    fetchBookings();
  }, []);

  const fetchSpaces = async () => {
    setIsLoadingSpaces(true);
    try {
      const res = await getMyParkingSpaces();
      setSpaces(res.data);
    } catch (error) {
      toast.error('Failed to fetch parking spaces');
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await getOwnerBookings();
      setBookings(res.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleAddSpace = () => {
    setEditingSpace(null);
    setIsModalOpen(true);
  };

  const handleEditSpace = (space) => {
    setEditingSpace(space);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (space) => {
    setSpaceToDelete(space);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;
    try {
      await deleteParking(spaceToDelete.id);
      toast.success('Parking space deleted');
      fetchSpaces();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete space');
    } finally {
      setSpaceToDelete(null);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await updateParking(id, { is_active: isActive });
      toast.success(`Space ${isActive ? 'activated' : 'deactivated'}`);
      fetchSpaces();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleSubmitSpace = async (data) => {
    setIsSubmitting(true);
    try {
      const normalizeVehicleTypeAllowed = (selected) => {
        if (!Array.isArray(selected) || selected.length === 0) return 'all';
        const allowed = ['car', 'bike', 'ev'];
        const unique = Array.from(
          new Set(selected.map((v) => String(v).toLowerCase()))
        ).filter((v) => allowed.includes(v));

        if (unique.length >= 2) return 'all';
        return unique[0] || 'all';
      };

      const toCreateFormData = (values) => {
        const formData = new FormData();
        formData.append('title', values.title);
        if (values.description) formData.append('description', values.description);
        formData.append('price_per_hour', String(values.price_per_hour));
        formData.append('total_slots', String(values.total_slots ?? 1));
        formData.append('exact_latitude', String(values.exact_latitude));
        formData.append('exact_longitude', String(values.exact_longitude));
        formData.append('vehicle_type_allowed', normalizeVehicleTypeAllowed(values.vehicle_type_allowed));
        formData.append('amenities', '[]');
        formData.append('availability_schedule', '{}');
        return formData;
      };

      const toUpdatePayload = (values) => ({
        title: values.title,
        description: values.description,
        price_per_hour: values.price_per_hour,
        total_slots: values.total_slots,
        vehicle_type_allowed: normalizeVehicleTypeAllowed(values.vehicle_type_allowed),
      });

      if (editingSpace) {
        await updateParking(editingSpace.id, toUpdatePayload(data));
        toast.success('Parking space updated');
      } else {
        await createParking(toCreateFormData(data));
        toast.success('Parking space added successfully');
      }
      setIsModalOpen(false);
      fetchSpaces();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save space');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    spaces: spaces?.length || 0,
    activeBookings: bookings?.filter(b => b.booking_status === 'active').length || 0,
    earnings: bookings?.filter(b => b.booking_status === 'completed').reduce((acc, b) => acc + b.total_amount, 0) || 0,
    rating: spaces?.reduce((acc, s) => acc + (s.avg_rating || 0), 0) / (spaces?.filter(s => s.avg_rating).length || 1) || 0,
  };

  return (
    <div className="space-y-8">
      <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="text-white/60">You have {spaces?.length || 0} parking spaces listed.</p>
        </div>
        {activeTab === 'spaces' && (
          <GlassButton onClick={handleAddSpace} className="shrink-0">
            <Plus className="w-5 h-5 mr-2" /> Add Space
          </GlassButton>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingSpaces || isLoadingBookings ? (
          Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Car} label="Total Spaces" value={stats.spaces} color="brand-purple" />
            <StatCard icon={CalendarCheck} label="Active Bookings" value={stats.activeBookings} color="brand-cyan" />
            <StatCard icon={IndianRupee} label="Total Earnings" value={`₹${stats.earnings}`} color="green-500" />
            <StatCard icon={Star} label="Avg Rating" value={stats.rating.toFixed(1)} color="yellow-500" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'spaces' ? 'text-brand-purple' : 'text-white/60 hover:text-white'}`}
          onClick={() => setActiveTab('spaces')}
        >
          My Spaces
          {activeTab === 'spaces' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple shadow-[0_0_10px_rgba(124,58,237,0.5)]" />}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'bookings' ? 'text-brand-cyan' : 'text-white/60 hover:text-white'}`}
          onClick={() => setActiveTab('bookings')}
        >
          Incoming Bookings
          {(bookings?.filter(b => b.booking_status === 'pending')?.length || 0) > 0 && (
            <span className="bg-brand-pink text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {bookings?.filter(b => b.booking_status === 'pending')?.length || 0}
            </span>
          )}
          {activeTab === 'bookings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
        </button>
      </div>

      {/* Content */}
      <div className="pt-4">
        {activeTab === 'spaces' && (
          isLoadingSpaces ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => <ParkingCardSkeleton key={i} />)}
            </div>
          ) : spaces?.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No spaces listed yet"
              message="Add your first parking space to start earning."
              actionText="Add Space"
              onAction={handleAddSpace}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces?.map(space => (
                <ParkingSpaceCard
                  key={space.id}
                  space={space}
                  onEdit={handleEditSpace}
                  onDelete={handleDeleteClick}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )
        )}

        {activeTab === 'bookings' && (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-white/60">
                  <tr>
                    <th className="p-4 font-medium">Ref</th>
                    <th className="p-4 font-medium">Space</th>
                    <th className="p-4 font-medium">Seeker</th>
                    <th className="p-4 font-medium">Duration</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-white/80">
                  {isLoadingBookings ? (
                    Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : bookings?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-white/50">No incoming bookings yet.</td>
                    </tr>
                  ) : (
                    bookings?.map(booking => (
                      <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-xs">{booking.id.split('-')[0].toUpperCase()}</td>
                        <td className="p-4 font-medium text-white">{booking.parking_id}</td>
                        <td className="p-4">{booking.user_id}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span>{format(parseISO(booking.start_time), 'MMM d, h:mm a')}</span>
                            <span className="text-xs text-white/40">{booking.total_hours} hrs</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-green-400">₹{booking.total_amount}</td>
                        <td className="p-4"><GlassBadge status={booking.booking_status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title={editingSpace ? 'Edit Parking Space' : 'Add New Space'}>
        <ParkingForm
          initialData={editingSpace}
          onSubmit={handleSubmitSpace}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <ConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title="Delete Parking Space"
        message="Are you sure you want to delete this parking space? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
}
