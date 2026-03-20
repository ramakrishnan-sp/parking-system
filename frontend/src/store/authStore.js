import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
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
