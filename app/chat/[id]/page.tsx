'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Heart, MoreVertical, Plus, ImageIcon, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import type { Message, Profile } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import ReportModal from '@/components/ReportModal'
import GifPicker from '@/components/GifPicker'
import { API_BASE_URL } from '@/lib/constants'
import toast from 'react-hot-toast'

const WS_BASE = API_BASE_URL.replace(/^http/, 'ws')

interface MediaPreview {
  url: string
  type: 'image' | 'video' | 'gif'
  file?: File
}

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
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

    ws.onopen = () => { reconnectAttempts.current = 0 }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'read') {
        setMessages((prev) => prev.map((m) => m.sender_id === user?.id ? { ...m, read: true } : m))
        return
      }
      if (data.type === 'message') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev
          return [...prev, data as Message]
        })
        markAsRead(mId)
      }
    }

    ws.onclose = () => {
      if (!isMounted.current) return
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
      reconnectAttempts.current++
      reconnectTimer.current = setTimeout(() => connectWebSocket(mId), delay)
    }

    ws.onerror = () => ws.close()
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
      const match = matchesRes.data.matches?.find((m: any) => m.profile.id === id)
      if (match) {
        setMatchId(match.id)
        connectWebSocket(match.id)
      }
    } catch {
      setProfile(DEMO_PROFILE)
      setMessages(DEMO_MESSAGES)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    const url = URL.createObjectURL(file)
    setMediaPreview({ url, type, file })
    setShowAttachMenu(false)
    e.target.value = ''
  }

  const handleGifSelect = (gifUrl: string) => {
    setMediaPreview({ url: gifUrl, type: 'gif' })
    setShowGifPicker(false)
  }

  const clearMedia = () => {
    if (mediaPreview?.file) URL.revokeObjectURL(mediaPreview.url)
    setMediaPreview(null)
  }

  const sendMessage = async () => {
    if (!input.trim() && !mediaPreview) return
    if (sending || uploading) return

    const content = input.trim()
    setInput('')

    let media_url: string | undefined
    let media_type: Message['media_type'] | undefined

    if (mediaPreview) {
      if (mediaPreview.type === 'gif') {
        media_url = mediaPreview.url
        media_type = 'gif'
      } else {
        setUploading(true)
        try {
          const formData = new FormData()
          formData.append('file', mediaPreview.file!)
          const targetId = matchId || (id as string)
          const res = await api.post(`/chat/${targetId}/media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          media_url = res.data.url
          media_type = res.data.media_type
        } catch {
          toast.error('Failed to upload — please try again')
          setUploading(false)
          return
        } finally {
          setUploading(false)
        }
      }
      clearMedia()
    }

    setSending(true)
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: user?.id || 'me',
      created_at: new Date().toISOString(),
      read: false,
      media_url,
      media_type,
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const targetId = matchId || (id as string)
      const res = await api.post(`/chat/${targetId}/messages`, { content, media_url, media_type })
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? res.data : m))
    } catch {
      // keep optimistic in demo mode
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
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-screen h-dvh flex flex-col max-w-2xl mx-auto overflow-hidden"
    >
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
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
        onClick={() => setShowAttachMenu(false)}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900/10 rounded-full">
            <Heart className="w-4 h-4 text-burgundy-900 fill-burgundy-900" />
            <span className="text-xs font-medium text-burgundy-900">
              You matched with {profile?.name}!
            </span>
          </div>
          {profile?.match_score && (
            <p className="text-xs text-burgundy-800/50 mt-2">
              {profile.match_score}% compatibility based on interests &amp; face type
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
            const hasMedia = !!msg.media_url
            const hasText = !!msg.content

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
                  <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Media bubble */}
                    {hasMedia && (msg.media_type === 'image' || msg.media_type === 'gif') && (
                      <img
                        src={msg.media_url}
                        alt=""
                        className={`max-w-[240px] w-full rounded-2xl object-cover ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        loading="lazy"
                      />
                    )}
                    {hasMedia && msg.media_type === 'video' && (
                      <video
                        src={msg.media_url}
                        controls
                        playsInline
                        className={`max-w-[240px] w-full rounded-2xl ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                      />
                    )}
                    {/* Text bubble */}
                    {hasText && (
                      <div
                        className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-burgundy-900 text-cream-100 rounded-br-sm'
                            : 'bg-white dark:bg-[#2A1218] text-burgundy-950 dark:text-cream-100 shadow-card dark:shadow-none rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
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

      {/* Input area */}
      <div className="bg-white dark:bg-[#1E0C10] border-t border-cream-300 dark:border-[#3D1E24] pb-safe-bottom">
        {/* Attach options */}
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-4 px-5 pt-4 pb-1">
                <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                  <div className="w-14 h-14 bg-cream-100 dark:bg-[#2A1218] rounded-2xl flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-burgundy-900" />
                  </div>
                  <span className="text-xs text-burgundy-800/60">Photo/Video</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
                <button
                  onClick={() => { setShowGifPicker(true); setShowAttachMenu(false) }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-14 h-14 bg-cream-100 dark:bg-[#2A1218] rounded-2xl flex items-center justify-center">
                    <span className="text-sm font-bold text-burgundy-900 tracking-wide">GIF</span>
                  </div>
                  <span className="text-xs text-burgundy-800/60">GIF</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media preview */}
        <AnimatePresence>
          {mediaPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 pb-1 flex items-center gap-3">
                <div className="relative">
                  {mediaPreview.type === 'video' ? (
                    <video
                      src={mediaPreview.url}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                  ) : (
                    <img
                      src={mediaPreview.url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                  )}
                  <button
                    onClick={clearMedia}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-burgundy-900 rounded-full flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
                <p className="text-xs text-burgundy-800/50">
                  {mediaPreview.type === 'gif' ? 'GIF selected' : 'Add a caption or send as is'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setShowAttachMenu((v) => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              showAttachMenu
                ? 'bg-burgundy-900 text-cream-100'
                : 'bg-cream-100 dark:bg-[#2A1218] text-burgundy-800/60 hover:text-burgundy-900'
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform duration-200 ${showAttachMenu ? 'rotate-45' : ''}`} />
          </button>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 input-field"
            placeholder={mediaPreview ? 'Add a caption…' : `Message ${profile?.name}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowAttachMenu(false)}
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !mediaPreview) || sending || uploading}
            className="w-11 h-11 rounded-full bg-burgundy-900 flex items-center justify-center disabled:opacity-40 hover:bg-burgundy-950 transition-colors active:scale-95 flex-shrink-0"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-cream-100" />
            )}
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

      {showGifPicker && (
        <GifPicker
          onSelect={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </motion.div>
  )
}

const DEMO_PROFILE: Profile = {
  id: '1',
  name: 'Sophia',
  birthdate: '1999-03-15',
  city: 'New York',
  bio: 'I consume way too much indie cinema…',
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
