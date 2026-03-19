import { Star, MapPin, Clock, Car, ChevronRight, X } from 'lucide-react'

export default function ParkingCard({ parking, distance, onBook, onClose }) {
  if (!parking) return null

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(parking.avg_rating || 0))
  const primaryPhoto = parking.photos?.find((p) => p.is_primary) || parking.photos?.[0]

  const vehicleLabel = {
    car: 'Cars',
    bike: 'Bikes',
    ev: 'EVs',
    all: 'All vehicles',
  }[parking.vehicle_type_allowed] || parking.vehicle_type_allowed

  const distKm =
    distance != null
      ? distance < 1000
        ? `${Math.round(distance)} m`
        : `${(distance / 1000).toFixed(1)} km`
      : null

  return (
    <div className="card-float w-80 overflow-hidden animate-slide-up">
      {/* Cover photo */}
      {primaryPhoto ? (
        <div className="relative -mx-5 -mt-5 mb-4 h-40 bg-gray-200">
          <img
            src={primaryPhoto.photo_url}
            alt={parking.title}
            className="w-full h-full object-cover"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow"
          >
            <X size={14} />
          </button>
        )
      )}

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 leading-tight">{parking.title}</h3>
          <span className="text-primary-600 font-bold text-base whitespace-nowrap">
            ₹{parking.price_per_hour}/hr
          </span>
        </div>

        {/* Rating */}
        {parking.total_reviews > 0 && (
          <div className="flex items-center gap-1">
            {stars.map((filled, i) => (
              <Star
                key={i}
                size={12}
                className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({parking.total_reviews})</span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
          {distKm && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-primary-500" /> {distKm}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Car size={12} className="text-gray-400" /> {vehicleLabel}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span
              className={
                parking.available_slots > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
              }
            >
              {parking.available_slots > 0
                ? `${parking.available_slots} slot${parking.available_slots > 1 ? 's' : ''} free`
                : 'Full'}
            </span>
          </span>
        </div>

        {/* Amenities */}
        {parking.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {parking.amenities.slice(0, 3).map((a) => (
              <span key={a} className="badge-gray text-xs">{a}</span>
            ))}
            {parking.amenities.length > 3 && (
              <span className="badge-gray text-xs">+{parking.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Privacy notice */}
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <MapPin size={11} /> Exact location shown after booking
        </p>

        {/* CTA */}
        <button
          onClick={() => onBook?.(parking)}
          disabled={parking.available_slots === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {parking.available_slots > 0 ? (
            <>Book Now <ChevronRight size={16} /></>
          ) : (
            'No slots available'
          )}
        </button>
      </div>
    </div>
  )
}
