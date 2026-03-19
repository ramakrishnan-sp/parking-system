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

      setTokens: (access, refresh) => {
        localStorage.setItem('access_token',  access)
        localStorage.setItem('refresh_token', refresh)
        set({ accessToken: access, refreshToken: refresh })
      },

      setUser: (user) => set({ user }),

      login: async (tokenData) => {
        const { access_token, refresh_token, user_type, user_id } = tokenData
        localStorage.setItem('access_token',  access_token)
        localStorage.setItem('refresh_token', refresh_token)
        set({ accessToken: access_token, refreshToken: refresh_token })

        // Fetch full profile
        try {
          const { data } = await getMe()
          set({ user: data })
        } catch {
          set({ user: { id: user_id, user_type } })
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refreshUser: async () => {
        set({ isLoading: true })
        try {
          const { data } = await getMe()
          set({ user: data })
        } catch {
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },

      isAuthenticated: () => !!get().accessToken,
      userType: () => get().user?.user_type,
    }),
    {
      name: 'parkease-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)

export default useAuthStore
