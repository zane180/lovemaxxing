'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Match } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const res = await api.get('/matching/matches')
      setMatches(res.data.matches)
    } catch {
      setMatches(DEMO_MATCHES)
    } finally {
      setLoading(false)
    }
  }

  const filtered = matches.filter((m) =>
    m.profile.name.toLowerCase().includes(search.toLowerCase())
  )

  const newMatches = filtered.filter((m) => !m.last_message)
  const conversations = filtered.filter((m) => m.last_message)

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-[#120608] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream-100/90 dark:bg-[#120608]/90 backdrop-blur-sm border-b border-cream-300 dark:border-[#3D1E24] px-6 pt-safe-top pt-6 pb-4">
        <h1 className="font-serif text-2xl font-bold text-burgundy-950 dark:text-cream-100 mb-4">Matches</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-burgundy-800/40" />
          <input
            type="text"
            placeholder="Search matches..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-cream-300 border-t-burgundy-900 rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 px-8">
          <Heart className="w-16 h-16 text-burgundy-900/20 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-burgundy-950 mb-2">No matches yet</h3>
          <p className="text-burgundy-800/60 mb-6">Keep swiping to find your people.</p>
          <Link href="/discover" className="btn-primary inline-block">Discover People</Link>
        </div>
      ) : (
        <div className="px-6 py-6 space-y-8">
          {/* New matches */}
          {newMatches.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-semibold text-burgundy-950 mb-4">
                New Matches <span className="text-burgundy-800/40 font-normal text-sm">({newMatches.length})</span>
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                {newMatches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/chat/${match.profile.id}`} className="block text-center flex-shrink-0">
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        {match.profile.photos[0] ? (
                          <img
                            src={match.profile.photos[0]}
                            alt={match.profile.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-luxury flex items-center justify-center">
                            <span className="text-cream-100 text-xl font-serif font-bold">
                              {match.profile.name[0]}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center border-2 border-cream-100">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-burgundy-950 w-20 truncate text-center">
                        {match.profile.name}
                      </p>
                      {match.profile.match_score && (
                        <p className="text-xs text-gold-500 font-semibold">{match.profile.match_score}%</p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          {conversations.length > 0 && (
            <div>
              <h2 className="font-serif text-lg font-semibold text-burgundy-950 mb-4">Messages</h2>
              <div className="space-y-3">
                {conversations.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={`/chat/${match.profile.id}`}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E0C10] rounded-2xl shadow-card dark:shadow-none border border-transparent dark:border-[#3D1E24] hover:shadow-luxury transition-all duration-200"
                    >
                      <div className="relative flex-shrink-0">
                        {match.profile.photos[0] ? (
                          <img
                            src={match.profile.photos[0]}
                            alt={match.profile.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-luxury flex items-center justify-center">
                            <span className="text-cream-100 text-lg font-serif font-bold">
                              {match.profile.name[0]}
                            </span>
                          </div>
                        )}
                        {match.unread && match.unread > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-burgundy-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{match.unread}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-burgundy-950 dark:text-cream-100">{match.profile.name}</p>
                          {match.last_message && (
                            <p className="text-xs text-burgundy-800/40">
                              {formatDistanceToNow(new Date(match.last_message.created_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        <p className={`text-sm truncate ${match.unread ? 'text-burgundy-950 font-medium' : 'text-burgundy-800/60'}`}>
                          {match.last_message?.content || 'Say hi!'}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

const DEMO_MATCHES: Match[] = [
  {
    id: 'm1',
    profile: {
      id: '1', name: 'Sophia', birthdate: '1999-03-15', city: 'New York',
      bio: '', photos: [], interests: ['Indie Films', 'Architecture'], match_score: 94,
    },
    matched_at: new Date().toISOString(),
    last_message: {
      id: 'msg1', content: 'I heard you like indie films too 👀', created_at: new Date(Date.now() - 3600000).toISOString(), sender_id: '1',
    },
    unread: 1,
  },
  {
    id: 'm2',
    profile: {
      id: '2', name: 'Jordan', birthdate: '1997-07-22', city: 'Los Angeles',
      bio: '', photos: [], interests: ['Stand-up Comedy', 'Coffee'], match_score: 87,
    },
    matched_at: new Date(Date.now() - 86400000).toISOString(),
    last_message: undefined,
  },
]
