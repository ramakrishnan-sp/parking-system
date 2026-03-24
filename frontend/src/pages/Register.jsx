import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { sendOTP, verifyOTP, registerUnified } from '@/api/auth';
import { toast } from 'sonner';

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm({ mode: 'onTouched' });

  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [otpChannel, setOtpChannel]         = useState('sms');  // 'sms' | 'email'
  const [otpSent, setOtpSent]               = useState(false);
  const [otpVerified, setOtpVerified]       = useState(false);
  const [otp, setOtp]                       = useState('');
  const [isSendingOtp, setIsSendingOtp]     = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpRecipient, setOtpRecipient]     = useState('');

  const navigate = useNavigate();
  const phone    = watch('phone', '');
  const email    = watch('email', '');

  const getRecipient = () => {
    if (otpChannel === 'email') return email.trim();
    const p = phone.trim().replace(/\s/g, '');
    if (p.length === 10 && !p.startsWith('+')) return `+91${p}`;
    return p;
  };

  const handleSendOTP = async () => {
    const fieldToValidate = otpChannel === 'email' ? 'email' : 'phone';
    const valid = await trigger(fieldToValidate);
    if (!valid) return;

    const recipient = getRecipient();
    if (!recipient) {
      toast.error(`Enter your ${otpChannel === 'email' ? 'email address' : 'phone number'} first`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendOTP(recipient, 'registration', otpChannel);
      setOtpSent(true);
      setOtpRecipient(recipient);

      if (res?.data?.otp) {
        toast.success(`OTP sent! Dev code: ${res.data.otp}`, { duration: 60000 });
      } else {
        const channelLabel = otpChannel === 'email' ? `email (${recipient})` : `SMS (${recipient})`;
        toast.success(`OTP sent via ${channelLabel}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP. Check your details.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyOTP(otpRecipient, otp, 'registration');
      setOtpVerified(true);
      toast.success('Verified! You can now create your account.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone or email first');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('full_name',     data.full_name);
      formData.append('email',         data.email);
      formData.append('password',      data.password);

      const p = data.phone.trim().replace(/\s/g, '');
      formData.append('phone', p.length === 10 ? `+91${p}` : p);

      formData.append('otp_recipient', otpRecipient);

      if (data.residential_address) {
        formData.append('residential_address', data.residential_address);
      }

      await registerUnified(formData);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelChange = (channel) => {
    setOtpChannel(channel);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setOtpRecipient('');
  };

  return (
    <div className="min-h-[100svh] bg-bg-primary flex relative overflow-x-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-3"></div>

      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative z-10 border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 mb-12 absolute top-8 left-12">
          <Car className="w-8 h-8 text-brand-purple" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
            ParkEase
          </span>
        </Link>
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          One account.<br />Park or host.
        </h1>
        <p className="text-xl text-white/60 max-w-md mb-12">
          Register once and unlock both parking search and space listing.
        </p>
        <div className="space-y-6">
          {[
            { n: '1', badgeClass: 'bg-brand-purple/20 text-brand-purple', text: 'Verify via SMS or Email OTP' },
            { n: '2', badgeClass: 'bg-brand-pink/20 text-brand-pink',     text: 'Find nearby parking instantly' },
            { n: '3', badgeClass: 'bg-brand-cyan/20 text-brand-cyan',     text: 'List your space anytime to earn' },
          ].map(({ n, badgeClass, text }) => (
            <div key={n} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${badgeClass} flex items-center justify-center font-bold`}>
                {n}
              </div>
              <p className="text-white/80">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <GlassCard className="w-full max-w-md p-8 animate-in fade-in slide-in-from-right-8 duration-500 my-auto">

          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
              ParkEase
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Create Account</h2>
          <p className="text-sm text-white/50 text-center mb-8">
            No role selection — park and list spaces with one account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <GlassInput
              label="Full Name"
              placeholder="Jane Doe"
              {...register('full_name', { required: 'Full name is required' })}
              error={errors.full_name?.message}
            />

            <GlassInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
              error={errors.email?.message}
            />

            <GlassInput
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              error={errors.password?.message}
            />

            <GlassInput
              label="Mobile Number"
              placeholder="+91XXXXXXXXXX or 10 digits"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[1-9]\d{9,14}$/,
                  message: 'Enter a valid phone number',
                },
              })}
              error={errors.phone?.message}
            />

            <GlassInput
              label="Residential Address (optional)"
              placeholder="Your home address"
              {...register('residential_address')}
            />

            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-sm font-medium text-white/80 mb-3">
                  Verify via
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleChannelChange('sms')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      otpChannel === 'sms'
                        ? 'bg-brand-purple/20 border-brand-purple text-brand-purple'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChannelChange('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      otpChannel === 'email'
                        ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>

                <p className="text-xs text-white/40 mt-2">
                  {otpChannel === 'sms'
                    ? 'OTP will be sent to your mobile number'
                    : 'OTP will be sent to your email address'}
                </p>
              </div>

              {!otpVerified && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={handleSendOTP}
                  isLoading={isSendingOtp}
                  className="w-full"
                >
                  {otpSent ? 'Resend OTP' : `Send OTP via ${otpChannel === 'sms' ? 'SMS' : 'Email'}`}
                </GlassButton>
              )}

              {otpSent && !otpVerified && (
                <div className="flex gap-3 items-end animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1">
                    <GlassInput
                      label={`Enter OTP sent to ${otpChannel === 'sms' ? 'your phone' : 'your email'}`}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="font-mono tracking-widest text-center text-lg"
                      placeholder="• • • • • •"
                    />
                  </div>
                  <GlassButton
                    type="button"
                    onClick={handleVerifyOTP}
                    isLoading={isVerifyingOtp}
                    disabled={otp.length !== 6}
                    className="shrink-0 mb-0.5"
                  >
                    Verify
                  </GlassButton>
                </div>
              )}

              {otpVerified && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {otpChannel === 'sms' ? 'Phone' : 'Email'} verified successfully
                </div>
              )}
            </div>

            <GlassButton
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
              disabled={!otpVerified}
            >
              Create Account
            </GlassButton>
          </form>

          <p className="text-center text-sm text-white/60 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-cyan hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
