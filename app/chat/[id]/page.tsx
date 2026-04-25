'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Heart, MoreVertical } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { Message, Profile } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import ReportModal from '@/components/ReportModal'
import { API_BASE_URL } from '@/lib/constants'

const WS_BASE = API_BASE_URL.replace(/^http/, 'ws')

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [matchId, setMatchId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const matchIdRef = useRef<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    loadChat()
    return () => {
      isMounted.current = false
      reconnectTimer.current && clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const markAsRead = useCallback(async (mId: string) => {
    try { await api.post(`/chat/${mId}/read`) } catch {}
  }, [])

  const connectWebSocket = useCallback((mId: string) => {
    if (!isMounted.current) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('lovemaxxing_token') : null
    if (!token) return

    wsRef.current?.close()
    const ws = new WebSocket(`${WS_BASE}/chat/ws/${mId}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttempts.current = 0
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'read') {
        // Other user read our messages — mark all our sent messages as read
        setMessages((prev) =>
          prev.map((m) => (m.sender_id === user?.id ? { ...m, read: true } : m))
        )
        return
      }

      if (data.type === 'message') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev
          return [...prev, data as Message]
        })
        // Auto-mark as read since the chat is open
        markAsRead(mId)
        return
      }
    }

    ws.onclose = () => {
      if (!isMounted.current) return
      // Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
      reconnectAttempts.current++
      reconnectTimer.current = setTimeout(() => connectWebSocket(mId), delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [user?.id, markAsRead])

  const loadChat = async () => {
    try {
      const [profileRes, msgRes] = await Promise.all([
        api.get(`/profiles/${id}`),
        api.get(`/chat/${id}/messages`),
      ])
      setProfile(profileRes.data)
      setMessages(msgRes.data.messages)

      const matchesRes = await api.get('/matching/matches')
      const match = matchesRes.data.matches?.find(
        (m: any) => m.profile.id === id
      )
      if (match) {
        setMatchId(match.id)
        matchIdRef.current = match.id
        connectWebSocket(match.id)
      }
    } catch {
      setProfile(DEMO_PROFILE)
      setMessages(DEMO_MESSAGES)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: user?.id || 'me',
      created_at: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const targetId = matchId || id as string
      const res = await api.post(`/chat/${targetId}/messages`, { content })
      // Replace optimistic with real message (WS broadcast also arrives; dedup handles it)
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? res.data : m))
    } catch {
      // Keep optimistic in demo mode
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Index of the last message I sent that has been read — shows "Seen" under it
  const lastSeenIndex = messages.reduce<number>((acc, m, i) => {
    if (m.sender_id === user?.id && m.read) return i
    return acc
  }, -1)

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cream-300 border-t-burgundy-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen h-dvh bg-cream-100 dark:bg-[#120608] flex flex-col max-w-2xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#1E0C10] border-b border-cream-300 dark:border-[#3D1E24] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-burgundy-800/60 hover:text-burgundy-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          {profile?.photos[0] ? (
            <img src={profile.photos[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-luxury flex items-center justify-center">
              <span className="text-cream-100 font-serif font-bold">{profile?.name[0]}</span>
            </div>
          )}
          <div>
            <p className="font-semibold text-burgundy-950 dark:text-cream-100 text-sm">{profile?.name}</p>
            {profile?.match_score && (
              <p className="text-xs text-gold-500 font-medium">{profile.match_score}% match</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowReport(true)}
          className="text-burgundy-800/60 hover:text-burgundy-900 transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900/10 rounded-full">
            <Heart className="w-4 h-4 text-burgundy-900 fill-burgundy-900" />
            <span className="text-xs font-medium text-burgundy-900">
              You matched with {profile?.name}!
            </span>
          </div>
          {profile?.match_score && (
            <p className="text-xs text-burgundy-800/50 mt-2">
              {profile.match_score}% compatibility based on interests & face type
            </p>
          )}
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id || msg.sender_id === 'me'
            const showSeen = isMe && i === lastSeenIndex
            const prevMsg = messages[i - 1]
            const showTimestamp = !prevMsg ||
              new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18 }}
              >
                {showTimestamp && (
                  <p className="text-center text-xs text-burgundy-800/40 my-3">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    <div
                      className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-burgundy-900 text-cream-100 rounded-br-sm'
                          : 'bg-white dark:bg-[#2A1218] text-burgundy-950 dark:text-cream-100 shadow-card dark:shadow-none rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {showSeen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-burgundy-800/50 px-1"
                      >
                        Seen
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white dark:bg-[#1E0C10] border-t border-cream-300 dark:border-[#3D1E24] px-4 py-3 pb-safe-bottom">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 input-field"
            placeholder={`Message ${profile?.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full bg-burgundy-900 flex items-center justify-center disabled:opacity-40 hover:bg-burgundy-950 transition-colors active:scale-95"
          >
            <Send className="w-4 h-4 text-cream-100" />
          </button>
        </div>
      </div>

      {showReport && profile && (
        <ReportModal
          userId={profile.id}
          userName={profile.name}
          onClose={() => setShowReport(false)}
          onBlocked={() => router.push('/matches')}
        />
      )}
    </div>
  )
}

const DEMO_PROFILE: Profile = {
  id: '1',
  name: 'Sophia',
  birthdate: '1999-03-15',
  city: 'New York',
  bio: 'I consume way too much indie cinema...',
  photos: [],
  interests: ['Indie Films', 'Architecture'],
  match_score: 94,
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'I heard you like indie films too 👀',
    sender_id: '1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]
