import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { FullPageLoader } from './LoadingSpinner'

/**
 * Wraps a route with authentication + role guards.
 *
 * Usage:
 *   <ProtectedRoute>                          → any authenticated user
 *   <ProtectedRoute allowedRoles={['seeker']} → seeker only
 *   <ProtectedRoute allowedRoles={['admin']}  → admin only
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { accessToken, user, isLoading } = useAuthStore()
  const location = useLocation()

  // Still initializing / fetching user
  if (isLoading) {
    return <FullPageLoader text="Loading…" />
  }

  // Not authenticated → redirect to login (save current path)
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role check
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
