import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateSeekerProfile, updateOwnerProfile, uploadProfilePhoto, setupSeekerProfile, setupOwnerProfile } from '@/api/users';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { FileUpload } from '@/components/common/FileUpload';
import { User, Mail, Phone, MapPin, ShieldCheck, Camera, Car, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { VEHICLE_TYPES, PROPERTY_TYPES } from '@/lib/constants';

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

          {/* ── Seeker Profile Setup Panel ────────────────────────────── */}
          <div className="mt-6">
            <SeekerSetupPanel user={user} onRefresh={refreshUser} />
          </div>

          {/* ── Owner Profile Setup Panel ────────────────────────────── */}
          <div className="mt-6">
            <OwnerSetupPanel user={user} onRefresh={refreshUser} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeker Setup Panel
// Shown when the user has no seeker_profile (no vehicle details filled in)
// ─────────────────────────────────────────────────────────────────────────────
function SeekerSetupPanel({ user, onRefresh }) {
  const [expanded, setExpanded]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({ license_proof: null, aadhaar_proof: null });

  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });

  // Show panel only if seeker profile is missing or incomplete
  if (user?.seeker_profile?.vehicle_number) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (data.vehicle_number)         fd.append('vehicle_number',          data.vehicle_number);
      if (data.vehicle_type)           fd.append('vehicle_type',            data.vehicle_type);
      if (data.driving_license_number) fd.append('driving_license_number',  data.driving_license_number);
      if (data.aadhaar_number)         fd.append('aadhaar_number',          data.aadhaar_number);
      if (files.license_proof)         fd.append('license_proof',           files.license_proof);
      if (files.aadhaar_proof)         fd.append('aadhaar_proof',           files.aadhaar_proof);

      await setupSeekerProfile(fd);
      toast.success('Vehicle details saved!');
      setExpanded(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 border border-brand-cyan/20 bg-brand-cyan/5">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-brand-cyan" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">Complete Seeker Profile</h3>
            <p className="text-xs text-white/50 mt-0.5">Add vehicle details to enable bookings</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-5 h-5 text-white/60" />
          : <ChevronDown className="w-5 h-5 text-white/60" />
        }
      </button>

      {expanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Vehicle Number"
              placeholder="e.g. TN12AB1234"
              {...register('vehicle_number', { required: 'Required' })}
              error={errors.vehicle_number?.message}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-white/80 ml-1">Vehicle Type</label>
              <select
                {...register('vehicle_type', { required: 'Required' })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all"
              >
                <option value="" className="bg-slate-900">Select type</option>
                {Object.values(VEHICLE_TYPES).map((t) => (
                  <option key={t} value={t} className="bg-slate-900">{t.toUpperCase()}</option>
                ))}
              </select>
              {errors.vehicle_type && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors.vehicle_type.message}</p>
              )}
            </div>
          </div>

          <GlassInput
            label="Driving License Number"
            placeholder="e.g. TN0120210012345"
            {...register('driving_license_number')}
          />

          <GlassInput
            label="Aadhaar Number (12 digits)"
            placeholder="XXXX XXXX XXXX"
            {...register('aadhaar_number', {
              pattern: { value: /^\d{12}$/, message: '12 digits required' },
            })}
            error={errors.aadhaar_number?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUpload
              label="License Proof (optional)"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, license_proof: f }))}
            />
            <FileUpload
              label="Aadhaar Proof (optional)"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, aadhaar_proof: f }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" className="flex-1" isLoading={isSubmitting}>
              Save Vehicle Details
            </GlassButton>
          </div>
        </form>
      )}
    </GlassCard>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Owner Setup Panel
// Shown when the user has not yet set up an owner profile
// ─────────────────────────────────────────────────────────────────────────────
function OwnerSetupPanel({ user, onRefresh }) {
  const [expanded, setExpanded]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({ govt_id_proof: null, aadhaar_proof: null });

  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });

  // Hide panel if user is already an owner with a profile
  if (user?.is_owner && user?.owner_profile?.property_address) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (data.property_address) fd.append('property_address',  data.property_address);
      if (data.property_type)    fd.append('property_type',     data.property_type);
      if (data.aadhaar_number)   fd.append('aadhaar_number',    data.aadhaar_number);
      if (files.govt_id_proof)   fd.append('govt_id_proof',     files.govt_id_proof);
      if (files.aadhaar_proof)   fd.append('aadhaar_proof',     files.aadhaar_proof);

      await setupOwnerProfile(fd);
      toast.success('Owner profile submitted for admin review!');
      setExpanded(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit owner profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 border border-brand-purple/20 bg-brand-purple/5">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-purple" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">
              {user?.is_owner ? 'Complete Owner Profile' : 'Become a Host'}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              List your parking space and start earning
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-5 h-5 text-white/60" />
          : <ChevronDown className="w-5 h-5 text-white/60" />
        }
      </button>

      {expanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
            💡 After submitting, an admin will review your KYC documents. Once approved, your listings will go live.
          </div>

          <GlassInput
            label="Property Address"
            placeholder="Address where you have parking"
            {...register('property_address', { required: 'Property address is required' })}
            error={errors.property_address?.message}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-white/80 ml-1">Property Type</label>
            <select
              {...register('property_type', { required: 'Required' })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all"
            >
              <option value="" className="bg-slate-900">Select type</option>
              {Object.values(PROPERTY_TYPES).map((p) => (
                <option key={p} value={p} className="bg-slate-900">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            {errors.property_type && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.property_type.message}</p>
            )}
          </div>

          <GlassInput
            label="Aadhaar Number (12 digits)"
            placeholder="XXXX XXXX XXXX"
            {...register('aadhaar_number', {
              pattern: { value: /^\d{12}$/, message: '12 digits required' },
            })}
            error={errors.aadhaar_number?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUpload
              label="Govt. ID Proof"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, govt_id_proof: f }))}
            />
            <FileUpload
              label="Aadhaar Proof"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, aadhaar_proof: f }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" className="flex-1" isLoading={isSubmitting}>
              Submit for Review
            </GlassButton>
          </div>
        </form>
      )}
    </GlassCard>
  );
}
