import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMe } from '../api/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      // ── Called after successful login ──────────────────
      login: async (tokenData) => {
        const { access_token, refresh_token } = tokenData

        // Store tokens in localStorage
        localStorage.setItem('parkease_access_token', access_token)
        localStorage.setItem('parkease_refresh_token', refresh_token)

        // Set session flag (cleared on browser close)
        sessionStorage.setItem('parkease_session_active', '1')

        set({ accessToken: access_token, refreshToken: refresh_token, isLoading: true })

        // Fetch full user profile
        try {
          const { data } = await getMe()
          set({ user: data, isLoading: false })
        } catch {
          set({ user: null, isLoading: false })
        }
      },

      // ── Called on logout ───────────────────────────────
      logout: () => {
        localStorage.removeItem('parkease_access_token')
        localStorage.removeItem('parkease_refresh_token')
        sessionStorage.removeItem('parkease_session_active')
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false })
      },

      // ── Update user object directly ────────────────────
      setUser: (user) => set({ user }),

      // ── Called after token refresh event ──────────────
      updateTokens: (access_token, refresh_token) => {
        localStorage.setItem('parkease_access_token', access_token)
        localStorage.setItem('parkease_refresh_token', refresh_token)
        set({ accessToken: access_token, refreshToken: refresh_token })
      },

      // ── Re-fetch user from API ─────────────────────────
      refreshUser: async () => {
        set({ isLoading: true })
        try {
          const { data } = await getMe()
          set({ user: data, isLoading: false })
        } catch {
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Derived helpers ────────────────────────────────
      isAuthenticated: () => !!get().accessToken,
      userType: () => get().user?.user_type ?? null,
      isAdmin: () => get().user?.user_type === 'admin',
      isOwner: () => get().user?.user_type === 'owner',
      isSeeker: () => get().user?.user_type === 'seeker',
    }),
    {
      name: 'parkease-auth',
      // Only persist tokens + user, not loading state
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)

export default useAuthStore
