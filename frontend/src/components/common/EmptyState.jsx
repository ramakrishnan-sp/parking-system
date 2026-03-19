/**
 * Reusable empty state.
 *
 * Props:
 *   icon     — Lucide icon component
 *   title    — heading text
 *   message  — description text
 *   action   — optional { label: string, onClick: fn } or { label: string, href: string }
 */
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {Icon && <Icon className="size-7 text-muted-foreground/60" />}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{message}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
