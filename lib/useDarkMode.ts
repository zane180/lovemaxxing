import { useEffect, useState } from 'react'
import { useAuthStore } from './store'

function darkKey(userId?: string | null) {
  return userId ? `lm-dark-${userId}` : 'lm-dark'
}

export function useDarkMode() {
  const userId = useAuthStore((s) => s.user?.id)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(darkKey(userId))
    const isDark = stored === 'true'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [userId])

  const toggle = () => {
    setDark((prev) => {
      const next = !prev
      localStorage.setItem(darkKey(userId), String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return { dark, toggle }
}
