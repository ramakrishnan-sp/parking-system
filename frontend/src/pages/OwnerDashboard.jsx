import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyParkingSpaces as getMySpaces, deleteParking, toggleParkingAvailability } from '../api/parking'
import ParkingForm from '../components/owner/ParkingForm'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getOwnerBookings as getOwnerIncomingBookings } from '../api/booking'
import BookingCard from '../components/booking/BookingCard'
import { format } from 'date-fns'

const TABS = ['My Spaces', 'Incoming Bookings']

export default function OwnerDashboard() {
  const [tab, setTab] = useState('My Spaces')
  const [spaces, setSpaces] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([getMySpaces(), getOwnerIncomingBookings()])
      setSpaces(s.data)
      setBookings(b.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parking space?')) return
    try { await deleteParking(id); toast.success('Deleted'); loadData() } catch {}
  }

  const handleToggle = async (id) => {
    try { await toggleParkingAvailability(id); loadData() } catch {}
  }

  const statusBadge = (s) => {
    const cls = s === 'approved' ? 'badge-green' : s === 'pending' ? 'badge-yellow' : 'badge-red'
    return <span className={cls}>{s}</span>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        </div>
        {tab === 'My Spaces' && (
          <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} /> Add Space
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
            {t === 'Incoming Bookings' && bookings.filter(b => b.status === 'confirmed').length > 0 && (
              <span className="ml-1.5 bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {bookings.filter(b => b.status === 'confirmed').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading…" />
      ) : tab === 'My Spaces' ? (
        spaces.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="mb-4">No parking spaces yet</p>
            <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary">Add your first space</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {spaces.map((ps) => (
              <div key={ps.id} className="card">
                {ps.photos?.[0] && (
                  <img src={ps.photos[0].photo_url} alt="" className="w-full h-36 object-cover rounded-xl mb-4 -mx-0" />
                )}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ps.title}</h3>
                    <p className="text-sm text-gray-500">₹{ps.price_per_hour}/hr • {ps.total_slots} slots</p>
                  </div>
                  {statusBadge(ps.status)}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{ps.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(ps.id)} className="text-gray-400 hover:text-primary-600 transition-colors">
                      {ps.is_available ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                    </button>
                    <span className="text-xs text-gray-500">{ps.is_available ? 'Open' : 'Closed'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(ps); setShowForm(true) }} className="btn-ghost text-xs py-1 px-2">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(ps.id)} className="btn-ghost text-xs py-1 px-2 text-red-500 hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No incoming bookings</div>
          ) : (
            bookings.map((b) => <BookingCard key={b.id} booking={b} onRefresh={loadData} ownerView />)
          )}
        </div>
      )}

      {/* Add/Edit Parking Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Parking Space' : 'Add Parking Space'}
        maxWidth="max-w-2xl"
      >
        <ParkingForm
          initial={editing}
          onSuccess={() => { setShowForm(false); loadData() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
