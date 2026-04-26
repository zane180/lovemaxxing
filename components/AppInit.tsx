'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'
import type { Match } from '@/lib/types'

export default function AppInit() {
  const token        = useAuthStore((s) => s.token)
  const userId       = useAuthStore((s) => s.user?.id)
  const setTotalUnread = useAuthStore((s) => s.setTotalUnread)

  const prevUnread  = useRef<Record<string, number>>({})
  const isFirstPoll = useRef(true)

  // Re-apply dark mode when the logged-in user changes
  useEffect(() => {
    const key = userId ? `lm-dark-${userId}` : 'lm-dark'
    const isDark = localStorage.getItem(key) === 'true'
    document.documentElement.classList.toggle('dark', isDark)
  }, [userId])

  // Fetch user stats on login
  useEffect(() => {
    if (!token) return
    api.get('/profiles/me/stats').then((res) => {
      const user = useAuthStore.getState().user
      if (user) useAuthStore.getState().setUser({ ...user, stats: res.data })
    }).catch(() => {})
  }, [token])

  // Request browser notification permission a few seconds after login
  useEffect(() => {
    if (!token) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
    const t = setTimeout(() => Notification.requestPermission(), 4000)
    return () => clearTimeout(t)
  }, [token])

  // Poll matches: update unread badge + fire push notifications for new messages
  const pollMatches = useCallback(async () => {
    if (!token) return
    try {
      const res = await api.get('/matching/matches')
      const matches: Match[] = res.data.matches || []

      // Update global unread badge count
      const total = matches.reduce((sum, m) => sum + (m.unread || 0), 0)
      setTotalUnread(total)

      // Show push notifications for newly arrived messages (skip first poll — that's the baseline)
      if (!isFirstPoll.current && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        for (const match of matches) {
          const prev = prevUnread.current[match.id] ?? 0
          const curr = match.unread || 0
          if (curr > prev && match.last_message) {
            // Don't notify if the user is already in that chat
            const inChat = window.location.pathname.includes(`/chat/${match.profile.id}`)
            if (!inChat) {
              const body = match.last_message.content
                || (match.last_message.media_type === 'image' ? '📷 Photo'
                  : match.last_message.media_type === 'video' ? '🎥 Video'
                  : match.last_message.media_type === 'gif'   ? 'GIF'
                  : '…')
              const notif = new Notification(match.profile.name, {
                body,
                icon: '/apple-icon.png',
                tag: `lm-${match.id}`,
              })
              notif.onclick = () => {
                window.focus()
                window.location.href = `/chat/${match.profile.id}`
              }
            }
          }
        }
      }

      // Always update baseline after first poll
      for (const match of matches) {
        prevUnread.current[match.id] = match.unread || 0
      }
      isFirstPoll.current = false
    } catch {}
  }, [token, setTotalUnread])

  useEffect(() => {
    if (!token) {
      setTotalUnread(0)
      isFirstPoll.current = true
      prevUnread.current = {}
      return
    }
    pollMatches()
    const id = setInterval(pollMatches, 30_000)
    return () => clearInterval(id)
  }, [token, pollMatches, setTotalUnread])

  return null
}
