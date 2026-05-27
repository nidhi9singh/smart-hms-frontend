import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  name: string
  role: string
  staff_code?: number
  email?: string
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  isAuth: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => {
        set({ token: null, user: null })
        localStorage.removeItem('hms_token')
        localStorage.removeItem('hms_user')
      },
      isAuth: () => !!get().token && !!get().user,
    }),
    {
      name: 'hms-auth',
      partialize: state => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => state => {
        if (state?.token) localStorage.setItem('hms_token', state.token)
      }
    }
  )
)
