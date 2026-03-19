import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, DollarSign, Car, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createParking, updateParking } from '../../api/parking'

const VEHICLE_TYPES = [
  { value: 'car',  label: 'Cars only' },
  { value: 'bike', label: 'Bikes only' },
  { value: 'ev',   label: 'EVs only' },
  { value: 'all',  label: 'All vehicles' },
]

const PROPERTY_TYPES = [
  { value: 'house',     label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'shop',      label: 'Shop' },
  { value: 'office',    label: 'Office' },
]

const AMENITY_OPTIONS = [
  'CCTV', 'Covered', 'Security Guard', 'EV Charging',
  '24/7 Access', 'Well-lit', 'Wheelchair Access',
]

export default function ParkingForm({ initialData, onSuccess, onCancel }) {
  const isEdit = !!initialData?.id
  const [loading, setLoading]     = useState(false)
  const [amenities, setAmenities] = useState(initialData?.amenities || [])
  const [photos, setPhotos]       = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      vehicle_type_allowed: 'all',
      total_slots: 1,
    },
  })

  const toggleAmenity = (a) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    )

  const handlePhotoSelect = (e) => {
    setPhotos(Array.from(e.target.files).slice(0, 8))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (isEdit) {
        await updateParking(initialData.id, {
          ...data,
          amenities,
        })
        toast.success('Parking space updated!')
      } else {
        const fd = new FormData()
        Object.entries({ ...data, amenities: JSON.stringify(amenities) }).forEach(([k, v]) =>
          fd.append(k, v),
        )
        photos.forEach((f) => fd.append('photos', f))
        await createParking(fd)
        toast.success('Parking space submitted for approval!')
      }
      onSuccess?.()
    } catch {} finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="e.g. Safe parking near MG Road"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          rows={3}
          className="input resize-none"
          placeholder="Describe your parking space…"
          {...register('description')}
        />
      </div>

      {/* Price & Slots */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Price / hour (₹) *</label>
          <input
            type="number"
            min="1"
            step="0.5"
            className={`input ${errors.price_per_hour ? 'input-error' : ''}`}
            {...register('price_per_hour', { required: true, min: 1 })}
          />
        </div>
        <div>
          <label className="label">Total Slots *</label>
          <input
            type="number"
            min="1"
            className="input"
            {...register('total_slots', { required: true, min: 1 })}
          />
        </div>
      </div>

      {/* Location (only for new) */}
      {!isEdit && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Latitude *</label>
            <input
              type="number"
              step="any"
              className={`input ${errors.exact_latitude ? 'input-error' : ''}`}
              placeholder="12.971599"
              {...register('exact_latitude', { required: true })}
            />
          </div>
          <div>
            <label className="label">Longitude *</label>
            <input
              type="number"
              step="any"
              className={`input ${errors.exact_longitude ? 'input-error' : ''}`}
              placeholder="77.594563"
              {...register('exact_longitude', { required: true })}
            />
          </div>
          <p className="col-span-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <MapPin size={12} /> Exact coordinates are kept private. A masked location will be shown on the map.
          </p>
        </div>
      )}

      {/* Vehicle type */}
      <div>
        <label className="label">Allowed Vehicle Types</label>
        <select className="input" {...register('vehicle_type_allowed')}>
          {VEHICLE_TYPES.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Property type */}
      <div>
        <label className="label">Property Type</label>
        <select className="input" {...register('property_type')}>
          <option value="">Select…</option>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div>
        <label className="label">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                amenities.includes(a)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Photos (new only) */}
      {!isEdit && (
        <div>
          <label className="label">Photos (up to 8)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoSelect}
            className="input p-2 text-sm"
          />
          {photos.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {photos.map((f, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute -bottom-1 left-0 right-0 text-center text-xs bg-primary-600 text-white rounded-b-lg">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : null}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Parking Space'}
        </button>
      </div>
    </form>
  )
}
