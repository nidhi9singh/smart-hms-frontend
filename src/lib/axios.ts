import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

function getToken(): string | null {
  // 1. Try hms_token (set explicitly on login)
  const direct = localStorage.getItem('hms_token')
  if (direct) return direct

  // 2. Fall back to Zustand persisted store (after page refresh)
  try {
    const stored = localStorage.getItem('hms-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      const token  = parsed?.state?.token
      if (token) {
        localStorage.setItem('hms_token', token)
        return token
      }
    }
  } catch {}

  return null
}

api.interceptors.request.use(cfg => {
  const token = getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hms_token')
      localStorage.removeItem('hms-auth')
      localStorage.removeItem('hms_user')
      // Use replace() to avoid back-button loop, guard against redirect loop
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login')
      }
    }
    return Promise.reject(err)
  }
)

export default api