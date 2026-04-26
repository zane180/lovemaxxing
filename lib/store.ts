import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from './types'

interface AuthState {
  user: User | null
  token: string | null
  totalUnread: number
  setUser: (user: User) => void
  setToken: (token: string) => void
  setTotalUnread: (n: number) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      totalUnread: 0,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lovemaxxing_token', token)
        }
        set({ token })
      },
      setTotalUnread: (totalUnread) => set({ totalUnread }),
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lovemaxxing_token')
          document.documentElement.classList.remove('dark')
        }
        set({ user: null, token: null, totalUnread: 0 })
      },
    }),
    {
      name: 'lovemaxxing_user',
      // totalUnread is intentionally excluded — always fetched fresh
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
