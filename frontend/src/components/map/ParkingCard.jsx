import { Star, MapPin, Clock, Car, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ParkingCard({ parking, onBook, onClose }) {
  if (!parking) return null

  const primaryPhoto = parking.photos?.find((p) => p.is_primary) || parking.photos?.[0]
  const distKm = parking.distance_meters != null
    ? parking.distance_meters < 1000
      ? `${Math.round(parking.distance_meters)}m`
      : `${(parking.distance_meters / 1000).toFixed(1)}km`
    : null

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-float w-72 overflow-hidden animate-slide-up">
      {/* Cover */}
      {primaryPhoto ? (
        <div className="relative h-36 bg-muted">
          <img src={primaryPhoto.photo_url} alt={parking.title} className="w-full h-full object-cover" />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 size-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ) : onClose && (
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="size-7 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight">{parking.title}</h3>
          <span className="text-brand font-bold text-sm whitespace-nowrap">₹{parking.price_per_hour}/hr</span>
        </div>

        {/* Rating */}
        {parking.total_reviews > 0 && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn('size-3', i < Math.round(parking.avg_rating || 0)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground/30'
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({parking.total_reviews})</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {distKm && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 text-brand" /> {distKm}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Car className="size-3" />
            {parking.vehicle_type_allowed === 'all' ? 'All vehicles' : parking.vehicle_type_allowed}
          </span>
          <span className={cn(
            'flex items-center gap-1 font-medium',
            parking.available_slots > 0 ? 'text-green-600' : 'text-destructive'
          )}>
            <Clock className="size-3" />
            {parking.available_slots > 0
              ? `${parking.available_slots} slot${parking.available_slots > 1 ? 's' : ''} free`
              : 'Full'
            }
          </span>
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <MapPin className="size-3 shrink-0" /> Exact location shown after booking
        </p>

        {/* CTA */}
        <button
          onClick={() => onBook?.(parking)}
          disabled={parking.available_slots === 0}
          className="w-full h-9 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {parking.available_slots > 0 ? 'Book Now' : 'No slots available'}
        </button>
      </div>
    </div>
  )
}
