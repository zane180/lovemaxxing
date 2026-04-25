'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function AppInit() {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)

  // Re-apply dark mode whenever the logged-in user changes (login / logout / account switch)
  useEffect(() => {
    const key = userId ? `lm-dark-${userId}` : 'lm-dark'
    const isDark = localStorage.getItem(key) === 'true'
    document.documentElement.classList.toggle('dark', isDark)
  }, [userId])

  useEffect(() => {
    if (!token) return
    api.get('/profiles/me/stats').then((res) => {
      const user = useAuthStore.getState().user
      if (user) useAuthStore.getState().setUser({ ...user, stats: res.data })
    }).catch(() => {})
  }, [token])

  return null
}
