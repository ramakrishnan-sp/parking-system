import { useState } from 'react'
import { Edit2, Trash2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { deleteParking, updateParking } from '../../api/parking'
import StatusBadge from '../common/StatusBadge'
import { cn } from '../../lib/utils'

function getSpaceStatus(ps) {
  if (!ps.is_active) return 'inactive'
  if (!ps.is_approved) return 'pending'
  return 'approved'
}

export default function ParkingSpaceCard({ space: ps, onEdit, onRefresh }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = getSpaceStatus(ps)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await updateParking(ps.id, { is_active: !ps.is_active })
      toast.success(ps.is_active ? 'Space deactivated' : 'Space activated')
      onRefresh?.()
    } catch {} finally { setToggling(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${ps.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteParking(ps.id)
      toast.success('Parking space removed')
      onRefresh?.()
    } catch {} finally { setDeleting(false) }
  }

  const slotPercent = ps.total_slots > 0
    ? Math.round((ps.available_slots / ps.total_slots) * 100)
    : 0

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden hover:shadow-float transition-shadow">
      {/* Photo */}
      {ps.photos?.[0] ? (
        <img
          src={ps.photos[0].photo_url}
          alt={ps.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-sidebar-gradient flex items-center justify-center">
          <MapPin className="size-8 text-white/60" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight">{ps.title}</h3>
          <StatusBadge status={status} />
        </div>

        {/* Price + slots */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand">₹{ps.price_per_hour}/hr</span>
          <span className="text-muted-foreground">
            {ps.total_slots} slot{ps.total_slots > 1 ? 's' : ''}
          </span>
        </div>

        {/* Availability bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Availability</span>
            <span>{ps.available_slots}/{ps.total_slots} free</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all',
                slotPercent > 50 ? 'bg-green-500' :
                slotPercent > 20 ? 'bg-yellow-500' :
                'bg-destructive'
              )}
              style={{ width: `${slotPercent}%` }}
            />
          </div>
        </div>

        {/* Vehicle type + property type */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
            {ps.vehicle_type_allowed}
          </span>
          {ps.property_type && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
              {ps.property_type}
            </span>
          )}
        </div>

        {/* Pending approval notice */}
        {!ps.is_approved && ps.is_active && (
          <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2.5 py-1.5">
            ⏳ Awaiting admin approval
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          {/* Toggle active */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={toggling || !ps.is_approved}
              title={ps.is_approved ? (ps.is_active ? 'Deactivate' : 'Activate') : 'Awaiting approval'}
              className="disabled:opacity-40"
            >
              {ps.is_active
                ? <ToggleRight className="size-6 text-green-500" />
                : <ToggleLeft className="size-6 text-muted-foreground" />
              }
            </button>
            <span className="text-xs text-muted-foreground">
              {ps.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => onEdit?.(ps)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="size-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
