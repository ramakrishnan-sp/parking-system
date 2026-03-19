import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardLayout from './components/common/DashboardLayout'
import { useSessionInit } from './hooks/useSessionInit'
import { FullPageLoader } from './components/common/LoadingSpinner'

// Eagerly loaded pages (small, auth-critical)
import Home               from './pages/Home'
import Login              from './pages/Login'
import Register           from './pages/Register'
import BookingPage        from './pages/BookingPage'
import BookingConfirmation from './pages/BookingConfirmation'
import OwnerDashboard     from './pages/OwnerDashboard'
import Profile            from './pages/Profile'

// Lazy-loaded heavy pages (recharts, leaflet)
const ParkingMap     = lazy(() => import('./pages/ParkingMap'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))


function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">403</p>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
        <a href="/" className="inline-block px-4 py-2 bg-brand text-white rounded-lg text-sm">
          Go home
        </a>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <p className="text-muted-foreground">Page not found.</p>
        <a href="/" className="inline-block px-4 py-2 bg-brand text-white rounded-lg text-sm">
          Go home
        </a>
      </div>
    </div>
  )
}

// Inner component so useSessionInit can use router hooks
function AppRoutes() {
  useSessionInit()

  useEffect(() => {
    const saved = localStorage.getItem('parkease-brand') || 'purple'
    document.documentElement.setAttribute('data-brand', saved)
  }, [])

  return (
    <Suspense fallback={<FullPageLoader text="Loading…" />}>
      <Routes>
        {/* Public routes — no DashboardLayout */}
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Seeker + Owner: map */}
        <Route path="/map" element={
          <ProtectedRoute allowedRoles={['seeker', 'owner']}>
            <DashboardLayout><ParkingMap /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Seeker only */}
        <Route path="/bookings" element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <DashboardLayout><BookingPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/booking-confirmation/:id" element={
          <ProtectedRoute allowedRoles={['seeker']}>
            <DashboardLayout><BookingConfirmation /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Owner only */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <DashboardLayout><OwnerDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout><AdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* All authenticated */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout><Profile /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
