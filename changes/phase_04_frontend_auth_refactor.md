# PHASE 4 — Frontend Auth Refactor (Register + Login with Firebase OTP)
# ParkEase — Authentication Modernization
# ⚠️ Phases 1, 2, and 3 must be complete before starting this phase.
# ⚠️ Do NOT change any UI component files (GlassCard, GlassButton, GlassInput,
#    GlassBadge, GlassButton, Sidebar, Topbar, DashboardLayout, StatCard,
#    EmptyState, Modal, ConfirmModal, LoadingSpinner, Skeleton, etc.)
# ⚠️ Do NOT change page layouts, CSS, or index.css.

---

## CONTEXT

You are continuing the ParkEase authentication modernization. Phases 1–3 added Firebase utilities and new backend endpoints.

In this phase you will update:
1. `frontend/src/api/auth.js` — add new API call functions
2. `frontend/src/store/authStore.js` — add computed helpers for role checking
3. `frontend/src/pages/Register.jsx` — simplified unified registration with Firebase OTP
4. `frontend/src/pages/Login.jsx` — multi-step login with Firebase OTP
5. `frontend/src/App.jsx` — fix route guards to use is_owner / is_seeker flags

Keep ALL other pages (ParkingMap, BookingPage, OwnerDashboard, AdminDashboard, Profile, BookingConfirmation) completely unchanged.

---

## STEP 1 — Update API auth module

Replace the contents of `frontend/src/api/auth.js` with:

```js
import { api } from './axios';

// ── Existing endpoints (unchanged) ───────────────────────────────────────────
export const sendOTP         = (data) => api.post('/auth/otp/send', data);
export const verifyOTP       = (data) => api.post('/auth/otp/verify', data);
export const loginUser       = (data) => api.post('/auth/login', data);
export const registerSeeker  = (formData) => api.post('/auth/register/seeker', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const registerOwner   = (formData) => api.post('/auth/register/owner', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const refreshToken    = (data) => api.post('/auth/refresh', data);
export const logoutUser      = (data) => api.post('/auth/logout', data);
export const getMe           = () => api.get('/auth/me');
export const changePassword  = (data) => api.post('/auth/change-password', data);

// ── New unified endpoints (Phase 3) ──────────────────────────────────────────

/**
 * Unified registration — no seeker/owner choice.
 * firebase_id_token is optional in dev mode.
 */
export const registerUnified = (formData) =>
  api.post('/auth/register/unified', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Login with email + password + Firebase phone ID token.
 * firebase_id_token is optional in dev mode.
 */
export const firebaseLogin = (data) => api.post('/auth/firebase/login', data);
```

---

## STEP 2 — Update Zustand auth store

