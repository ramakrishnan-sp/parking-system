import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { createParking, updateParking } from '../../api/parking'
import { cn } from '../../lib/utils'

const VEHICLE_TYPES = [
  { value: 'all',  label: 'All vehicles' },
  { value: 'car',  label: 'Cars only' },
  { value: 'bike', label: 'Bikes only' },
  { value: 'ev',   label: 'EVs only' },
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
  const [loading, setLoading] = useState(false)
  const [amenities, setAmenities] = useState(initialData?.amenities || [])
  const [photos, setPhotos] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          price_per_hour: initialData.price_per_hour,
          total_slots: initialData.total_slots,
          vehicle_type_allowed: initialData.vehicle_type_allowed || 'all',
          property_type: initialData.property_type,
        }
      : { vehicle_type_allowed: 'all', total_slots: 1 },
  })

  const toggleAmenity = (a) =>
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (isEdit) {
        await updateParking(initialData.id, { ...data, amenities })
        toast.success('Parking space updated!')
      } else {
        const fd = new FormData()
        Object.entries({ ...data, amenities: JSON.stringify(amenities) }).forEach(([k, v]) =>
          fd.append(k, v)
        )
        photos.forEach((f) => fd.append('photos', f))
        await createParking(fd)
        toast.success('Submitted for admin approval!')
      }
      onSuccess?.()
    } catch {} finally { setLoading(false) }
  }

  const input = 'h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title *</label>
        <input {...register('title', { required: 'Title is required' })}
          className={cn(input, errors.title && 'ring-destructive')}
          placeholder="e.g. Safe parking near MG Road" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea {...register('description')} rows={3}
          className="w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          placeholder="Describe your space…" />
      </div>

      {/* Price + Slots */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Price/hr (₹) *</label>
          <input {...register('price_per_hour', { required: true, min: 1 })}
            type="number" min="1" step="0.5" className={input} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total slots *</label>
          <input {...register('total_slots', { required: true, min: 1 })}
            type="number" min="1" className={input} />
        </div>
      </div>

      {/* Location (new only) */}
      {!isEdit && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Latitude *</label>
              <input {...register('exact_latitude', { required: true })}
                type="number" step="any" className={input} placeholder="13.0827" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Longitude *</label>
              <input {...register('exact_longitude', { required: true })}
                type="number" step="any" className={input} placeholder="80.2707" />
            </div>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <MapPin className="size-3 shrink-0" />
            Exact coordinates are kept private. Seekers see a masked location.
          </p>
        </div>
      )}

      {/* Vehicle type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Allowed vehicles</label>
        <div className="flex gap-2 flex-wrap">
          {VEHICLE_TYPES.map((v) => (
            <label key={v.value} className="cursor-pointer">
              <input {...register('vehicle_type_allowed')} type="radio" value={v.value} className="sr-only" />
              <span className="px-3 py-1.5 rounded-full text-sm border border-border hover:border-brand transition-colors">
                {v.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Property type</label>
        <select {...register('property_type')} className={cn(input, 'h-10')}>
          <option value="">Select…</option>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a} type="button" onClick={() => toggleAmenity(a)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                amenities.includes(a) ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Photos (new only) */}
      {!isEdit && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Photos (up to 8)</label>
          <input
            type="file" multiple accept="image/*"
            onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 8))}
            className="w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
          />
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {photos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt="" className="size-16 rounded-lg object-cover" />
                  {i === 0 && (
                    <span className="absolute inset-x-0 bottom-0 text-center text-[10px] bg-brand text-white rounded-b-lg">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}
          className="flex-1 h-10 rounded-lg bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
          {loading && <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  )
}
