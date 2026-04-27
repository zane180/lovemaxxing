import { useEffect, useState } from 'react'
import { useAuthStore } from './store'

function darkKey(userId?: string | null) {
  return userId ? `lm-dark-${userId}` : 'lm-dark'
}

export function useDarkMode() {
  const userId = useAuthStore((s) => s.user?.id)
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const isDark = localStorage.getItem(darkKey(userId)) === 'true'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [userId])

  const toggle = () => {
    setDark((prev) => {
      const next = !prev
      const html = document.documentElement
      html.classList.add('theme-transitioning')
      html.classList.toggle('dark', next)
      localStorage.setItem(darkKey(userId), String(next))
      setTimeout(() => html.classList.remove('theme-transitioning'), 500)
      return next
    })
  }

  return { dark, toggle }
}
