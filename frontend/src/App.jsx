import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import Home               from './pages/Home'
import Login              from './pages/Login'
import Register           from './pages/Register'
import ParkingMap         from './pages/ParkingMap'
import BookingPage        from './pages/BookingPage'
import BookingConfirmation from './pages/BookingConfirmation'
import OwnerDashboard     from './pages/OwnerDashboard'
import AdminDashboard     from './pages/AdminDashboard'
import Profile            from './pages/Profile'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <p className="text-gray-500 mb-6">Page not found</p>
        <a href="/" className="btn-primary">Go home</a>
      </div>
    </div>
  )
}

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">403</h1>
        <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
        <a href="/" className="btn-primary">Go home</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public */}
            <Route path="/"        element={<Home />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Seeker (and owner can also view map) */}
            <Route path="/map" element={
              <ProtectedRoute>
                <ParkingMap />
              </ProtectedRoute>
            } />

            {/* Seeker bookings */}
            <Route path="/bookings" element={
              <ProtectedRoute allowedRoles={['seeker']}>
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/booking-confirmation/:id" element={
              <ProtectedRoute allowedRoles={['seeker']}>
                <BookingConfirmation />
              </ProtectedRoute>
            } />

            {/* Owner */}
            <Route path="/owner" element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Shared authenticated */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
