import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, Eye, EyeOff, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { sendOTP, verifyOTP, otpLogin, loginUser, getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function Login() {
  const { register, handleSubmit, watch, formState: { errors }, trigger } =
    useForm({ mode: 'onTouched' });

  const [showPassword, setShowPassword]     = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [step, setStep]                     = useState(0);     // 0=OTP, 1=password
  const [otpChannel, setOtpChannel]         = useState('sms'); // 'sms' | 'email'
  const [otpSent, setOtpSent]               = useState(false);
  const [otpVerified, setOtpVerified]       = useState(false);
  const [otp, setOtp]                       = useState('');
  const [isSendingOtp, setIsSendingOtp]     = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpRecipient, setOtpRecipient]     = useState('');

  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuthStore();

  const from  = location.state?.from?.pathname || null;
  const phone = watch('phone', '');
  const email = watch('email', '');

  const getRecipient = () => {
    if (otpChannel === 'email') return email.trim();
    const p = phone.trim().replace(/\s/g, '');
    if (p.length === 10 && !p.startsWith('+')) return `+91${p}`;
    return p;
  };

  const handleChannelChange = (channel) => {
    setOtpChannel(channel);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setOtpRecipient('');
  };

  // ── Step 0: Send OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const fieldToValidate = otpChannel === 'email' ? 'email' : 'phone';
    const valid = await trigger(fieldToValidate);
    if (!valid) return;

    const recipient = getRecipient();
    setIsSendingOtp(true);
    try {
      const res = await sendOTP(recipient, 'login', otpChannel);
      setOtpSent(true);
      setOtpRecipient(recipient);

      if (res?.data?.otp) {
        toast.success(`OTP sent! Dev code: ${res.data.otp}`, { duration: 60000 });
      } else {
        toast.success(`OTP sent via ${otpChannel === 'sms' ? 'SMS' : 'email'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Step 0: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyOTP(otpRecipient, otp, 'login');
      setOtpVerified(true);
      setStep(1);
      toast.success('Verified! Enter your password.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Step 1: Submit login ─────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let res;

      if (otpVerified) {
        res = await otpLogin({
          email:         data.email,
          password:      data.password,
          otp_recipient: otpRecipient,
        });
      } else {
        // Dev fallback — skip OTP
        res = await loginUser({ email: data.email, password: data.password });
      }

      const { access_token, refresh_token } = res.data;
      localStorage.setItem('parkease_access_token', access_token);

      const userRes = await getMe();
      login(userRes.data, access_token, refresh_token);
      toast.success('Welcome back!');

      const user = userRes.data;
      if (user.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        navigate('/seeker/map', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password');
      localStorage.removeItem('parkease_access_token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-bg-primary flex items-center justify-center p-4 relative overflow-x-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <GlassCard className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
              ParkEase
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-white/60 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Verify', 'Sign In'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step
                  ? 'bg-green-500 text-white'
                  : i === step
                  ? 'bg-brand-purple text-white ring-2 ring-brand-purple/30'
                  : 'bg-white/10 text-white/40'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-white' : 'text-white/40'}`}>
                {label}
              </span>
              {i === 0 && (
                <div className={`w-6 h-px mx-1 ${step > 0 ? 'bg-green-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Step 0: OTP Verification ──────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-white/60 text-center mb-2">
                Choose how to receive your verification code
              </p>

              {/* Channel selector */}
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

              {/* Phone or Email input */}
              {otpChannel === 'sms' ? (
                <GlassInput
                  label="Mobile Number"
                  placeholder="+91XXXXXXXXXX or 10 digits"
                  {...register('phone', {
                    required: 'Phone is required',
                    pattern: {
                      value: /^\+?[1-9]\d{9,14}$/,
                      message: 'Enter a valid phone number',
                    },
                  })}
                  error={errors.phone?.message}
                  disabled={otpVerified}
                />
              ) : (
                <GlassInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                  error={errors.email?.message}
                  disabled={otpVerified}
                />
              )}

              {/* Send OTP */}
              {!otpSent && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={handleSendOTP}
                  isLoading={isSendingOtp}
                  className="w-full"
                >
                  Send OTP via {otpChannel === 'sms' ? 'SMS' : 'Email'}
                </GlassButton>
              )}

              {/* OTP entry */}
              {otpSent && !otpVerified && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <GlassInput
                        label="Enter 6-digit OTP"
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
                  <p className="text-xs text-white/40 text-center">
                    Didn&apos;t receive it?{' '}
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-brand-cyan hover:text-white transition-colors underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>
              )}

              {/* Dev mode skip */}
              <p className="text-xs text-white/25 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-white/50 underline transition-colors"
                >
                  Skip verification (dev only)
                </button>
              </p>
            </div>
          )}

          {/* ── Step 1: Email + Password ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {otpVerified && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {otpChannel === 'sms' ? 'Phone' : 'Email'} verified
                </div>
              )}

              <GlassInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                error={errors.email?.message}
              />

              <div className="relative">
                <GlassInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <GlassButton type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign In
              </GlassButton>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-white/60 mt-8">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-cyan hover:text-white transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
