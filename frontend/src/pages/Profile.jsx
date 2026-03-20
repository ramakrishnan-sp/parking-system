import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateSeekerProfile, updateOwnerProfile, uploadProfilePhoto } from '@/api/users';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { FileUpload } from '@/components/common/FileUpload';
import { User, Mail, Phone, MapPin, ShieldCheck, Camera, Car } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { PROPERTY_TYPES } from '@/lib/constants';

export default function Profile() {
  const { user, refreshUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      vehicle_number: user?.vehicle_number || '',
      property_address: user?.property_address || '',
      property_type: user?.property_type || ''
    },
    mode: 'onTouched'
  });

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        phone: user.phone || '',
        vehicle_number: user.vehicle_number || '',
        property_address: user.property_address || '',
        property_type: user.property_type || ''
      });
    }
  }, [user, reset]);

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadProfilePhoto(file);
      toast.success('Profile photo updated');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update photo');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (user?.user_type === 'seeker') {
        await updateSeekerProfile({
          full_name: data.full_name,
          phone: data.phone,
          vehicle_number: data.vehicle_number
        });
      } else if (user?.user_type === 'owner') {
        await updateOwnerProfile({
          full_name: data.full_name,
          phone: data.phone,
          property_address: data.property_address,
          property_type: data.property_type
        });
      }
      toast.success('Profile updated successfully');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-white/60">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Photo & Info */}
        <div className="space-y-6">
          <GlassCard className="p-6 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 mb-4 group">
              {user.profile_photo_url ? (
                <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold text-4xl">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-xs text-white font-medium">Change</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && <p className="text-xs text-brand-cyan mt-2 animate-pulse">Uploading...</p>}

            <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
            <p className="text-white/60 text-sm capitalize mb-4">{user.user_type}</p>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-xl border border-white/10">
                <Mail className="w-4 h-4 text-brand-pink shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-xl border border-white/10">
                <Phone className="w-4 h-4 text-brand-cyan shrink-0" />
                <span>{user.phone || 'Not provided'}</span>
              </div>
            </div>
          </GlassCard>

          {user.user_type === 'owner' && (
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-purple" /> Verification Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">KYC Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    user.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                {!user.is_verified && (
                  <p className="text-xs text-white/40 leading-relaxed">
                    Your documents are currently under review. This usually takes 24-48 hours.
                  </p>
                )}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <GlassCard className="p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Edit Details</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <GlassInput
                  label="Full Name"
                  icon={User}
                  {...register('full_name', { required: 'Name is required' })}
                  error={errors.full_name?.message}
                />
                <GlassInput
                  label="Phone Number"
                  icon={Phone}
                  {...register('phone', { 
                    required: 'Phone is required',
                    pattern: { value: /^\+?[1-9]\d{9,14}$/, message: 'Invalid phone number' }
                  })}
                  error={errors.phone?.message}
                />
              </div>

              {user.user_type === 'seeker' && (
                <GlassInput
                  label="Vehicle Number"
                  icon={Car}
                  placeholder="e.g., MH 01 AB 1234"
                  {...register('vehicle_number')}
                />
              )}

              {user.user_type === 'owner' && (
                <>
                  <GlassInput
                    label="Property Address"
                    icon={MapPin}
                    {...register('property_address', { required: 'Address is required' })}
                    error={errors.property_address?.message}
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-white/80 ml-1">Property Type</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple/50 transition-all"
                      {...register('property_type', { required: 'Property type is required' })}
                    >
                      <option value="" className="bg-slate-900">Select Type</option>
                      {Object.values(PROPERTY_TYPES).map((t) => (
                        <option key={t} value={t} className="bg-slate-900">
                          {t.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {errors.property_type && <p className="text-red-400 text-xs mt-1 ml-1">{errors.property_type.message}</p>}
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <GlassButton type="submit" isLoading={isSubmitting} className="w-full sm:w-auto px-8">
                  Save Changes
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
