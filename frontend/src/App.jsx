import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSessionInit } from '@/hooks/useSessionInit';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/common/DashboardLayout';
import { FullPageLoader } from '@/components/common/LoadingSpinner';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ParkingMap = lazy(() => import('@/pages/ParkingMap'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const BookingConfirmation = lazy(() => import('@/pages/BookingConfirmation'));
const OwnerDashboard = lazy(() => import('@/pages/OwnerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Profile = lazy(() => import('@/pages/Profile'));

export default function App() {
  useSessionInit();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const authedHome = user?.user_type === 'admin' ? '/admin' : '/seeker/map';

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes (Redirect to dashboard if already logged in) */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to={authedHome} replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to={authedHome} replace /> : <Register />} 
        />

        <Route
          path="/unauthorized"
          element={
            <div className="min-h-[100svh] bg-bg-primary flex items-center justify-center text-white">
              <div className="text-center space-y-4">
                <p className="text-6xl font-bold text-white/20">403</p>
                <p className="text-white/60">You don&apos;t have permission to view this page.</p>
                <Link
                  to="/seeker/map"
                  className="inline-block px-4 py-2 bg-brand-purple text-white rounded-xl text-sm"
                >
                  Go Home
                </Link>
              </div>
            </div>
          }
        />

        {/* Protected Routes wrapped in DashboardLayout */}
        <Route element={<DashboardLayout />}>
          
          {/* Seeker Routes */}
          <Route element={<ProtectedRoute allowedRoles={['seeker', 'any']} />}>
            <Route path="/seeker" element={<Navigate to="/seeker/map" replace />} />
            <Route path="/seeker/map" element={<ParkingMap />} />
            <Route path="/seeker/bookings" element={<BookingPage />} />
            <Route path="/seeker/booking/:id" element={<BookingConfirmation />} />
          </Route>

          {/* Owner Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Shared Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['any']} />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
