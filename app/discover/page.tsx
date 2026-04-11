'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { Heart, X, Star, Info, RotateCcw, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { api } from '@/lib/api'
import type { Profile } from '@/lib/types'

const SWIPE_THRESHOLD = 120

function SwipeCard({
  profile,
  onSwipe,
  isTop,
}: {
  profile: Profile
  onSwipe: (dir: 'left' | 'right' | 'super') => void
  isTop: boolean
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1])
  const [photoIndex, setPhotoIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const dragStartX = useRef(0)

  const handleDragEnd = (_: any, info: any) => {
    const offset = info.offset.x
    if (offset > SWIPE_THRESHOLD) {
      animate(x, 600, { duration: 0.3 })
      onSwipe('right')
    } else if (offset < -SWIPE_THRESHOLD) {
      animate(x, -600, { duration: 0.3 })
      onSwipe('left')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 })
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 20 })
    }
  }

  const age = new Date().getFullYear() - new Date(profile.birthdate).getFullYear()

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, y, rotate, touchAction: 'none' }}
      drag={isTop}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={(_, info) => { dragStartX.current = info.point.x }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-luxury select-none">
        {/* Photo */}
        {profile.photos.length > 0 ? (
          <img
            src={profile.photos[photoIndex]}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-luxury flex items-center justify-center">
            <div className="text-6xl font-serif font-bold text-cream-100/40">
              {profile.name[0]}
            </div>
          </div>
        )}

        {/* Photo tap zones */}
        <div className="absolute inset-0 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))}
          />
          <div className="w-1/3 h-full" />
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={() => setPhotoIndex(Math.min(profile.photos.length - 1, photoIndex + 1))}
          />
        </div>

        {/* Photo dots */}
        {profile.photos.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {profile.photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all ${
                  i === photoIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Like / Nope overlays */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-12 left-6 border-4 border-green-400 text-green-400 text-2xl font-bold px-4 py-2 rounded-xl rotate-[-12deg]"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-12 right-6 border-4 border-red-400 text-red-400 text-2xl font-bold px-4 py-2 rounded-xl rotate-[12deg]"
        >
          NOPE
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-white text-2xl font-serif font-bold">
                {profile.name}, {age}
              </h3>
              {profile.city && (
                <p className="text-white/70 text-sm mt-1">{profile.city}</p>
              )}
              {/* Match score */}
              {profile.match_score && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  <span className="text-gold-400 text-sm font-semibold">
                    {profile.match_score}% Match
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo) }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Info className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Interests preview */}
          {!showInfo && profile.interests && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.interests.slice(0, 4).map((interest) => (
                <span
                  key={interest}
                  className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Expanded info */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white/80 text-sm mt-3 leading-relaxed">{profile.bio}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.interests?.map((interest) => (
                    <span
                      key={interest}
                      className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showMatch, setShowMatch] = useState<Profile | null>(null)
  const [swipedAll, setSwipedAll] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const res = await api.get('/matching/discover')
      setProfiles(res.data.profiles)
    } catch {
      // Demo profiles for development
      setProfiles(DEMO_PROFILES)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (dir: 'left' | 'right' | 'super', profile: Profile) => {
    const remaining = profiles.slice(0, -1)
    setProfiles(remaining)
    if (remaining.length === 0) setSwipedAll(true)

    if (dir === 'right' || dir === 'super') {
      try {
        const res = await api.post('/matching/swipe', {
          target_id: profile.id,
          direction: dir,
        })
        if (res.data.matched) {
          setShowMatch(profile)
        }
      } catch {
        // In demo mode, occasionally show a match
        if (Math.random() > 0.6) setShowMatch(profile)
      }
    }
  }

  const currentProfile = profiles[profiles.length - 1]
  const secondProfile = profiles[profiles.length - 2]

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-safe-top pt-6 pb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-burgundy-950">Discover</h1>
        <button onClick={loadProfiles} className="text-burgundy-800/60 hover:text-burgundy-900 transition-colors">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Card stack */}
      <div className="flex-1 px-4 pb-4 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-3 border-cream-300 border-t-burgundy-900 rounded-full animate-spin" />
            <p className="text-burgundy-800/60">Finding your matches...</p>
          </div>
        ) : swipedAll || profiles.length === 0 ? (
          <div className="text-center px-8">
            <Heart className="w-16 h-16 text-burgundy-900/20 mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-bold text-burgundy-950 mb-2">You're all caught up</h3>
            <p className="text-burgundy-800/60 mb-6">Check back later for new matches, or see who liked you.</p>
            <Link href="/matches" className="btn-primary inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              View Matches
            </Link>
          </div>
        ) : (
          <div className="relative w-full max-w-sm aspect-[3/4]">
            {/* Second card (background) */}
            {secondProfile && (
              <div className="absolute inset-0 scale-95 translate-y-3 opacity-60 rounded-4xl overflow-hidden">
                <div className="w-full h-full bg-gradient-luxury" />
              </div>
            )}
            {/* Current card */}
            {currentProfile && (
              <SwipeCard
                key={currentProfile.id}
                profile={currentProfile}
                onSwipe={(dir) => handleSwipe(dir, currentProfile)}
                isTop={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!loading && !swipedAll && profiles.length > 0 && (
        <div className="pb-safe-bottom pb-6 px-6">
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={() => currentProfile && handleSwipe('left', currentProfile)}
              className="w-14 h-14 rounded-full bg-white shadow-card border border-cream-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              <X className="w-7 h-7 text-red-400" />
            </button>
            <button
              onClick={() => currentProfile && handleSwipe('super', currentProfile)}
              className="w-14 h-14 rounded-full bg-gradient-luxury shadow-luxury flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              <Star className="w-7 h-7 text-gold-400 fill-gold-400" />
            </button>
            <button
              onClick={() => currentProfile && handleSwipe('right', currentProfile)}
              className="w-14 h-14 rounded-full bg-white shadow-card border border-cream-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              <Heart className="w-7 h-7 text-burgundy-900 fill-burgundy-900" />
            </button>
          </div>
        </div>
      )}

      {/* Match modal */}
      <AnimatePresence>
        {showMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-luxury rounded-4xl p-8 text-center max-w-sm w-full shadow-luxury"
            >
              <div className="text-4xl mb-4">💘</div>
              <h2 className="font-serif text-3xl font-bold text-cream-100 mb-2">It's a Match!</h2>
              <p className="text-cream-300 mb-6">
                You and <strong>{showMatch.name}</strong> both liked each other.
              </p>
              <div className="flex gap-3 flex-col">
                <Link
                  href={`/chat/${showMatch.id}`}
                  className="btn-gold w-full text-center"
                  onClick={() => setShowMatch(null)}
                >
                  Send a Message
                </Link>
                <button
                  onClick={() => setShowMatch(null)}
                  className="text-cream-300 hover:text-cream-100 transition-colors text-sm"
                >
                  Keep Swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavBar active="discover" />
    </div>
  )
}

// Demo profiles for development / offline mode
const DEMO_PROFILES: Profile[] = [
  {
    id: '1',
    name: 'Sophia',
    birthdate: '1999-03-15',
    city: 'New York',
    bio: 'I consume way too much indie cinema and defend it to people who only watch Marvel. Architecture student, chronic overcooker, and the person your horoscope warned you about.',
    photos: [],
    interests: ['Indie Films', 'Architecture', 'Cooking', 'Astrology', 'Thrifting'],
    match_score: 94,
  },
  {
    id: '2',
    name: 'Jordan',
    birthdate: '1997-07-22',
    city: 'Los Angeles',
    bio: 'Stand-up comedian by night, barista by day. I\'ll make you laugh until you snort, then apologize for embarrassing you.',
    photos: [],
    interests: ['Stand-up Comedy', 'Coffee', 'Skateboarding', 'Jazz', 'True Crime'],
    match_score: 87,
  },
  {
    id: '3',
    name: 'Maya',
    birthdate: '2000-11-08',
    city: 'Chicago',
    bio: 'PhD student in behavioral economics. I\'ll analyze your decision-making in the most charming way possible. Big fan of hiking and even bigger fan of talking about hiking.',
    photos: [],
    interests: ['Economics', 'Hiking', 'Reading', 'Philosophy', 'Yoga'],
    match_score: 91,
  },
]
