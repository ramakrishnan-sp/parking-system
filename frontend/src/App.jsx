import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes (Redirect to dashboard if already logged in) */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to={`/${user.user_type}`} replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to={`/${user.user_type}`} replace /> : <Register />} 
        />

        {/* Protected Routes wrapped in DashboardLayout */}
        <Route element={<DashboardLayout />}>
          
          {/* Seeker Routes */}
          <Route element={<ProtectedRoute allowedRoles={['seeker']} />}>
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
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
