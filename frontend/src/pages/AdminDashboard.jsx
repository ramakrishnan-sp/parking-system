import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, Building2, CalendarCheck, ShieldCheck,
  TrendingUp, DollarSign, Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  getAdminStats, listUsers, getPendingOwners, getPendingParking,
  getAllBookings, getRevenueAnalytics, getBookingsByPurpose,
  toggleUserActive, approveOwner, rejectOwner, approveParking, removeParking,
} from '../api/admin'
import { StatCardSkeleton, TableRowSkeleton } from '../components/common/Skeleton'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import { cn } from '../lib/utils'

const TABS = [
  { key: 'overview',  label: 'Overview',   icon: LayoutDashboard },
  { key: 'users',     label: 'Users',      icon: Users },
  { key: 'parking',   label: 'Parking',    icon: Building2 },
  { key: 'bookings',  label: 'Bookings',   icon: CalendarCheck },
  { key: 'kyc',       label: 'KYC Queue',  icon: ShieldCheck },
]

const CHART_COLORS = ['#9333ea', '#2563eb', '#0d9488', '#ea580c', '#db2777']

export default function AdminDashboard() {
  const [tab, setTab]               = useState('overview')
  const [stats, setStats]           = useState(null)
  const [users, setUsers]           = useState([])
  const [pendingOwners, setPO]      = useState([])
  const [pendingParking, setPP]     = useState([])
  const [bookings, setBookings]     = useState([])
  const [revenue, setRevenue]       = useState([])
  const [purposeData, setPurpose]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [actionId, setActionId]     = useState(null)
  const [selectedParking, setSelectedParking] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, u, po, pp, bk, rv, pu] = await Promise.all([
        getAdminStats(),
        listUsers(),
        getPendingOwners(),
        getPendingParking(),
        getAllBookings(),
        getRevenueAnalytics(),
        getBookingsByPurpose(),
      ])
      setStats(s.data)
      setUsers(u.data)
      setPO(po.data)
      setPP(pp.data)
      setBookings(bk.data)
      setRevenue(rv.data)
      setPurpose(pu.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [])

  const handleToggleUser = async (id) => {
    setActionId(id)
    try { await toggleUserActive(id); toast.success('User status updated'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleApproveOwner = async (userId) => {
    setActionId(userId)
    try { await approveOwner(userId); toast.success('Owner approved'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleRejectOwner = async (userId) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    setActionId(userId)
    try { await rejectOwner(userId, reason); toast.success('Owner rejected'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleApproveParking = async (id) => {
    setActionId(id)
    try { await approveParking(id); toast.success('Parking approved'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const handleRemoveParking = async (id) => {
    if (!confirm('Remove this parking space?')) return
    setActionId(id)
    try { await removeParking(id); toast.success('Removed'); loadAll() }
    catch {} finally { setActionId(null) }
  }

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const thCls = 'text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide'
  const tdCls = 'px-4 py-3'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 pb-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              tab === key
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {label}
            {key === 'kyc' && pendingOwners.length > 0 && (
              <span className="ml-1 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingOwners.length}
              </span>
            )}
            {key === 'parking' && pendingParking.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingParking.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────── */}
      {tab === 'overview' && stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}         label="Total Users"       value={stats.users.total.toLocaleString()}                      sub={`${stats.users.seekers} seekers · ${stats.users.owners} owners`}         color="brand" />
            <StatCard icon={Building2}     label="Parking Spaces"    value={stats.parking.total.toLocaleString()}                    sub={`${stats.parking.pending_approval} pending approval`}                     color="blue" />
            <StatCard icon={CalendarCheck} label="Total Bookings"    value={stats.bookings.total.toLocaleString()}                   sub={`${stats.bookings.confirmed} confirmed`}                                  color="green" />
            <StatCard icon={DollarSign}    label="Platform Revenue"  value={`₹${stats.revenue.platform_commission.toLocaleString()}`} sub={`₹${stats.revenue.total_processed.toLocaleString()} total`}            color="yellow" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5">
              <h3 className="text-sm font-semibold mb-4">Monthly Revenue</h3>
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tickFormatter={(v) => format(new Date(v), 'MMM')} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={TrendingUp} title="No revenue data" message="Revenue chart will appear once payments are processed." />}
            </div>
            <div className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5">
              <h3 className="text-sm font-semibold mb-4">Bookings by Purpose</h3>
              {purposeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={purposeData} dataKey="count" nameKey="purpose" cx="50%" cy="50%" outerRadius={80} label={({ purpose }) => purpose?.replace('_', ' ')} labelLine={false}>
                      {purposeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={CalendarCheck} title="No booking data" message="Booking purpose breakdown will appear here." />}
            </div>
          </div>
        </div>
      ) : tab === 'overview' ? (
        /* Skeleton while stats haven't loaded */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : null}

      {/* ── USERS ────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="h-9 w-full rounded-lg bg-background ring-1 ring-border pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted"><tr>{['User', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                    : filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className={tdCls}>
                          <div className="flex items-center gap-3">
                            {u.profile_photo_url
                              ? <img src={u.profile_photo_url} alt="" className="size-8 rounded-full object-cover" />
                              : <div className="size-8 rounded-full bg-brand/20 grid place-items-center text-brand text-xs font-bold">{u.full_name?.[0]}</div>
                            }
                            <div>
                              <p className="font-medium">{u.full_name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={tdCls}><StatusBadge status={u.user_type} /></td>
                        <td className={cn(tdCls, 'text-muted-foreground text-xs')}>{u.phone}</td>
                        <td className={tdCls}><StatusBadge status={u.is_active ? 'approved' : 'cancelled'} /></td>
                        <td className={cn(tdCls, 'text-muted-foreground text-xs')}>{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                        <td className={tdCls}>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleToggleUser(u.id)} disabled={actionId === u.id}
                              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors',
                                u.is_active ? 'text-destructive hover:bg-destructive/10' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              )}>
                              {u.is_active ? 'Disable' : 'Enable'}
                            </button>
                            {u.user_type === 'owner' && u.owner_profile?.verification_status === 'pending' && (
                              <>
                                <button onClick={() => handleApproveOwner(u.id)} disabled={actionId === u.id} className="px-2.5 py-1 rounded text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Approve</button>
                                <button onClick={() => handleRejectOwner(u.id)} disabled={actionId === u.id} className="px-2.5 py-1 rounded text-xs font-medium text-destructive hover:bg-destructive/10">Reject</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              {!loading && filteredUsers.length === 0 && <EmptyState icon={Users} title="No users found" />}
            </div>
          </div>
        </div>
      )}

      {/* ── PARKING ──────────────────────────────────────────── */}
      {tab === 'parking' && (
        <div className="space-y-5">
          {pendingParking.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Pending Approval
                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full">{pendingParking.length}</span>
              </h2>
              <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted"><tr>{['Title', 'Owner', 'Price/hr', 'Vehicles', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-border">
                      {pendingParking.map((ps) => (
                        <tr key={ps.id} className="hover:bg-muted/30 transition-colors">
                          <td className={tdCls}><p className="font-medium">{ps.title}</p><p className="text-xs text-muted-foreground">{ps.total_slots} slots</p></td>
                          <td className={cn(tdCls, 'text-muted-foreground')}>{ps.owner?.full_name ?? '—'}</td>
                          <td className={cn(tdCls, 'font-medium text-brand')}>₹{ps.price_per_hour}</td>
                          <td className={tdCls}><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{ps.vehicle_type_allowed}</span></td>
                          <td className={tdCls}>
                            <div className="flex gap-1.5">
                              <button onClick={() => setSelectedParking(ps)} className="px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:bg-muted">View</button>
                              <button onClick={() => handleApproveParking(ps.id)} disabled={actionId === ps.id} className="px-2.5 py-1 rounded text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">Approve</button>
                              <button onClick={() => handleRemoveParking(ps.id)} disabled={actionId === ps.id} className="px-2.5 py-1 rounded text-xs font-medium text-destructive hover:bg-destructive/10">Remove</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Building2} title="No pending approvals" message="All parking spaces have been reviewed." />
          )}
        </div>
      )}

      {/* ── BOOKINGS ─────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted"><tr>{['Ref', 'Space', 'From', 'To', 'Amount', 'Status'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                  : bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className={cn(tdCls, 'font-mono text-xs')}>{b.id.slice(0,8).toUpperCase()}</td>
                      <td className={tdCls}>{b.parking_space?.title ?? '—'}</td>
                      <td className={cn(tdCls, 'text-xs text-muted-foreground')}>{format(new Date(b.start_time), 'dd MMM, h:mm a')}</td>
                      <td className={cn(tdCls, 'text-xs text-muted-foreground')}>{format(new Date(b.end_time), 'dd MMM, h:mm a')}</td>
                      <td className={cn(tdCls, 'font-medium text-brand')}>₹{b.total_amount}</td>
                      <td className={tdCls}><StatusBadge status={b.booking_status} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            {!loading && bookings.length === 0 && <EmptyState icon={CalendarCheck} title="No bookings" />}
          </div>
        </div>
      )}

      {/* ── KYC QUEUE ────────────────────────────────────────── */}
      {tab === 'kyc' && (
        pendingOwners.length === 0
          ? <EmptyState icon={ShieldCheck} title="No pending verifications" message="All owner KYC requests have been processed." />
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOwners.map((p) => (
                <div key={p.profile_id} className="rounded-2xl bg-card ring-1 ring-border shadow-card p-5 space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{p.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                      <p className="text-xs text-muted-foreground">{p.phone}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">Pending KYC</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p><span className="font-medium text-foreground">Property:</span> {p.property_address}</p>
                    <p><span className="font-medium text-foreground">Type:</span> {p.property_type}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {p.govt_id_proof_url && <a href={p.govt_id_proof_url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors">View Govt ID</a>}
                    {p.aadhaar_proof_url && <a href={p.aadhaar_proof_url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors">View Aadhaar</a>}
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <button onClick={() => handleApproveOwner(p.user_id)} disabled={actionId === p.user_id} className="flex-1 h-8 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">Approve</button>
                    <button onClick={() => handleRejectOwner(p.user_id)} disabled={actionId === p.user_id} className="flex-1 h-8 rounded-lg border border-destructive text-destructive text-xs font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Parking detail modal */}
      <Modal isOpen={!!selectedParking} onClose={() => setSelectedParking(null)} title="Parking Space Details" maxWidth="sm:max-w-xl">
        {selectedParking && (
          <div className="space-y-4">
            {selectedParking.photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedParking.photos.map((p) => (
                  <img key={p.id} src={p.photo_url} alt="" className="rounded-xl h-24 w-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                ))}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Title', selectedParking.title],
                ['Price/hr', `₹${selectedParking.price_per_hour}`],
                ['Slots', selectedParking.total_slots],
                ['Vehicle', selectedParking.vehicle_type_allowed],
                ['Property', selectedParking.property_type ?? '—'],
                ['Amenities', selectedParking.amenities?.join(', ') || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground mb-0.5">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <button onClick={() => { handleApproveParking(selectedParking.id); setSelectedParking(null) }} className="w-full h-10 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">Approve this space</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
