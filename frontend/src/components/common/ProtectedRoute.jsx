import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageLoader } from '@/components/common/LoadingSpinner';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { accessToken, user, isLoading } = useAuthStore();
  const location = useLocation();

  // Avoid a totally blank screen while we bootstrap the session.
  // If we already have a user in state (e.g. right after login), don't block rendering.
  if (isLoading && !user) {
    return <FullPageLoader />;
  }

  // If we're "authenticated" by token but user isn't loaded yet,
  // wait instead of rendering nested routes (prevents redirect churn).
  if (accessToken && !user) {
    return <FullPageLoader />;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
