import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

/**
 * Thin wrapper around shadcn Dialog for consistent modal styling.
 *
 * Props:
 *   isOpen    — boolean
 *   onClose   — function
 *   title     — string (optional)
 *   maxWidth  — tailwind max-width class e.g. 'max-w-lg' (default)
 *   children
 */
export default function Modal({ isOpen, onClose, title, maxWidth = 'sm:max-w-lg', children }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={maxWidth}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}
