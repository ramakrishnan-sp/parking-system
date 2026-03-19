import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Car, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerSeeker, registerOwner, sendOTP as sendOtp, verifyOTP as verifyOtp } from '../api/auth'
import useAuthStore from '../store/authStore'

const TABS = [
  { key: 'seeker', label: 'Seeker', icon: Car,       desc: 'I need to park' },
  { key: 'owner',  label: 'Owner',  icon: Building2, desc: 'I own a space' },
]

const VEHICLE_TYPES = ['car', 'bike', 'ev', 'suv', 'van', 'truck']
const PROPERTY_TYPES = ['house', 'apartment', 'shop', 'office', 'basement', 'open_ground', 'covered']

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [tab, setTab] = useState('seeker')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  // OTP state
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const { register, handleSubmit, getValues, reset, formState: { errors } } = useForm()

  const handleSendOtp = async () => {
    const ph = getValues('phone') || phone
    if (!/^\d{10}$/.test(ph)) { toast.error('Enter a valid 10-digit phone number'); return }
    setOtpLoading(true)
    try {
      const res = await sendOtp(ph)
      setPhone(ph)
      setOtpSent(true)
      if (res.data?.otp) {
        toast.success(`OTP sent! Your OTP is: ${res.data.otp}`, { duration: 15000 })
      } else {
        toast.success('OTP sent to your phone!')
      }
    } catch {} finally { setOtpLoading(false) }
  }

  const handleVerifyOtp = async () => {
    setOtpLoading(true)
    try {
      await verifyOtp(phone, otp)
      setOtpVerified(true)
      toast.success('Phone verified!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP')
    } finally { setOtpLoading(false) }
  }

  const onSubmit = async (data) => {
    if (!otpVerified) { toast.error('Please verify your phone number first'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v instanceof FileList) { if (v[0]) fd.append(k, v[0]) }
        else if (v !== undefined && v !== '') fd.append(k, v)
      })
      fd.set('phone', phone)
      const res = tab === 'seeker' ? await registerSeeker(fd) : await registerOwner(fd)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const switchTab = (t) => { setTab(t); reset(); setOtpSent(false); setOtpVerified(false); setPhone('') }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="card shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Join ParkEase today</p>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Common fields ── */}
            <div>
              <label className="label">Full name</label>
              <input {...register('full_name', { required: true })} className="input" placeholder="John Doe" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email', { required: true, pattern: /\S+@\S+\.\S+/ })} type="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">Valid email required</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: true, minLength: 8 })}
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">Min. 8 characters required</p>}
            </div>

            {/* Phone + OTP */}
            <div>
              <label className="label">Mobile number</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+91</span>
                  <input
                    {...register('phone', { required: true })}
                    type="tel"
                    className="input pl-12"
                    placeholder="10-digit number"
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpVerified}
                  />
                </div>
                {!otpVerified && (
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading} className="btn-outline whitespace-nowrap">
                    {otpLoading ? '…' : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
                {otpVerified && <span className="flex items-center text-green-600 text-sm font-medium">Verified ✓</span>}
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div>
                <label className="label">Enter OTP</label>
                <div className="flex gap-2">
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} className="input" placeholder="6-digit OTP" maxLength={6} />
                  <button type="button" onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 6} className="btn-primary whitespace-nowrap">
                    Verify
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="label">Residential address</label>
              <input {...register('residential_address', { required: true })} className="input" placeholder="Your home address" />
              {errors.residential_address && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>

            <div>
              <label className="label">Aadhaar number</label>
              <input {...register('aadhaar_number', { required: true, pattern: /^\d{12}$/ })} className="input" placeholder="12-digit Aadhaar" maxLength={12} />
              {errors.aadhaar_number && <p className="text-red-500 text-xs mt-1">12-digit Aadhaar required</p>}
            </div>

            <div>
              <label className="label">Aadhaar proof (image / PDF)</label>
              <input {...register('aadhaar_proof', { required: true })} type="file" accept="image/*,application/pdf" className="input text-sm" />
              {errors.aadhaar_proof && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>

            {/* ── Seeker-only fields ── */}
            {tab === 'seeker' && (
              <>
                <div>
                  <label className="label">Driving license number</label>
                  <input {...register('driving_license_number', { required: true })} className="input" placeholder="e.g. MH0120210012345" />
                  {errors.driving_license_number && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>

                <div>
                  <label className="label">License proof (image / PDF)</label>
                  <input {...register('license_proof', { required: true })} type="file" accept="image/*,application/pdf" className="input text-sm" />
                  {errors.license_proof && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vehicle number</label>
                    <input {...register('vehicle_number', { required: true })} className="input" placeholder="e.g. MH12AB1234" />
                    {errors.vehicle_number && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className="label">Vehicle type</label>
                    <select {...register('vehicle_type', { required: true })} className="input">
                      <option value="">Select…</option>
                      {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                    </select>
                    {errors.vehicle_type && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                </div>
              </>
            )}

            {/* ── Owner-only fields ── */}
            {tab === 'owner' && (
              <>
                <div>
                  <label className="label">Property address</label>
                  <input {...register('property_address', { required: true })} className="input" placeholder="Address of the parking property" />
                  {errors.property_address && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>

                <div>
                  <label className="label">Property type</label>
                  <select {...register('property_type', { required: true })} className="input">
                    <option value="">Select…</option>
                    {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                  {errors.property_type && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>

                <div>
                  <label className="label">Govt. ID proof (image / PDF)</label>
                  <input {...register('govt_id_proof', { required: true })} type="file" accept="image/*,application/pdf" className="input text-sm" />
                  {errors.govt_id_proof && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
              </>
            )}

            {/* Profile photo */}
            <div>
              <label className="label">Profile photo (optional)</label>
              <input {...register('profile_photo')} type="file" accept="image/*" className="input text-sm" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
