import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Car, Building2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { registerSeeker, registerOwner, sendOTP, verifyOTP } from '../api/auth'

const VEHICLE_TYPES = ['car', 'bike', 'ev']
const PROPERTY_TYPES = ['house', 'apartment', 'shop', 'office']

export default function Register() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('seeker')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm()

  const handleSendOtp = async () => {
    const phone = getValues('phone')
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    setOtpLoading(true)
    try {
      const res = await sendOTP(phone)
      setOtpSent(true)
      if (res.data?.otp) {
        toast.success(`OTP sent! Your OTP is: ${res.data.otp}`, { duration: 20000 })
      } else {
        toast.success('OTP sent to your mobile number')
      }
    } catch {} finally { setOtpLoading(false) }
  }

  const handleVerifyOtp = async () => {
    const phone = getValues('phone')
    setOtpLoading(true)
    try {
      await verifyOTP(phone, otpValue)
      setOtpVerified(true)
      toast.success('Phone number verified!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP')
    } finally { setOtpLoading(false) }
  }

  const onSubmit = async (data) => {
    if (!otpVerified) {
      toast.error('Please verify your phone number first')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof FileList) {
          if (value[0]) fd.append(key, value[0])
        } else if (value !== undefined && value !== '') {
          fd.append(key, value)
        }
      })

      fd.set('phone', `+91${getValues('phone')}`)

      if (tab === 'seeker') {
        await registerSeeker(fd)
      } else {
        await registerOwner(fd)
      }

      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const switchTab = (t) => {
    setTab(t)
    reset()
    setOtpSent(false)
    setOtpVerified(false)
    setOtpValue('')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel (desktop only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-sidebar-gradient flex-col items-center justify-center p-12 text-white">
        <div className="size-16 rounded-2xl bg-white/20 grid place-items-center mb-6">
          <Car className="size-8" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-center">Join ParkEase</h2>
        <p className="text-white/80 text-center leading-relaxed">
          Find nearby parking in seconds, or earn by listing your unused parking space.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-xs">
          {[
            ['2,400+', 'Parking spaces'],
            ['15,000+', 'Happy drivers'],
            ['₹12M+', 'Total saved'],
            ['4.8★', 'Average rating'],
          ].map(([val, lbl]) => (
            <div key={lbl} className="rounded-xl bg-white/10 p-3 text-center">
              <p className="font-bold text-lg">{val}</p>
              <p className="text-xs text-white/70 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 overflow-auto">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="size-9 rounded-xl bg-brand grid place-items-center">
              <Car className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold">ParkEase</span>
          </div>

          <div className="rounded-2xl bg-card p-6 ring-1 ring-border shadow-card animate-slide-up">
            <h1 className="text-2xl font-semibold mb-1">Create account</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Join and start parking smarter.
            </p>

            {/* Tab switcher */}
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              {[
                { key: 'seeker', label: 'Seeker', icon: Car },
                { key: 'owner',  label: 'Owner',  icon: Building2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === key
                      ? 'bg-card shadow text-brand'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />{label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Full name */}
              <Field label="Full name" error={errors.full_name?.message}>
                <input
                  {...register('full_name', { required: 'Full name is required' })}
                  className={inputCls(errors.full_name)}
                  placeholder="Jane Doe"
                />
              </Field>

              {/* Email */}
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  type="email"
                  className={inputCls(errors.email)}
                  placeholder="you@example.com"
                />
              </Field>

              {/* Password */}
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Min 8 characters' },
                    })}
                    type={showPwd ? 'text' : 'password'}
                    className={`${inputCls(errors.password)} pr-10`}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {/* Phone + OTP */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mobile number</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      +91
                    </span>
                    <input
                      {...register('phone', { required: 'Phone is required', pattern: { value: /^\d{10}$/, message: '10 digits required' } })}
                      type="tel"
                      maxLength={10}
                      disabled={otpVerified}
                      className={`${inputCls(errors.phone)} pl-12`}
                      placeholder="10-digit number"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {otpLoading ? '…' : otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                  {otpVerified && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium px-2">
                      <CheckCircle className="size-4" /> Verified
                    </span>
                  )}
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              {/* OTP input */}
              {otpSent && !otpVerified && (
                <div className="space-y-1.5 animate-slide-up">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <div className="flex gap-2">
                    <input
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      maxLength={6}
                      className="flex-1 h-10 rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 tracking-widest text-center font-mono"
                      placeholder="• • • • • •"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpValue.length < 6}
                      className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Residential address */}
              <Field label="Residential address" error={errors.residential_address?.message}>
                <input
                  {...register('residential_address', { required: 'Address is required' })}
                  className={inputCls(errors.residential_address)}
                  placeholder="Your home address"
                />
              </Field>

              {/* Aadhaar */}
              <Field label="Aadhaar number" error={errors.aadhaar_number?.message}>
                <input
                  {...register('aadhaar_number', {
                    required: 'Aadhaar is required',
                    pattern: { value: /^\d{12}$/, message: '12-digit Aadhaar required' },
                  })}
                  maxLength={12}
                  className={inputCls(errors.aadhaar_number)}
                  placeholder="12-digit Aadhaar"
                />
              </Field>

              {/* Aadhaar proof */}
              <Field label="Aadhaar proof (image / PDF)" error={errors.aadhaar_proof?.message}>
                <input
                  {...register('aadhaar_proof', { required: 'Required' })}
                  type="file"
                  accept="image/*,application/pdf"
                  className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
                />
              </Field>

              {/* ── Seeker-only fields ── */}
              {tab === 'seeker' && (
                <>
                  <Field label="Driving license number" error={errors.driving_license_number?.message}>
                    <input
                      {...register('driving_license_number', { required: 'Required' })}
                      className={inputCls(errors.driving_license_number)}
                      placeholder="e.g. TN0120210012345"
                    />
                  </Field>

                  <Field label="License proof (image / PDF)" error={errors.license_proof?.message}>
                    <input
                      {...register('license_proof', { required: 'Required' })}
                      type="file"
                      accept="image/*,application/pdf"
                      className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Vehicle number" error={errors.vehicle_number?.message}>
                      <input
                        {...register('vehicle_number', { required: 'Required' })}
                        className={inputCls(errors.vehicle_number)}
                        placeholder="TN12AB1234"
                      />
                    </Field>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Vehicle type</label>
                      <select
                        {...register('vehicle_type', { required: 'Required' })}
                        className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
                      >
                        <option value="">Select…</option>
                        {VEHICLE_TYPES.map((v) => (
                          <option key={v} value={v}>{v.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── Owner-only fields ── */}
              {tab === 'owner' && (
                <>
                  <Field label="Property address" error={errors.property_address?.message}>
                    <input
                      {...register('property_address', { required: 'Required' })}
                      className={inputCls(errors.property_address)}
                      placeholder="Address of your parking space"
                    />
                  </Field>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Property type</label>
                    <select
                      {...register('property_type', { required: 'Required' })}
                      className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
                    >
                      <option value="">Select…</option>
                      {PROPERTY_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field label="Govt. ID proof (image / PDF)" error={errors.govt_id_proof?.message}>
                    <input
                      {...register('govt_id_proof', { required: 'Required' })}
                      type="file"
                      accept="image/*,application/pdf"
                      className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand/10 file:text-brand file:text-xs file:font-medium"
                    />
                  </Field>
                </>
              )}

              {/* Profile photo (optional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Profile photo <span className="text-xs">(optional)</span>
                </label>
                <input
                  {...register('profile_photo')}
                  type="file"
                  accept="image/*"
                  className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:text-xs file:font-medium"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading && (
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper sub-components ─────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return `h-10 w-full rounded-md bg-background ring-1 ${
    error ? 'ring-destructive' : 'ring-border'
  } px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all`
}
