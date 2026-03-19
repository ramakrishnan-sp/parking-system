import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, User, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMe, changePassword } from '../api/auth'
import { getMyNotifications, markNotificationRead } from '../api/users'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format } from 'date-fns'

const TABS = ['Profile', 'Notifications', 'Security']

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState('Profile')
  const [notifications, setNotifications] = useState([])
  const [nLoading, setNLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    getMe().then((r) => setUser(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== 'Notifications') return
    setNLoading(true)
    getMyNotifications()
      .then((r) => setNotifications(r.data))
      .catch(() => {})
      .finally(() => setNLoading(false))
  }, [tab])

  const handleMarkRead = async (id) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  const onChangePassword = async (data) => {
    if (data.new_password !== data.confirm_password) { toast.error('Passwords do not match'); return }
    setPwLoading(true)
    try {
      await changePassword({ current_password: data.old_password, new_password: data.new_password })
      toast.success('Password changed successfully')
      reset()
    } catch {} finally { setPwLoading(false) }
  }

  if (!user) return <LoadingSpinner text="Loading profile…" />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          {user.profile_photo_url ? (
            <img src={user.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
              {user.full_name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
          <span className={`badge-${user.role === 'admin' ? 'red' : user.role === 'owner' ? 'blue' : 'green'} mt-1 inline-block`}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
            {t === 'Notifications' && notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {notifications.filter((n) => !n.is_read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'Profile' && (
        <div className="card space-y-4">
          {[
            ['Full name',    user.full_name],
            ['Email',        user.email],
            ['Phone',        user.phone],
            ['Role',         user.role],
            ['Phone verified', user.is_phone_verified ? 'Yes' : 'No'],
            ['Account status', user.is_active ? 'Active' : 'Suspended'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm py-3 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value || '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'Notifications' && (
        nLoading ? <LoadingSpinner text="Loading…" /> : (
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bell size={36} className="mx-auto mb-2 opacity-30" />
                <p>No notifications</p>
              </div>
            ) : notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`card cursor-pointer transition-all ${!n.is_read ? 'border-l-4 border-l-primary-500 bg-primary-50' : ''}`}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className={`text-sm ${!n.is_read ? 'font-semibold' : ''} text-gray-800`}>{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'dd MMM yyyy • h:mm a')}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Security tab */}
      {tab === 'Security' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-5">Change Password</h3>
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            {[
              { key: 'old_password',     label: 'Current password',  show: showOld, setShow: setShowOld },
              { key: 'new_password',     label: 'New password',      show: showNew, setShow: setShowNew },
              { key: 'confirm_password', label: 'Confirm new password', show: showNew, setShow: setShowNew },
            ].map(({ key, label, show, setShow }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input
                    {...register(key, { required: true, minLength: key !== 'old_password' ? 8 : 1 })}
                    type={show ? 'text' : 'password'}
                    className="input pr-10"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors[key] && <p className="text-red-500 text-xs mt-1">Required (min 8 chars)</p>}
              </div>
            ))}
            <button type="submit" disabled={pwLoading} className="btn-primary mt-2">
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
