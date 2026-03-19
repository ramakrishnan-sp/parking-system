import { TrendingUp, Users, Car, BookOpen, DollarSign, AlertCircle } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red:    'bg-red-50    text-red-600',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminStats({ stats }) {
  if (!stats) return null
  const { users, parking, bookings, revenue, pending_owner_verifications } = stats

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Users"
        value={users.total.toLocaleString()}
        sub={`${users.seekers} seekers · ${users.owners} owners`}
        color="blue"
      />
      <StatCard
        icon={Car}
        label="Parking Spaces"
        value={parking.total.toLocaleString()}
        sub={`${parking.pending_approval} pending approval`}
        color="green"
      />
      <StatCard
        icon={BookOpen}
        label="Total Bookings"
        value={bookings.total.toLocaleString()}
        sub={`${bookings.confirmed} confirmed`}
        color="purple"
      />
      <StatCard
        icon={DollarSign}
        label="Platform Revenue"
        value={`₹${revenue.platform_commission.toLocaleString()}`}
        sub={`₹${revenue.total_processed.toLocaleString()} total processed`}
        color="orange"
      />
      {pending_owner_verifications > 0 && (
        <StatCard
          icon={AlertCircle}
          label="Pending Verifications"
          value={pending_owner_verifications}
          sub="Owner KYC pending"
          color="red"
        />
      )}
    </div>
  )
}
