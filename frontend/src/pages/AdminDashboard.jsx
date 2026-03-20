import { useState, useEffect, Component } from 'react';
import { getAdminStats, listUsers, toggleUserActive, getPendingOwners, approveOwner, rejectOwner, getPendingParking, approveParking, removeParking, getAllBookings, getRevenueAnalytics, getBookingsByPurpose } from '@/api/admin';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassBadge } from '@/components/common/GlassBadge';
import { GlassButton } from '@/components/common/GlassButton';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/common/Skeleton';
import { Users, Car, CalendarCheck, IndianRupee, ShieldCheck, Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-sm text-white/50">
          Charts unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [pendingParking, setPendingParking] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [purposeData, setPurposeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedParking, setSelectedParking] = useState(null);
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [parkingToRemove, setParkingToRemove] = useState(null);
  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const safeString = (value, fallback = '') => (value == null ? fallback : String(value));
  const safeInitial = (value) => {
    const s = safeString(value, '?').trim();
    return (s.charAt(0) || '?').toUpperCase();
  };
  const safeFormatDate = (value, fmt = 'MMM d, yyyy') => {
    const s = safeString(value, '').trim();
    if (!s) return '—';
    try {
      return format(parseISO(s), fmt);
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, revRes, purpRes] = await Promise.all([
          getAdminStats(),
          getRevenueAnalytics(),
          getBookingsByPurpose()
        ]);
        setStats(statsRes.data);
        setRevenueData(revRes.data);
        setPurposeData(purpRes.data);
      } else if (activeTab === 'users') {
        const res = await listUsers();
        setUsers(res.data);
      } else if (activeTab === 'kyc') {
        const res = await getPendingOwners();
        setPendingOwners(res.data);
      } else if (activeTab === 'parking') {
        const res = await getPendingParking();
        setPendingParking(res.data);
      } else if (activeTab === 'bookings') {
        const res = await getAllBookings();
        setBookings(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await toggleUserActive(id);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleApproveOwner = async (id) => {
    try {
      await approveOwner(id);
      toast.success('Owner approved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve owner');
    }
  };

  const handleRejectOwner = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await rejectOwner(id, { reason });
      toast.success('Owner rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject owner');
    }
  };

  const handleApproveParking = async (id) => {
    try {
      await approveParking(id);
      toast.success('Parking space approved');
      setIsParkingModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to approve parking');
    }
  };

  const handleRemoveClick = (id) => {
    setParkingToRemove(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!parkingToRemove) return;
    try {
      await removeParking(parkingToRemove);
      toast.success('Parking space removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove parking');
    } finally {
      setConfirmModalOpen(false);
      setParkingToRemove(null);
    }
  };

  const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-white/60">Manage platform operations, users, and analytics.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/10 custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Users' },
          { id: 'parking', label: 'Parking' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'kyc', label: 'KYC Queue', badge: stats?.pending_owner_verifications || 0 }
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-brand-pink' : 'text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-pink shadow-[0_0_10px_rgba(236,72,153,0.5)]" />}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading || !stats ? (
                Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    icon={Users}
                    label="Total Users"
                    value={stats?.users?.total ?? 0}
                    sub={`${stats?.users?.seekers ?? 0} Seekers · ${stats?.users?.owners ?? 0} Owners`}
                    color="brand-purple"
                  />
                  <StatCard
                    icon={Car}
                    label="Parking Spaces"
                    value={stats?.parking?.total ?? 0}
                    sub={`${stats?.parking?.pending_approval ?? 0} Pending`}
                    color="brand-cyan"
                  />
                  <StatCard
                    icon={CalendarCheck}
                    label="Total Bookings"
                    value={stats?.bookings?.total ?? 0}
                    sub={`${stats?.bookings?.confirmed ?? 0} Confirmed`}
                    color="green-500"
                  />
                  <StatCard
                    icon={IndianRupee}
                    label="Platform Revenue"
                    value={`₹${stats?.revenue?.platform_commission ?? 0}`}
                    sub={`From ₹${stats?.revenue?.total_processed ?? 0} processed`}
                    color="brand-pink"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6 h-96 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-6">Monthly Revenue</h3>
                <div className="flex-1 min-h-0">
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={safeArray(revenueData)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                        <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(10,10,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartErrorBoundary>
                </div>
              </GlassCard>

              <GlassCard className="p-6 h-96 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-6">Bookings by Purpose</h3>
                <div className="flex-1 min-h-0">
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={safeArray(purposeData)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="purpose"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {safeArray(purposeData).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(10,10,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartErrorBoundary>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-white/60">
                  <tr>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-white/80">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : users?.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold">
                            {safeInitial(u.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{safeString(u.full_name, '—')}</p>
                            <p className="text-xs text-white/50">{safeString(u.email, '—')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><GlassBadge type={u.user_type} /></td>
                      <td className="p-4">{safeString(u.phone, '—')}</td>
                                            <td className="p-4 text-white/60">{safeFormatDate(u.created_at)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-white/60">{format(parseISO(u.created_at), 'MMM d, yyyy')}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleUser(u.id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)}
              </div>
            ) : pendingOwners?.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="KYC Queue Clear"
                message="There are no pending owner verifications at this time."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingOwners?.map(owner => (
                  <GlassCard key={owner.profile_id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{owner.full_name}</h3>
                        <h3 className="text-lg font-bold text-white">{safeString(owner.full_name, '—')}</h3>
                        <p className="text-sm text-white/60">{safeString(owner.email, '—')} • {safeString(owner.phone, '—')}</p>
                      </div>
                      <GlassBadge status="pending" />
                    </div>
                    
                    <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <p className="text-xs text-white/50 mb-1">Property Address</p>
                        <p className="text-sm text-white">{safeString(owner.property_address, '—')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">Property Type</p>
                        <p className="text-sm text-white capitalize">{safeString(owner.property_type, '—').replaceAll('_', ' ')}</p>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <a href={owner.govt_id_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-cyan hover:underline flex items-center">
                          <Eye className="w-3 h-3 mr-1" /> Govt ID
                        </a>
                        <a href={owner.aadhaar_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-purple hover:underline flex items-center">
                          <Eye className="w-3 h-3 mr-1" /> Aadhaar
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <GlassButton variant="danger" className="flex-1 py-2 text-sm" onClick={() => handleRejectOwner(owner.user_id)}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </GlassButton>
                      <GlassButton className="flex-1 py-2 text-sm bg-green-500 hover:bg-green-600" onClick={() => handleApproveOwner(owner.user_id)}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'parking' && (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-white/60">
                  <tr>
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Owner ID</th>
                    <th className="p-4 font-medium">Price/hr</th>
                    <th className="p-4 font-medium">Vehicles</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-white/80">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : pendingParking?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-white/50">No pending parking approvals.</td>
                    </tr>
                  ) : (
                    pendingParking?.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-medium text-white">{p.title} <span className="text-xs text-white/40 ml-2">({p.total_slots} slots)</span></td>
                        <td className="p-4 font-medium text-white">{safeString(p.title, '—')} <span className="text-xs text-white/40 ml-2">({safeString(p.total_slots, '0')} slots)</span></td>
                        <td className="p-4 font-mono text-xs text-white/60">{p.owner_id}</td>
                        <td className="p-4 text-brand-cyan font-medium">₹{p.price_per_hour}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <span className="text-[10px] uppercase bg-white/10 px-1.5 py-0.5 rounded">
                              {(p.vehicle_type_allowed || 'all').toString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedParking(p); setIsParkingModalOpen(true); }} className="p-1.5 bg-white/10 rounded hover:bg-white/20 text-white transition-colors" aria-label="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleApproveParking(p.id)} className="p-1.5 bg-green-500/20 rounded hover:bg-green-500/40 text-green-400 transition-colors" aria-label="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveClick(p.id)} className="p-1.5 bg-red-500/20 rounded hover:bg-red-500/40 text-red-400 transition-colors" aria-label="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-white/60">
                  <tr>
                    <th className="p-4 font-medium">Ref</th>
                    <th className="p-4 font-medium">Space ID</th>
                    <th className="p-4 font-medium">Duration</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-white/80">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : bookings?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-white/50">No bookings found.</td>
                    </tr>
                  ) : (
                    bookings?.map(b => (
                      <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-xs">{safeString(b.id, '').split('-')[0]?.toUpperCase() || '—'}</td>
                        <td className="p-4 font-mono text-xs text-white/60">{safeString(b.parking_id, '—')}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span>{safeFormatDate(b.start_time, 'MMM d, h:mm a')}</span>
                            <span className="text-xs text-white/40">{safeString(b.total_hours, '—')} hrs</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-green-400">₹{safeString(b.total_amount, '—')}</td>
                        <td className="p-4"><GlassBadge status={b.booking_status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={isParkingModalOpen} onOpenChange={setIsParkingModalOpen} title="Review Parking Space">
        {selectedParking && (
          <div className="space-y-4">
            {selectedParking.photos?.[0] && (
              <img src={selectedParking.photos[0].photo_url} alt="Parking" className="w-full h-48 object-cover rounded-xl border border-white/10" />
            )}
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{selectedParking.title}</h3>
              <p className="text-sm text-white/60">{selectedParking.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <div>
                <p className="text-xs text-white/50 mb-1">Price</p>
                <p className="text-sm font-medium text-white">₹{selectedParking.price_per_hour}/hr</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Slots</p>
                <p className="text-sm font-medium text-white">{selectedParking.total_slots}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-white/50 mb-1">Amenities</p>
                <p className="text-sm font-medium text-white">
                  {Array.isArray(selectedParking.amenities)
                    ? selectedParking.amenities.join(', ')
                    : safeString(selectedParking.amenities, '—')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <GlassButton variant="danger" className="flex-1" onClick={() => { setIsParkingModalOpen(false); handleRemoveClick(selectedParking.id); }}>Reject</GlassButton>
              <GlassButton className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handleApproveParking(selectedParking.id)}>Approve</GlassButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        onConfirm={handleConfirmRemove}
        title="Remove Parking Space"
        message="Are you sure you want to remove this space?"
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
