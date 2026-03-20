import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { FileUpload } from '@/components/common/FileUpload';
import { USER_TYPES, VEHICLE_TYPES, PROPERTY_TYPES } from '@/lib/constants';
import { Car, CheckCircle2 } from 'lucide-react';
import { sendOTP, verifyOTP, registerSeeker, registerOwner } from '@/api/auth';
import { toast } from 'sonner';

export default function Register() {
  const [userType, setUserType] = useState(USER_TYPES.SEEKER);
  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm({ mode: 'onTouched' });
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [files, setFiles] = useState({
    aadhaar_proof: null,
    license_proof: null,
    govt_id_proof: null,
    profile_photo: null,
  });

  const navigate = useNavigate();
  const phone = watch('phone');

  const handleSendOTP = async () => {
    const isValid = await trigger('phone');
    if (!isValid) return;
    
    setIsSendingOtp(true);
    try {
      const res = await sendOTP({ phone, purpose: 'registration' });
      setOtpSent(true);
      toast.success('OTP sent successfully');

      // Dev convenience: backend echoes OTP when APP_ENV=development
      if (res?.data?.otp) {
        toast.message(`Dev OTP: ${res.data.otp}`);
      }
    } catch (error) {
      if (!error.response) {
        toast.error('Cannot reach API. If using LAN, set VITE_API_URL to your PC IP (e.g. http://192.168.x.x:8000) and restart frontend/back-end.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to send OTP');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyOTP({ phone, otp, purpose: 'registration' });
      setOtpVerified(true);
      toast.success('Phone verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    if (userType === USER_TYPES.OWNER) {
      const allowedPropertyTypes = Object.values(PROPERTY_TYPES);
      if (!allowedPropertyTypes.includes(data.property_type)) {
        toast.error('Please select a valid property type');
        return;
      }
    }

    if (!files.aadhaar_proof) {
      toast.error('Aadhaar proof is required');
      return;
    }

    if (userType === USER_TYPES.SEEKER && !files.license_proof) {
      toast.error('Driving license proof is required');
      return;
    }

    if (userType === USER_TYPES.OWNER && !files.govt_id_proof) {
      toast.error('Government ID proof is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      
      formData.append('aadhaar_proof', files.aadhaar_proof);
      if (files.profile_photo) formData.append('profile_photo', files.profile_photo);
      
      if (userType === USER_TYPES.SEEKER) {
        formData.append('license_proof', files.license_proof);
        await registerSeeker(formData);
      } else {
        formData.append('govt_id_proof', files.govt_id_proof);
        await registerOwner(formData);
      }

      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-bg-primary flex relative overflow-x-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-3"></div>

      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative z-10 border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 mb-12 absolute top-8 left-12">
          <Car className="w-8 h-8 text-brand-purple" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">ParkEase</span>
        </Link>
        
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Join the future of<br />urban parking.
        </h1>
        <p className="text-xl text-white/60 max-w-md mb-12">
          Whether you're looking for a spot or have one to share, ParkEase makes it simple, secure, and rewarding.
        </p>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-bold">1</div>
            <p className="text-white/80">Create your verified account</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink font-bold">2</div>
            <p className="text-white/80">Complete KYC for security</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-bold">3</div>
            <p className="text-white/80">Start parking or earning</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10">
        <GlassCard className="w-full max-w-xl p-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">ParkEase</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

          {/* Type Switcher */}
          <div className="flex p-1 bg-white/5 rounded-full mb-8 border border-white/10">
            <button
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${userType === USER_TYPES.SEEKER ? 'bg-brand-purple text-white shadow-glow' : 'text-white/60 hover:text-white'}`}
              onClick={() => setUserType(USER_TYPES.SEEKER)}
            >
              I want to Park (Seeker)
            </button>
            <button
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${userType === USER_TYPES.OWNER ? 'bg-brand-purple text-white shadow-glow' : 'text-white/60 hover:text-white'}`}
              onClick={() => setUserType(USER_TYPES.OWNER)}
            >
              I have a Space (Owner)
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput
                label="Full Name"
                {...register('full_name', { required: 'Required' })}
                error={errors.full_name?.message}
              />
              <GlassInput
                label="Email"
                type="email"
                {...register('email', { 
                  required: 'Required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })}
                error={errors.email?.message}
              />
            </div>

            <GlassInput
              label="Password"
              type="password"
              {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
              error={errors.password?.message}
            />

            {/* Phone & OTP */}
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <GlassInput
                    label="Mobile Number"
                    placeholder="+91"
                    {...register('phone', { 
                      required: 'Required',
                      pattern: { value: /^\+91[0-9]{10}$/, message: 'Must be +91 followed by 10 digits' }
                    })}
                    error={errors.phone?.message}
                    disabled={otpVerified}
                  />
                </div>
                {!otpVerified && (
                  <GlassButton type="button" variant="secondary" onClick={handleSendOTP} isLoading={isSendingOtp} disabled={otpSent}>
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </GlassButton>
                )}
              </div>

              {otpSent && !otpVerified && (
                <div className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <GlassInput
                      label="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="font-mono tracking-widest text-center"
                    />
                  </div>
                  <GlassButton type="button" onClick={handleVerifyOTP} isLoading={isVerifyingOtp}>
                    Verify
                  </GlassButton>
                </div>
              )}

              {otpVerified && (
                <div className="flex items-center text-green-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Phone verified
                </div>
              )}
            </div>

            <GlassInput
              label="Residential Address"
              {...register('residential_address', { required: 'Required' })}
              error={errors.residential_address?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput
                label="Aadhaar Number"
                placeholder="12 digits"
                {...register('aadhaar_number', { 
                  required: 'Required',
                  pattern: { value: /^[0-9]{12}$/, message: 'Must be 12 digits' }
                })}
                error={errors.aadhaar_number?.message}
              />
              <FileUpload
                label="Aadhaar Proof"
                accept="image/*,.pdf"
                onFileSelect={(file) => setFiles(prev => ({ ...prev, aadhaar_proof: file }))}
              />
            </div>

            {/* Seeker Specific */}
            {userType === USER_TYPES.SEEKER && (
              <div className="space-y-6 p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl animate-in fade-in">
                <h3 className="text-lg font-semibold text-brand-cyan mb-4">Driver Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassInput
                    label="Driving License Number"
                    {...register('driving_license_number', { required: 'Required' })}
                    error={errors.driving_license_number?.message}
                  />
                  <FileUpload
                    label="License Proof"
                    accept="image/*,.pdf"
                    onFileSelect={(file) => setFiles(prev => ({ ...prev, license_proof: file }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassInput
                    label="Vehicle Number"
                    placeholder="e.g. MH01AB1234"
                    {...register('vehicle_number', { required: 'Required' })}
                    error={errors.vehicle_number?.message}
                  />
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Vehicle Type</label>
                    <select
                      {...register('vehicle_type', { required: 'Required' })}
                      className="w-full bg-white/5 border border-white/15 rounded-[14px] px-4 py-3 text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                    >
                      {Object.values(VEHICLE_TYPES).map(v => (
                        <option key={v} value={v} className="bg-bg-secondary text-white">{v.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Owner Specific */}
            {userType === USER_TYPES.OWNER && (
              <div className="space-y-6 p-6 bg-brand-purple/5 border border-brand-purple/20 rounded-xl animate-in fade-in">
                <h3 className="text-lg font-semibold text-brand-purple mb-4">Property Details</h3>
                <GlassInput
                  label="Property Address"
                  {...register('property_address', { required: 'Required' })}
                  error={errors.property_address?.message}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Property Type</label>
                    <select
                      {...register('property_type', { required: 'Required' })}
                      className="w-full bg-white/5 border border-white/15 rounded-[14px] px-4 py-3 text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                    >
                      {Object.values(PROPERTY_TYPES).map(p => (
                        <option key={p} value={p} className="bg-bg-secondary text-white">{p.replace('_', ' ').toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <FileUpload
                    label="Govt ID Proof (Property)"
                    accept="image/*,.pdf"
                    onFileSelect={(file) => setFiles(prev => ({ ...prev, govt_id_proof: file }))}
                  />
                </div>
              </div>
            )}

            <FileUpload
              label="Profile Photo (Optional)"
              accept="image/*"
              onFileSelect={(file) => setFiles(prev => ({ ...prev, profile_photo: file }))}
            />

            <GlassButton type="submit" className="w-full mt-8" isLoading={isSubmitting}>
              Create Account
            </GlassButton>
          </form>

          <p className="text-center text-sm text-white/60 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-cyan hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
