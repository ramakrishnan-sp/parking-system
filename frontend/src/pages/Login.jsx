import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Car } from 'lucide-react'
import { toast } from 'sonner'
import { loginUser } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginUser(data)
      await login(res.data)

      toast.success('Welcome back!')

      // Redirect to original page or role default
      const from = location.state?.from?.pathname
      const userType = res.data.user_type

      if (from && from !== '/login') {
        navigate(from, { replace: true })
        return
      }

      if (userType === 'admin')       navigate('/admin',  { replace: true })
      else if (userType === 'owner')  navigate('/owner',  { replace: true })
      else                            navigate('/map',    { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-10 rounded-xl bg-brand grid place-items-center">
            <Car className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">ParkEase</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card p-7 ring-1 ring-border shadow-card animate-slide-up">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Welcome back. Enter your credentials.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                })}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-md bg-background ring-1 ring-border px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
