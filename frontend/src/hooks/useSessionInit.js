import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Runs once on app boot.
 * If we have tokens but the session flag is missing (new browser session / tab),
 * attempt a silent token refresh. If it fails, force logout.
 * Also listens for the force-logout event fired by the Axios interceptor.
 */
export function useSessionInit() {
  const { accessToken, updateTokens, logout, refreshUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const sessionActive = sessionStorage.getItem('parkease_session_active')

    if (accessToken && !sessionActive) {
      // New session: try to refresh silently
      const rt = localStorage.getItem('parkease_refresh_token')
      if (!rt) {
        logout()
        return
      }

      axios
        .post(`${API_URL}/api/v1/auth/refresh`, { refresh_token: rt })
        .then(({ data }) => {
          updateTokens(data.access_token, data.refresh_token)
          sessionStorage.setItem('parkease_session_active', '1')
          refreshUser()
        })
        .catch(() => {
          logout()
          navigate('/login', { replace: true })
        })
    } else if (accessToken && sessionActive) {
      // Existing session: just re-fetch user to ensure it's fresh
      refreshUser()
    }

    // Listen for force-logout events from axios interceptor
    const handleForceLogout = () => {
      logout()
      navigate('/login', { replace: true })
    }

    // Listen for token refresh events from axios interceptor
    const handleTokenRefreshed = (e) => {
      updateTokens(e.detail.access_token, e.detail.refresh_token)
    }

    window.addEventListener('parkease:force-logout', handleForceLogout)
    window.addEventListener('parkease:token-refreshed', handleTokenRefreshed)

    return () => {
      window.removeEventListener('parkease:force-logout', handleForceLogout)
      window.removeEventListener('parkease:token-refreshed', handleTokenRefreshed)
    }
  }, []) // Intentionally empty — runs only once on mount
}
