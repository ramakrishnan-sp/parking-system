import { useState } from 'react'
import { CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  toggleUserActive,
  approveOwner,
  rejectOwner,
} from '../../api/admin'

export default function UserTable({ users, onRefresh, showActions = true }) {
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState(null)

  const filtered = (users || []).filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search),
  )

  const handleToggle = async (id) => {
    setActionId(id)
    try {
      await toggleUserActive(id)
      toast.success('User status updated')
      onRefresh?.()
    } catch {} finally { setActionId(null) }
  }

  const handleApproveOwner = async (userId) => {
    setActionId(userId)
    try {
      await approveOwner(userId)
      toast.success('Owner approved')
      onRefresh?.()
    } catch {} finally { setActionId(null) }
  }

  const handleRejectOwner = async (userId) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason) return
    setActionId(userId)
    try {
      await rejectOwner(userId, reason)
      toast.success('Owner rejected')
      onRefresh?.()
    } catch {} finally { setActionId(null) }
  }

  return (
    <div className="card overflow-hidden p-0">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">User</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Phone</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Status</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Joined</th>
              {showActions && <th className="text-left px-5 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {user.profile_photo_url ? (
                      <img src={user.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`badge ${
                    user.user_type === 'admin' ? 'badge-blue' :
                    user.user_type === 'owner' ? 'badge-green' : 'badge-gray'
                  }`}>
                    {user.user_type}
                  </span>
                </td>
                <td className="px-5 py-3 hidden md:table-cell text-gray-600">{user.phone}</td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  <span className={user.is_active ? 'badge-green' : 'badge-red'}>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-xs">
                  {format(new Date(user.created_at), 'dd MMM yyyy')}
                </td>
                {showActions && (
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(user.id)}
                        disabled={actionId === user.id}
                        className={`btn-ghost text-xs py-1 px-2 ${
                          user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>

                      {user.user_type === 'owner' &&
                        user.owner_profile?.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveOwner(user.id)}
                              disabled={actionId === user.id}
                              className="btn-ghost text-xs py-1 px-2 text-green-600 hover:bg-green-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectOwner(user.id)}
                              disabled={actionId === user.id}
                              className="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
