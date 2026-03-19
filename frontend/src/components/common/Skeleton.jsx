// src/components/common/Skeleton.jsx
import { cn } from '../../lib/utils'

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  )
}

// Stat card skeleton (matches StatCard layout)
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  )
}

// Booking card skeleton
export function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}

// Parking space card skeleton
export function ParkingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

// Notification skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <Skeleton className="mt-1.5 size-2 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full max-w-xs" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
