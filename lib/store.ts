import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from './types'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lovemaxxing_token', token)
        }
        set({ token })
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lovemaxxing_token')
          document.documentElement.classList.remove('dark')
        }
        set({ user: null, token: null })
      },
    }),
    {
      name: 'lovemaxxing_user',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
