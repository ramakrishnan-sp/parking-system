import { cn } from '../../lib/utils'

const COLOR_MAP = {
  brand:  'bg-brand/10 text-brand',
  green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray:   'bg-muted text-muted-foreground',
}

/**
 * KPI stat card used on dashboards.
 *
 * Props:
 *   icon     — Lucide icon component
 *   label    — e.g. "Total Bookings"
 *   value    — e.g. "1,234" or "₹45,200"
 *   sub      — optional sub-label e.g. "₹12,000 this month"
 *   color    — 'brand' | 'green' | 'red' | 'yellow' | 'blue' | 'gray'
 *   loading  — show skeleton if true
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'brand',
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card hover:shadow-float transition-shadow">
      <div className="flex items-center gap-4">
        <div className={cn('size-12 rounded-2xl flex items-center justify-center shrink-0', COLOR_MAP[color])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/75 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
