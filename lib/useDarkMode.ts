import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lm-dark')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored !== null ? stored === 'true' : systemDark
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    setDark((prev) => {
      const next = !prev
      localStorage.setItem('lm-dark', String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return { dark, toggle }
}
