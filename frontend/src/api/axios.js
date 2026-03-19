import axios from 'axios'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parkease_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: handle 401 + token refresh ─────
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until token is refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('parkease_refresh_token')
      if (!refreshToken) {
        // No refresh token → force logout
        _forceLogout()
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        // Store new tokens
        localStorage.setItem('parkease_access_token', data.access_token)
        localStorage.setItem('parkease_refresh_token', data.refresh_token)
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`

        processQueue(null, data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`

        // Update store without causing a re-render loop
        window.dispatchEvent(new CustomEvent('parkease:token-refreshed', { detail: data }))

        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        _forceLogout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // Status-aware error handling
    if (err.response) {
      const status = err.response.status
      const detail = err.response.data?.detail

      // Never show toast for 401 (handled by token refresh / logout)
      if (status === 401) return Promise.reject(err)

      // 422 Validation errors — extract per-field messages
      if (status === 422) {
        const errors = err.response.data?.detail
        if (Array.isArray(errors)) {
          errors.forEach((e) => {
            const field = e.loc?.[e.loc.length - 1] ?? 'Field'
            toast.error(`${field}: ${e.msg}`)
          })
          return Promise.reject(err)
        }
      }

      // 403 — Permission denied
      if (status === 403) {
        toast.error('You do not have permission to perform this action.')
        return Promise.reject(err)
      }

      // 404 — Not found (caller handles this silently)
      if (status === 404) return Promise.reject(err)

      // 429 — Rate limited
      if (status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.')
        return Promise.reject(err)
      }

      // 500+ — Server errors
      if (status >= 500) {
        toast.error('A server error occurred. Please try again later.')
        return Promise.reject(err)
      }

      // Other errors — show detail or generic message
      const message = typeof detail === 'string'
        ? detail
        : err.message || 'Something went wrong'
      toast.error(message)
    } else if (err.request) {
      // Network error — no response received
      toast.error('Network error. Check your internet connection.')
    }

    return Promise.reject(err)
  }
)

function _forceLogout() {
  localStorage.removeItem('parkease_access_token')
  localStorage.removeItem('parkease_refresh_token')
  sessionStorage.removeItem('parkease_session_active')
  window.dispatchEvent(new Event('parkease:force-logout'))
}

export default api
