import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe, logoutUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useSessionInit = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const navigate = useNavigate();
  const lastInitializedTokenRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    const initSession = async () => {
      if (!accessToken) {
        lastInitializedTokenRef.current = null;
        return;
      }

      // If user is already in state (e.g. right after login), don't refetch on every token change.
      if (user) {
        lastInitializedTokenRef.current = accessToken;
        return;
      }

      // In dev StrictMode/effect re-runs, avoid re-initializing endlessly.
      if (lastInitializedTokenRef.current === accessToken) return;
      lastInitializedTokenRef.current = accessToken;

      setLoading(true);
      try {
        const { data } = await getMe();
        if (!disposed) refreshUser(data);
      } catch (error) {
        // Handled by interceptor or force-logout
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    initSession();

    const handleForceLogout = async () => {
      if (refreshToken) {
        try {
          await logoutUser({ refresh_token: refreshToken });
        } catch (e) {
          // Ignore
        }
      }
      logout();
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    };

    const handleTokenRefreshed = (e) => {
      // Tokens updated in store via interceptor, we could refetch user if needed
    };

    window.addEventListener('force-logout', handleForceLogout);
    window.addEventListener('token-refreshed', handleTokenRefreshed);

    return () => {
      disposed = true;
      window.removeEventListener('force-logout', handleForceLogout);
      window.removeEventListener('token-refreshed', handleTokenRefreshed);
    };
  }, [accessToken, refreshToken, user, logout, refreshUser, setLoading, navigate]);
};
