import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, accessToken } = useAuthStore()
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && user && !roles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
