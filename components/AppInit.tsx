'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function AppInit() {
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return
    api.get('/profiles/me/stats').then((res) => {
      const user = useAuthStore.getState().user
      if (user) useAuthStore.getState().setUser({ ...user, stats: res.data })
    }).catch(() => {})
  }, [token])

  return null
}
