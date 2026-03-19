import { useState, useEffect, useCallback } from 'react'
import { Building2, PlusCircle, CalendarCheck, Star, DollarSign } from 'lucide-react'
import { getMyParkingSpaces } from '../api/parking'
import { getOwnerBookings } from '../api/booking'
import ParkingSpaceCard from '../components/owner/ParkingSpaceCard'
import ParkingForm from '../components/owner/ParkingForm'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ParkingCardSkeleton, TableRowSkeleton, StatCardSkeleton } from '../components/common/Skeleton'
import Modal from '../components/common/Modal'
import StatusBadge from '../components/common/StatusBadge'
import { cn } from '../lib/utils'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'

const TABS = ['My Spaces', 'Incoming Bookings']

export default function OwnerDashboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('My Spaces')
  const [spaces, setSpaces]     = useState([])
  const [bookings, setBookings]  = useState([])
  const [loading, setLoading]    = useState(true)
  const [showForm, setShowForm]  = useState(false)
  const [editing, setEditing]    = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([getMyParkingSpaces(), getOwnerBookings()])
      setSpaces(s.data)
      setBookings(b.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [])

  const totalSpaces    = spaces.length
  const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.booking_status)).length
  const totalEarnings  = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((s, b) => s + parseFloat(b.owner_payout || 0), 0)
  const avgRating = spaces.length
    ? (spaces.reduce((s, sp) => s + parseFloat(sp.avg_rating || 0), 0) / spaces.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-sidebar-gradient p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-2xl font-semibold">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-white/80 text-sm mt-1">
          Managing {totalSpaces} parking space{totalSpaces !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2}     label="Total Spaces"    value={totalSpaces}                     color="brand" />
          <StatCard icon={CalendarCheck} label="Active Bookings" value={activeBookings}                  color="green" />
          <StatCard icon={DollarSign}    label="Total Earnings"  value={`₹${totalEarnings.toFixed(0)}`} color="yellow" />
          <StatCard icon={Star}          label="Avg Rating"      value={avgRating}                       color="blue" />
        </div>
      )}

      {/* Tabs header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 pb-2 text-sm font-medium border-b-2 transition-colors',
                tab === t
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
              {t === 'Incoming Bookings' && activeBookings > 0 && (
                <span className="ml-1.5 bg-brand text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeBookings}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'My Spaces' && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="size-4" /> Add Space
          </button>
        )}
      </div>

      {/* Content — My Spaces */}
      {tab === 'My Spaces' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <ParkingCardSkeleton key={i} />)}
          </div>
        ) : spaces.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No parking spaces yet"
            message="Add your first parking space and start earning."
            action={{ label: 'Add Space', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((ps) => (
              <ParkingSpaceCard
                key={ps.id}
                space={ps}
                onEdit={(ps) => { setEditing(ps); setShowForm(true) }}
                onRefresh={loadAll}
              />
            ))}
          </div>
        )
      )}

      {/* Content — Incoming Bookings */}
      {tab === 'Incoming Bookings' && (
        loading ? (
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
            <table className="w-full"><tbody>
              {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
            </tbody></table>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings yet" message="Bookings for your spaces will appear here." />
        ) : (
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    {['Ref', 'Space', 'Seeker', 'From', 'To', 'Amount', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{b.id.slice(0,8).toUpperCase()}</td>
                      <td className="px-4 py-3 font-medium truncate max-w-36">{b.parking_space?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.user?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(b.start_time), 'dd MMM, h:mm a')}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(b.end_time), 'dd MMM, h:mm a')}</td>
                      <td className="px-4 py-3 font-medium text-brand">₹{b.total_amount}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.booking_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Parking Space' : 'Add New Parking Space'}
        maxWidth="sm:max-w-2xl"
      >
        <ParkingForm
          initialData={editing}
          onSuccess={() => { setShowForm(false); loadAll() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
