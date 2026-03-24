import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageLoader } from '@/components/common/LoadingSpinner';

/**
 * Role values you can pass to allowedRoles:
 *   'seeker'  — checks user.is_seeker (true for all regular users by default)
 *   'owner'   — checks user.is_owner (true after listing first space)
 *   'admin'   — checks user.user_type === 'admin'
 *   'any'     — any authenticated user
 */

export const ProtectedRoute = ({ allowedRoles }) => {
  const { accessToken, user, isLoading, isSeeker, isOwner, isAdmin } = useAuthStore();
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

  // If no role restriction, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // Check role permissions using the store helpers
  const hasRole = allowedRoles.some((role) => {
    if (role === 'admin')  return isAdmin();
    if (role === 'owner')  return isOwner();
    if (role === 'seeker') return isSeeker();
    if (role === 'any')    return true;
    // Legacy: direct user_type string match for backward compat
    return user?.user_type === role;
  });

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
