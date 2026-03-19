import { cn } from '../../lib/utils'

const VARIANTS = {
  // Booking statuses
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Approval
  approved:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Payments
  paid:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  refunded:  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  failed:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Roles
  seeker:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  owner:     'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  admin:     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function StatusBadge({ status, className }) {
  const variant = VARIANTS[status?.toLowerCase()] ?? VARIANTS.completed
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        variant,
        className
      )}
    >
      {status?.replace('_', ' ')}
    </span>
  )
}
