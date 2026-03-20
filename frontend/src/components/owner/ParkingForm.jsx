import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { VEHICLE_TYPES } from '@/lib/constants';
import { toast } from 'sonner';

export function ParkingForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const defaultVehicleTypes = (() => {
    if (!initialData?.vehicle_type_allowed) return [];
    if (initialData.vehicle_type_allowed === 'all') return Object.values(VEHICLE_TYPES);
    return [initialData.vehicle_type_allowed];
  })();

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      exact_latitude: initialData?.exact_latitude ?? '',
      exact_longitude: initialData?.exact_longitude ?? '',
      price_per_hour: initialData?.price_per_hour ?? '',
      total_slots: initialData?.total_slots ?? 1,
      vehicle_type_allowed: defaultVehicleTypes,
    },
    mode: 'onTouched',
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('exact_latitude', position.coords.latitude, { shouldValidate: true, shouldDirty: true });
        setValue('exact_longitude', position.coords.longitude, { shouldValidate: true, shouldDirty: true });
        trigger(['exact_latitude', 'exact_longitude']);
        toast.success('Location captured');
        setIsFetchingLocation(false);
      },
      (error) => {
        const isInsecureContext = typeof window !== 'undefined' && window.isSecureContext === false;
        if (isInsecureContext) {
          toast.error('Location requires HTTPS (or localhost)');
        } else {
          toast.error(error?.message || 'Could not get your location');
        }
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GlassInput
        label="Title"
        placeholder="e.g., Secure Covered Parking near Station"
        {...register('title', { required: 'Title is required' })}
        error={errors.title?.message}
      />
      
      <div className="space-y-1">
        <label className="block text-sm font-medium text-white/80 ml-1">Description</label>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple/50 transition-all resize-none h-24"
          placeholder="Describe your parking space..."
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && <p className="text-red-400 text-xs mt-1 ml-1">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="block text-sm font-medium text-white/80 ml-1">Coordinates</label>
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleUseCurrentLocation}
            isLoading={isFetchingLocation}
            disabled={isLoading}
            className="shrink-0"
          >
            Use current location
          </GlassButton>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GlassInput
            label="Latitude"
            type="number"
            step="any"
            placeholder="e.g., 19.0760"
            {...register('exact_latitude', { required: 'Latitude is required', valueAsNumber: true })}
            error={errors.exact_latitude?.message}
          />
          <GlassInput
            label="Longitude"
            type="number"
            step="any"
            placeholder="e.g., 72.8777"
            {...register('exact_longitude', { required: 'Longitude is required', valueAsNumber: true })}
            error={errors.exact_longitude?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassInput
          label="Price per Hour (₹)"
          type="number"
          min="0"
          {...register('price_per_hour', { required: 'Price is required', valueAsNumber: true })}
          error={errors.price_per_hour?.message}
        />
        <GlassInput
          label="Total Slots"
          type="number"
          min="1"
          {...register('total_slots', { required: 'Slots are required', valueAsNumber: true })}
          error={errors.total_slots?.message}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80 ml-1">Allowed Vehicles</label>
        <div className="flex flex-wrap gap-3">
          {Object.values(VEHICLE_TYPES).map(type => (
            <label key={type} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
              <input
                type="checkbox"
                value={type}
                {...register('vehicle_type_allowed', { required: 'Select at least one vehicle type' })}
                className="rounded border-white/20 bg-white/5 text-brand-purple focus:ring-brand-purple/50"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
        {errors.vehicle_type_allowed && <p className="text-red-400 text-xs mt-1 ml-1">{errors.vehicle_type_allowed.message}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <GlassButton type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" className="flex-1" isLoading={isLoading}>
          {initialData ? 'Update Space' : 'Add Space'}
        </GlassButton>
      </div>
    </form>
  );
}