Replace the contents of `frontend/src/store/authStore.js` with:

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: (userData, access, refresh) => {
        localStorage.setItem('parkease_access_token', access);
        localStorage.setItem('parkease_refresh_token', refresh);
        sessionStorage.setItem('parkease_session_active', 'true');
        set({ user: userData, accessToken: access, refreshToken: refresh });
      },

      logout: () => {
        localStorage.removeItem('parkease_access_token');
        localStorage.removeItem('parkease_refresh_token');
        sessionStorage.removeItem('parkease_session_active');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      updateTokens: (access, refresh) => {
        localStorage.setItem('parkease_access_token', access);
        if (refresh) localStorage.setItem('parkease_refresh_token', refresh);
        set((state) => ({
          accessToken: access,
          refreshToken: refresh || state.refreshToken,
        }));
      },

      refreshUser: (userData) => {
        set({ user: userData });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      // ── Computed role helpers ───────────────────────────────────────────
      // Use these everywhere instead of checking user_type directly.

      /** True if the user can book / seek parking spaces */
      isSeeker: () => {
        const user = get().user;
        if (!user) return false;
        if (user.user_type === 'admin') return true;
        // is_seeker defaults to true for all users; also allow legacy 'seeker' type
        return user.is_seeker !== false || user.user_type === 'seeker';
      },

      /** True if the user has listed at least one parking space */
      isOwner: () => {
        const user = get().user;
        if (!user) return false;
        if (user.user_type === 'admin') return true;
        return user.is_owner === true || user.user_type === 'owner';
      },

      /** True if the user is a platform admin */
      isAdmin: () => {
        const user = get().user;
        return user?.user_type === 'admin';
      },
    }),
    {
      name: 'parkease-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

---

## STEP 3 — Update ProtectedRoute to use is_owner / is_seeker

Replace the contents of `frontend/src/components/common/ProtectedRoute.jsx` with:

```jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageLoader } from '@/components/common/LoadingSpinner';

/**
 * Role values you can pass to allowedRoles:
 *   'seeker'  — checks user.is_seeker (true for all regular users by default)
 *   'owner'   — checks user.is_owner (true after listing first space)
 *   'admin'   — checks user.user_type === 'admin'
 *   'any'     — any authenticated user
 */
export const ProtectedRoute = ({ allowedRoles }) => {
  const { accessToken, user, isLoading, isSeeker, isOwner, isAdmin } = useAuthStore();
  const location = useLocation();

  if (isLoading && !user) {
    return <FullPageLoader />;
  }

  if (accessToken && !user) {
    return <FullPageLoader />;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no role restriction, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // Check role permissions using the store helpers
  const hasRole = allowedRoles.some((role) => {
    if (role === 'admin')  return isAdmin();
    if (role === 'owner')  return isOwner();
    if (role === 'seeker') return isSeeker();
    if (role === 'any')    return true;
    // Legacy: direct user_type string match for backward compat
    return user?.user_type === role;
  });

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## STEP 4 — Replace Register.jsx

Replace the entire contents of `frontend/src/pages/Register.jsx` with the following. This keeps the SAME visual structure (split panel, GlassCard, GlassButton etc.) but simplifies to a single registration type with Firebase OTP:

```jsx
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, CheckCircle2, ShieldCheck } from 'lucide-react';
import { registerUnified } from '@/api/auth';
import {
  sendFirebaseOTP,
  verifyFirebaseOTP,
  isFirebaseConfigured,
} from '@/lib/firebase';
import { toast } from 'sonner';

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm({ mode: 'onTouched' });

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [otpSent, setOtpSent]             = useState(false);
  const [otpVerified, setOtpVerified]     = useState(false);
  const [otp, setOtp]                     = useState('');
  const [isSendingOtp, setIsSendingOtp]   = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [firebaseIdToken, setFirebaseIdToken] = useState(null);
  const confirmationResultRef = useRef(null);

  const navigate  = useNavigate();
  const phone     = watch('phone');
  const firebaseOn = isFirebaseConfigured();

  // ── Send Firebase OTP ────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const valid = await trigger('phone');
    if (!valid) return;

    setIsSendingOtp(true);
    try {
      if (firebaseOn) {
        // Ensure phone is in E.164 format
        const e164Phone = phone.startsWith('+') ? phone : `+91${phone}`;
        const confirmation = await sendFirebaseOTP(e164Phone, 'recaptcha-container');
        confirmationResultRef.current = confirmation;
        setOtpSent(true);
        toast.success('OTP sent to your mobile number');
      } else {
        // Dev mode: Firebase not configured — skip OTP, auto-verify
        setOtpSent(true);
        setOtpVerified(true);
        toast.info('Dev mode: Phone verification skipped (Firebase not configured)');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Check your phone number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Verify Firebase OTP ──────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const result = await verifyFirebaseOTP(confirmationResultRef.current, otp);
      setFirebaseIdToken(result.idToken);
      setOtpVerified(true);
      toast.success('Phone number verified!');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Submit registration ──────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('full_name',          data.full_name);
      formData.append('email',              data.email);
      formData.append('password',           data.password);
      formData.append('phone',              phone.startsWith('+') ? phone : `+91${phone}`);

      if (data.residential_address) {
        formData.append('residential_address', data.residential_address);
      }
      if (firebaseIdToken) {
        formData.append('firebase_id_token', firebaseIdToken);
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

  return (
    <div className="min-h-[100svh] bg-bg-primary flex relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-3"></div>

      {/* Left Panel — hidden on mobile */}
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
          Register once and unlock both parking search and space listing — no need to choose a role upfront.
        </p>

        <div className="space-y-6">
          {[
            { n: '1', color: 'brand-purple', text: 'Create your verified account' },
            { n: '2', color: 'brand-pink',   text: 'Find nearby parking instantly' },
            { n: '3', color: 'brand-cyan',   text: 'List your space anytime to earn' },
          ].map(({ n, color, text }) => (
            <div key={n} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-${color}/20 flex items-center justify-center text-${color} font-bold`}>
                {n}
              </div>
              <p className="text-white/80">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        <GlassCard className="w-full max-w-md p-8 animate-in fade-in slide-in-from-right-8 duration-500 my-auto">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">
              ParkEase
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Create Account</h2>
          <p className="text-sm text-white/50 text-center mb-8">
            No role selection needed — you can park and list spaces with one account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Full name */}
            <GlassInput
              label="Full Name"
              placeholder="Jane Doe"
              {...register('full_name', { required: 'Full name is required' })}
              error={errors.full_name?.message}
            />

            {/* Email */}
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
              error={errors.email?.message}
            />

            {/* Password */}
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

            {/* Residential address (optional) */}
            <GlassInput
              label="Residential Address (optional)"
              placeholder="Your home address"
              {...register('residential_address')}
            />

            {/* Phone + OTP */}
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <GlassInput
                    label="Mobile Number"
                    placeholder="+91XXXXXXXXXX"
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: {
                        value: /^\+?[1-9]\d{9,14}$/,
                        message: 'Enter a valid phone number (e.g. +919876543210)',
                      },
                    })}
                    error={errors.phone?.message}
                    disabled={otpVerified}
                  />
                </div>
                {!otpVerified && (
                  <GlassButton
                    type="button"
                    variant="secondary"
                    onClick={handleSendOTP}
                    isLoading={isSendingOtp}
                    disabled={otpSent && firebaseOn}
                    className="shrink-0 mb-0.5"
                  >
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </GlassButton>
                )}
              </div>

              {/* OTP input */}
              {otpSent && !otpVerified && firebaseOn && (
                <div className="flex gap-3 items-end animate-in fade-in slide-in-from-top-2">
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
              )}

              {/* Verified badge */}
              {otpVerified && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Phone number verified
                </div>
              )}
            </div>

            {/* Submit */}
            <GlassButton
              type="submit"
              className="w-full mt-6"
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
```

---

## STEP 5 — Replace Login.jsx

Replace the entire contents of `frontend/src/pages/Login.jsx` with a multi-step login flow that keeps the same GlassCard visual design:

```jsx
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { firebaseLogin, loginUser, getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import {
  sendFirebaseOTP,
  verifyFirebaseOTP,
  isFirebaseConfigured,
} from '@/lib/firebase';
import { toast } from 'sonner';

// Step labels shown to the user
const STEPS = ['Phone Verify', 'Sign In'];

export default function Login() {
  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm({ mode: 'onTouched' });
  const [showPassword, setShowPassword]     = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [step, setStep]                     = useState(0);   // 0 = phone, 1 = password
  const [otpSent, setOtpSent]               = useState(false);
  const [otpVerified, setOtpVerified]       = useState(false);
  const [otp, setOtp]                       = useState('');
  const [isSendingOtp, setIsSendingOtp]     = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [firebaseIdToken, setFirebaseIdToken] = useState(null);
  const confirmationResultRef = useRef(null);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuthStore();

  const from       = location.state?.from?.pathname || null;
  const phone      = watch('phone');
  const firebaseOn = isFirebaseConfigured();

  // ── Step 0: Send OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const valid = await trigger('phone');
    if (!valid) return;

    setIsSendingOtp(true);
    try {
      if (firebaseOn) {
        const e164Phone = phone.startsWith('+') ? phone : `+91${phone}`;
        const confirmation = await sendFirebaseOTP(e164Phone, 'recaptcha-container');
        confirmationResultRef.current = confirmation;
        setOtpSent(true);
        toast.success('OTP sent to your mobile number');
      } else {
        // Dev mode: skip Firebase, go straight to password step
        setOtpVerified(true);
        setStep(1);
        toast.info('Dev mode: Phone verification skipped');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
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
      const result = await verifyFirebaseOTP(confirmationResultRef.current, otp);
      setFirebaseIdToken(result.idToken);
      setOtpVerified(true);
      setStep(1);
      toast.success('Phone verified — enter your password');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Step 1: Submit login ─────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let res;

      if (firebaseOn && firebaseIdToken) {
        // Full Firebase-verified login
        res = await firebaseLogin({
          email:              data.email,
          password:           data.password,
          firebase_id_token:  firebaseIdToken,
        });
      } else {
        // Dev mode: standard login without Firebase token
        res = await loginUser({
          email:    data.email,
          password: data.password,
        });
      }

      const { access_token, refresh_token } = res.data;

      // Store tokens temporarily so getMe can use them
      localStorage.setItem('parkease_access_token', access_token);
      const userRes = await getMe();
      login(userRes.data, access_token, refresh_token);
      toast.success('Welcome back!');

      // Navigate based on role
      const user = userRes.data;
      if (user.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // All regular users start on the map
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
      {/* Background blobs */}
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

        {/* Step indicator (only shown when Firebase is on) */}
        {firebaseOn && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
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
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${i < step ? 'bg-green-500' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── STEP 0: Phone verification ─────────────────────────── */}
          {step === 0 && firebaseOn && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-sm text-white/60 text-center mb-4">
                Verify your phone number to continue
              </p>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <GlassInput
                    label="Mobile Number"
                    placeholder="+91XXXXXXXXXX"
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: {
                        value: /^\+?[1-9]\d{9,14}$/,
                        message: 'Enter a valid phone (e.g. +919876543210)',
                      },
                    })}
                    error={errors.phone?.message}
                    disabled={otpVerified}
                  />
                </div>
                {!otpSent && (
                  <GlassButton
                    type="button"
                    variant="secondary"
                    onClick={handleSendOTP}
                    isLoading={isSendingOtp}
                    className="shrink-0 mb-0.5"
                  >
                    Send OTP
                  </GlassButton>
                )}
              </div>

              {/* OTP input */}
              {otpSent && !otpVerified && (
                <div className="flex gap-3 items-end animate-in fade-in slide-in-from-top-2">
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
              )}

              {/* Resend option */}
              {otpSent && !otpVerified && (
                <p className="text-xs text-white/40 text-center">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-brand-cyan hover:text-white transition-colors"
                  >
                    Resend OTP
                  </button>
                </p>
              )}
            </div>
          )}

          {/* ── STEP 1: Email + Password (also the only step in dev mode) ─ */}
          {(step === 1 || !firebaseOn) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {otpVerified && firebaseOn && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Phone verified
                </div>
              )}

              <GlassInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
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

              <GlassButton type="submit" className="w-full mt-4" isLoading={isLoading}>
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
```

---

## STEP 6 — Update App.jsx routes

In `frontend/src/App.jsx`, update route configurations so that:
1. After login, `user_type='user'` navigates to `/seeker/map` (not a broken role route)
2. Owner routes allow `is_owner` users (not just `user_type='owner'`)

Find the existing route redirect logic (after login in Login.jsx, already updated in Step 5 above).

In `App.jsx`, update the `allowedRoles` arrays on routes:

```jsx
// Seeker routes — allow all regular users (is_seeker defaults to true)
<Route element={<ProtectedRoute allowedRoles={['seeker', 'any']} />}>
  <Route path="/seeker" element={<Navigate to="/seeker/map" replace />} />
  <Route path="/seeker/map" element={<ParkingMap />} />
  <Route path="/seeker/bookings" element={<BookingPage />} />
  <Route path="/seeker/booking/:id" element={<BookingConfirmation />} />
</Route>

// Owner routes — allow users with is_owner=true
<Route element={<ProtectedRoute allowedRoles={['owner']} />}>
  <Route path="/owner" element={<OwnerDashboard />} />
</Route>

// Admin routes — admin only
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>

// Shared authenticated routes — any logged in user
<Route element={<ProtectedRoute allowedRoles={['any']} />}>
  <Route path="/profile" element={<Profile />} />
</Route>
```

Also add an `/unauthorized` route if it doesn't exist:
```jsx
<Route path="/unauthorized" element={
  <div className="min-h-[100svh] bg-bg-primary flex items-center justify-center text-white">
    <div className="text-center space-y-4">
      <p className="text-6xl font-bold text-white/20">403</p>
      <p className="text-white/60">You don&apos;t have permission to view this page.</p>
      <Link to="/seeker/map" className="inline-block px-4 py-2 bg-brand-purple text-white rounded-xl text-sm">
        Go Home
      </Link>
    </div>
  </div>
} />
```

---

## VERIFICATION CHECKLIST

Before marking Phase 4 complete, confirm ALL of these:

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] `/register` page loads and shows the simplified single-form registration (no seeker/owner switcher)
- [ ] `/login` page loads — shows phone step first (if Firebase configured) or goes straight to email/password (dev mode)
- [ ] In **dev mode** (no Firebase env vars): registration works without OTP, login works without Firebase token
- [ ] After login, admin user → `/admin`, all other users → `/seeker/map`
- [ ] `/seeker/map` is accessible to users with `user_type='user'` (not just 'seeker')
- [ ] `/owner` is accessible to users with `is_owner=true`
- [ ] Logging out clears tokens and redirects to `/login`
- [ ] No existing UI components were modified (GlassCard, GlassButton, GlassInput, Sidebar, Topbar etc.)
- [ ] No other pages (ParkingMap, BookingPage, OwnerDashboard, AdminDashboard, Profile) were modified
- [ ] `authStore.js` exports `isSeeker()`, `isOwner()`, `isAdmin()` helper functions
- [ ] `ProtectedRoute` uses `isOwner()` and `isSeeker()` store helpers

---

## IMPORTANT NOTES FOR NEXT PHASES

- In Firebase-configured environments: the Login flow is 2 steps (phone OTP → email+password).
- In dev mode: login is 1 step (email+password only) — Firebase token is omitted.
- The `firebaseIdToken` stored in React state is short-lived and used only during the login flow — it is NOT persisted.
- `is_owner` is still `false` for newly registered users — they become owners in Phase 5 when they set up owner profile or list a space.
- The Sidebar navigation links still work correctly because they route based on `is_owner` (checked via `isOwner()` store helper) not `user_type`.
