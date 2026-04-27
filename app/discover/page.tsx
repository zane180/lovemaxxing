'use client'

import { useState, useEffect, useRef } from 'react'
import {
  motion, useMotionValue, useTransform, animate,
  AnimatePresence, useMotionTemplate, useSpring,
} from 'framer-motion'
import { Heart, X, Star, Info, RotateCcw, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Profile } from '@/lib/types'
import { useAuthStore } from '@/lib/store'
import HeartbeatLoader from '@/components/HeartbeatLoader'
import MatchCelebration from '@/components/MatchCelebration'

const SWIPE_THRESHOLD = 120
const VELOCITY_SNAP = 150

function SwipeCard({
  profile,
  onSwipe,
  isTop,
  userInterests,
}: {
  profile: Profile
  onSwipe: (dir: 'left' | 'right' | 'super') => void
  isTop: boolean
  userInterests: string[]
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-20, 20])
  const likeOpacity = useTransform(x, [18, 90], [0, 1])
  const nopeOpacity = useTransform(x, [-18, -90], [0, 1])
  const rightFlashOpacity = useTransform(x, [0, 160], [0, 0.48])
  const leftFlashOpacity = useTransform(x, [-160, 0], [0.40, 0])

  // 3D tilt with springs for smooth holographic effect
  const cardRef = useRef<HTMLDivElement>(null)
  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rawGlareX = useMotionValue(50)
  const rawGlareY = useMotionValue(50)
  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 22 })
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 22 })
  const glareX = useSpring(rawGlareX, { stiffness: 70, damping: 16 })
  const glareY = useSpring(rawGlareY, { stiffness: 70, damping: 16 })

  // Iridescent holographic glare
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,238,195,0.24) 0%, rgba(185,130,255,0.09) 28%, rgba(110,205,255,0.07) 48%, rgba(255,175,140,0.05) 64%, transparent 76%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width
    const cy = (e.clientY - rect.top) / rect.height
    rawRotateY.set((cx - 0.5) * 24)
    rawRotateX.set((0.5 - cy) * 24)
    rawGlareX.set(cx * 100)
    rawGlareY.set(cy * 100)
  }

  const handleMouseLeave = () => {
    rawRotateX.set(0)
    rawRotateY.set(0)
    rawGlareX.set(50)
    rawGlareY.set(50)
  }

  const [photoIndex, setPhotoIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [vibeIdx, setVibeIdx] = useState(0)

  const sharedVibes = userInterests.filter(i =>
    profile.interests?.some(pi => pi.toLowerCase() === i.toLowerCase())
  )

  useEffect(() => {
    if (!isTop || sharedVibes.length === 0) return
    const t = setInterval(() => setVibeIdx(v => (v + 1) % sharedVibes.length), 1500)
    return () => clearInterval(t)
  }, [isTop, sharedVibes.length])

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const offset = info.offset.x
    const velocity = Math.abs(info.velocity.x)
    const snapRight = offset > SWIPE_THRESHOLD || (offset > SWIPE_THRESHOLD * 0.62 && velocity > VELOCITY_SNAP)
    const snapLeft = offset < -SWIPE_THRESHOLD || (offset < -SWIPE_THRESHOLD * 0.62 && velocity > VELOCITY_SNAP)

    if (snapRight) {
      animate(x, 650, { duration: 0.28 })
      onSwipe('right')
    } else if (snapLeft) {
      animate(x, -650, { duration: 0.28 })
      onSwipe('left')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 320, damping: 22 })
      animate(y, 0, { type: 'spring', stiffness: 320, damping: 22 })
    }
  }

  const age = new Date().getFullYear() - new Date(profile.birthdate).getFullYear()
  const arcId = `arc-${profile.id}`
  const arcCircumference = 2 * Math.PI * 11

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0"
      style={{ x, y, rotate, rotateX, rotateY, touchAction: 'none', transformPerspective: 1300 }}
      drag={isTop}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.88}
      onDragEnd={handleDragEnd}
      onMouseMove={isTop ? handleMouseMove : undefined}
      onMouseLeave={isTop ? handleMouseLeave : undefined}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-luxury select-none">
        {profile.photos.length > 0 ? (
          <img
            src={profile.photos[photoIndex]}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-luxury flex items-center justify-center">
            <span className="text-6xl font-serif font-bold text-cream-100/40">{profile.name[0]}</span>
          </div>
        )}

        {/* Iridescent holographic glare */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-4xl"
          style={{ background: glare }}
        />

        {/* Right swipe flash — gold */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-4xl"
          style={{
            opacity: rightFlashOpacity,
            background: 'linear-gradient(135deg, rgba(201,168,76,0.45) 0%, rgba(114,47,55,0.18) 100%)',
          }}
        />

        {/* Left swipe flash — dark muted */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-4xl"
          style={{
            opacity: leftFlashOpacity,
            background: 'rgba(30,15,20,0.55)',
          }}
        />

        {/* Photo tap zones */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full cursor-pointer" onClick={() => setPhotoIndex(Math.min(profile.photos.length - 1, photoIndex + 1))} />
        </div>

        {/* Photo dots */}
        {profile.photos.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {profile.photos.map((_, i) => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-all ${i === photoIndex ? 'bg-white' : 'bg-white/35'}`} />
            ))}
          </div>
        )}

        {/* LIKE stamp — gold with heart */}
        <motion.div
          style={{ opacity: likeOpacity, borderColor: '#C9A84C', color: '#C9A84C' }}
          className="absolute top-12 left-6 border-[3px] text-xl font-bold px-4 py-1.5 rounded-xl rotate-[-12deg] backdrop-blur-sm bg-black/10 flex items-center gap-1.5"
        >
          <Heart className="w-4 h-4 fill-current" />
          LIKE
        </motion.div>

        {/* NOPE stamp — deep crimson */}
        <motion.div
          className="absolute top-12 right-6 border-[3px] text-xl font-bold px-4 py-1.5 rounded-xl rotate-[12deg] backdrop-blur-sm bg-black/10"
          style={{ opacity: nopeOpacity, borderColor: '#9E1A2B', color: '#9E1A2B' }}
        >
          NOPE
        </motion.div>

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent pointer-events-none" />

        {/* Info panel */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-white text-2xl font-serif font-bold drop-shadow-sm">
                {profile.name}, {age}
              </h3>
              {profile.city && <p className="text-white/65 text-sm mt-0.5">{profile.city}</p>}

              {/* Compatibility arc replacing text score */}
              {profile.match_score != null && profile.match_score > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <svg width="32" height="32" viewBox="0 0 32 32">
                      <defs>
                        <linearGradient id={arcId} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#722F37" />
                          <stop offset="100%" stopColor="#C9A84C" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="16" cy="16" r="11"
                        fill="none"
                        stroke="rgba(255,255,255,0.14)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="16" cy="16" r="11"
                        fill="none"
                        stroke={`url(#${arcId})`}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={arcCircumference}
                        strokeDashoffset={arcCircumference * (1 - profile.match_score / 100)}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '16px 16px' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-gold-400 font-bold" style={{ fontSize: 7, lineHeight: 1 }}>
                        {profile.match_score}%
                      </span>
                    </div>
                  </div>
                  <span className="text-gold-400/80 text-xs font-medium">AI Match</span>
                </div>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={e => { e.stopPropagation(); setShowInfo(!showInfo) }}
              className="w-10 h-10 rounded-full bg-white/18 backdrop-blur-md border border-white/22 flex items-center justify-center"
            >
              <Info className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Vibe match interests with sequential glow */}
          {!showInfo && profile.interests && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.interests.slice(0, 4).map(interest => {
                const isShared = userInterests.some(i => i.toLowerCase() === interest.toLowerCase())
                const isActive = isShared && sharedVibes[vibeIdx]?.toLowerCase() === interest.toLowerCase()
                return (
                  <motion.span
                    key={interest}
                    animate={
                      isActive
                        ? { borderColor: 'rgba(201,168,76,0.85)', backgroundColor: 'rgba(201,168,76,0.20)', color: '#E8C878' }
                        : { borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.88)' }
                    }
                    transition={{ duration: 0.38 }}
                    className="text-xs px-3 py-1 rounded-full border backdrop-blur-sm"
                  >
                    {interest}
                  </motion.span>
                )
              })}
            </div>
          )}

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white/78 text-sm mt-3 leading-relaxed">{profile.bio}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.interests?.map(interest => {
                    const isShared = userInterests.some(i => i.toLowerCase() === interest.toLowerCase())
                    return (
                      <span
                        key={interest}
                        className="text-xs px-3 py-1 rounded-full border backdrop-blur-sm"
                        style={
                          isShared
                            ? { borderColor: 'rgba(201,168,76,0.6)', backgroundColor: 'rgba(201,168,76,0.15)', color: '#E8C878' }
                            : { borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.88)' }
                        }
                      >
                        {interest}
                      </span>
                    )
                  })}
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
  const { user } = useAuthStore()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showMatch, setShowMatch] = useState<{ profile: Profile; matchId?: string } | null>(null)
  const [swipedAll, setSwipedAll] = useState(false)

  const userInterests = user?.interests ?? []

  useEffect(() => { loadProfiles() }, [])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const res = await api.get('/matching/discover')
      setProfiles(res.data.profiles)
    } catch {
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
        const res = await api.post('/matching/swipe', { target_id: profile.id, direction: dir })
        if (res.data.matched) setShowMatch({ profile, matchId: res.data.match_id })
      } catch {
        if (Math.random() > 0.6) setShowMatch({ profile })
      }
    }
  }

  const currentProfile = profiles[profiles.length - 1]
  const secondProfile  = profiles[profiles.length - 2]
  const thirdProfile   = profiles[profiles.length - 3]

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-safe-top pt-6 pb-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-burgundy-950 dark:text-cream-100">Discover</h1>
          <motion.button
            whileHover={{ rotate: -45 }}
            whileTap={{ scale: 0.88 }}
            onClick={loadProfiles}
            transition={{ duration: 0.3 }}
            className="w-9 h-9 rounded-full bg-white/60 dark:bg-white/[0.06] backdrop-blur-sm border border-white/70 dark:border-white/10 flex items-center justify-center text-burgundy-800/60 hover:text-burgundy-900 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Card stack */}
        <div className="flex-1 px-4 pb-2 flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-5">
              <HeartbeatLoader size={52} />
              <p className="text-burgundy-800/55 dark:text-cream-300/45 text-sm">Finding your matches…</p>
            </div>
          ) : swipedAll || profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center px-8"
            >
              <Heart className="w-16 h-16 text-burgundy-900/20 dark:text-cream-100/10 mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold text-burgundy-950 dark:text-cream-100 mb-2">You&apos;re all caught up</h3>
              <p className="text-burgundy-800/55 dark:text-cream-300/45 mb-6">Check back later for new matches.</p>
              <Link href="/matches" className="btn-primary inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                View Matches
              </Link>
            </motion.div>
          ) : (
            <div className="relative w-full max-w-sm aspect-[3/4]" style={{ perspective: '1500px' }}>
              {/* Third card */}
              {thirdProfile && (
                <div className="absolute inset-0 rounded-4xl overflow-hidden scale-[0.87] translate-y-10 opacity-30 pointer-events-none">
                  {thirdProfile.photos[0]
                    ? <img src={thirdProfile.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-luxury" />}
                </div>
              )}
              {/* Second card */}
              {secondProfile && (
                <div className="absolute inset-0 rounded-4xl overflow-hidden scale-[0.93] translate-y-5 opacity-58 pointer-events-none">
                  {secondProfile.photos[0]
                    ? <img src={secondProfile.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-luxury" />}
                </div>
              )}
              {/* Top card */}
              {currentProfile && (
                <SwipeCard
                  key={currentProfile.id}
                  profile={currentProfile}
                  onSwipe={dir => handleSwipe(dir, currentProfile)}
                  isTop
                  userInterests={userInterests}
                />
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!loading && !swipedAll && profiles.length > 0 && (
          <div className="pb-32 px-6">
            <div className="flex items-center justify-center gap-5">
              {/* Nope */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => currentProfile && handleSwipe('left', currentProfile)}
                className="w-14 h-14 rounded-full bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm border border-red-100/80 dark:border-red-900/30 flex items-center justify-center shadow-[0_4px_20px_rgba(239,68,68,0.12)] hover:shadow-[0_6px_28px_rgba(239,68,68,0.32)] transition-shadow"
              >
                <X className="w-7 h-7 text-red-400/80" strokeWidth={2.5} />
              </motion.button>

              {/* Super */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => currentProfile && handleSwipe('super', currentProfile)}
                className="w-14 h-14 rounded-full bg-gradient-luxury flex items-center justify-center shadow-[0_4px_24px_rgba(114,47,55,0.45)] hover:shadow-[0_6px_32px_rgba(201,169,110,0.5)] transition-shadow"
              >
                <Star className="w-7 h-7 text-gold-400 fill-gold-400" />
              </motion.button>

              {/* Like */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => currentProfile && handleSwipe('right', currentProfile)}
                className="w-16 h-16 rounded-full bg-white/70 dark:bg-white/[0.06] backdrop-blur-sm border border-burgundy-200/60 dark:border-burgundy-900/40 flex items-center justify-center shadow-[0_4px_20px_rgba(114,47,55,0.18)] hover:shadow-[0_6px_32px_rgba(114,47,55,0.48)] transition-shadow"
              >
                <Heart className="w-8 h-8 text-burgundy-900 fill-burgundy-900" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cinematic match celebration */}
      <AnimatePresence>
        {showMatch && (
          <MatchCelebration
            key="match"
            profile={showMatch.profile}
            matchId={showMatch.matchId}
            onClose={() => setShowMatch(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

const DEMO_PROFILES: Profile[] = [
  {
    id: '1', name: 'Sophia', birthdate: '1999-03-15', city: 'New York',
    bio: 'I consume way too much indie cinema and defend it to people who only watch Marvel. Architecture student, chronic overcooker.',
    photos: [], interests: ['Indie Films', 'Architecture', 'Cooking', 'Astrology', 'Thrifting'], match_score: 94,
  },
  {
    id: '2', name: 'Jordan', birthdate: '1997-07-22', city: 'Los Angeles',
    bio: 'Stand-up comedian by night, barista by day.',
    photos: [], interests: ['Stand-up Comedy', 'Coffee', 'Skateboarding', 'Jazz'], match_score: 87,
  },
  {
    id: '3', name: 'Maya', birthdate: '2000-11-08', city: 'Chicago',
    bio: 'PhD student in behavioral economics. Big fan of hiking.',
    photos: [], interests: ['Economics', 'Hiking', 'Reading', 'Philosophy', 'Yoga'], match_score: 91,
  },
]
