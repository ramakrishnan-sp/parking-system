import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      
      login: (userData, access, refresh) => {
        localStorage.setItem('parkease_access_token', access);
        localStorage.setItem('parkease_refresh_token', refresh);
        sessionStorage.setItem('parkease_session_active', 'true');
        set({ user: userData, accessToken: access, refreshToken: refresh });
      },
      
      logout: () => {
        localStorage.removeItem('parkease_access_token');
        localStorage.removeItem('parkease_refresh_token');
        sessionStorage.removeItem('parkease_session_active');
        set({ user: null, accessToken: null, refreshToken: null });
      },
      
      updateTokens: (access, refresh) => {
        localStorage.setItem('parkease_access_token', access);
        if (refresh) localStorage.setItem('parkease_refresh_token', refresh);
        set((state) => ({ 
          accessToken: access, 
          refreshToken: refresh || state.refreshToken 
        }));
      },
      
      refreshUser: (userData) => {
        set({ user: userData });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),

      // ── Computed role helpers ───────────────────────────────────────────
      // Use these everywhere instead of checking user_type directly.

      /** True if the user can book / seek parking spaces */
      isSeeker: () => {
        const user = get().user;
        if (!user) return false;
        if (user.user_type === 'admin') return true;
        // is_seeker defaults to true for all users; also allow legacy 'seeker' type
        return user.is_seeker !== false || user.user_type === 'seeker';
      },

      /** True if the user has listed at least one parking space */
      isOwner: () => {
        const user = get().user;
        if (!user) return false;
        if (user.user_type === 'admin') return true;
        return user.is_owner === true || user.user_type === 'owner';
      },

      /** True if the user is a platform admin */
      isAdmin: () => {
        const user = get().user;
        return user?.user_type === 'admin';
      },
    }),
    {
      name: 'parkease-auth',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken 
      }),
    }
  )
);
