import { useState, useEffect } from 'react'
import { Users, Building2, CalendarCheck, BadgeDollarSign, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getAdminStats,
  listUsers as getAllUsers,
  getPendingOwners,
  getPendingParking,
  getAllBookings as getAdminAllBookings,
  getRevenueAnalytics
} from '../api/admin'
import AdminStats from '../components/admin/AdminStats'
import UserTable from '../components/admin/UserTable'
import ParkingTable from '../components/admin/ParkingTable'
import LoadingSpinner from '../components/common/LoadingSpinner'

const TABS = [
  { key: 'overview',  label: 'Overview',  icon: BadgeDollarSign },
  { key: 'users',     label: 'Users',     icon: Users },
  { key: 'parking',   label: 'Parking',   icon: Building2 },
  { key: 'bookings',  label: 'Bookings',  icon: CalendarCheck },
  { key: 'kyc',       label: 'KYC Queue', icon: ShieldCheck },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [parking, setParking] = useState([])
  const [pendingOwners, setPendingOwners] = useState([])
  const [pendingParking, setPendingParking] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, u, pk, po, pp, bk] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAdminAllBookings(),
        getPendingOwners(),
        getPendingParking(),
        getAdminAllBookings(),
      ])
      setStats(s.data)
      setUsers(u.data)
      setBookings(bk.data)
      setPendingOwners(po.data)
      setPendingParking(pp.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-8 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              tab === key
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />{label}
            {key === 'kyc' && pendingOwners.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                {pendingOwners.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading dashboard…" />
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-8">
              <AdminStats stats={stats} />
            </div>
          )}

          {tab === 'users' && (
            <UserTable users={users} onRefresh={loadAll} />
          )}

          {tab === 'parking' && (
            <div className="space-y-8">
              {pendingParking.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Pending Approval ({pendingParking.length})
                  </h2>
                  <ParkingTable spaces={pendingParking} onRefresh={loadAll} mode="pending" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">All Spaces</h2>
                <ParkingTable spaces={parking} onRefresh={loadAll} mode="approved" />
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      {['Ref', 'User', 'Space', 'From', 'To', 'Amount', 'Status'].map((h) => (
                        <th key={h} className="text-left px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono text-xs">{b.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-5 py-3">{b.seeker?.full_name}</td>
                        <td className="px-5 py-3">{b.parking_space?.title}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{new Date(b.start_time).toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{new Date(b.end_time).toLocaleString()}</td>
                        <td className="px-5 py-3 font-medium">₹{b.total_price}</td>
                        <td className="px-5 py-3">
                          <span className={`badge-${b.status === 'completed' ? 'green' : b.status === 'cancelled' ? 'red' : 'blue'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'kyc' && (
            <UserTable users={pendingOwners} onRefresh={loadAll} pendingOnly />
          )}
        </>
      )}
    </div>
  )
}
