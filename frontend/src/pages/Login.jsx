import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { GlassInput } from '@/components/common/GlassInput';
import { GlassButton } from '@/components/common/GlassButton';
import { Car, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { loginUser, getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname || '/seeker/map';

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await loginUser(data);
      const { access_token, refresh_token } = res.data;
      
      // Store tokens temporarily to fetch user
      localStorage.setItem('parkease_access_token', access_token);
      
      const userRes = await getMe();
      
      login(userRes.data, access_token, refresh_token);
      toast.success('Welcome back!');
      
      if (userRes.data.user_type === 'admin') navigate('/admin');
      else if (userRes.data.user_type === 'owner') navigate('/owner');
      else navigate(from);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid email or password');
      localStorage.removeItem('parkease_access_token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-bg-primary flex items-start sm:items-center justify-center p-4 py-10 sm:py-4 relative overflow-x-hidden">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <GlassCard className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Car className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">ParkEase</span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-white/60 mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
            })}
            error={errors.email?.message}
          />

          <div className="relative">
            <GlassInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-white/40 hover:text-white/80 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <GlassButton type="submit" className="w-full mt-8" isLoading={isLoading}>
            Sign In
          </GlassButton>
        </form>

        <p className="text-center text-sm text-white/60 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-cyan hover:text-white transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};
