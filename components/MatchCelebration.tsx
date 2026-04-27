'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import type { Profile } from '@/lib/types'

const BRAND_COLORS = ['#722F37', '#4A1520', '#9E1A2B', '#C9A84C', '#B8923A', '#8B1A2B', '#E8C878', '#5C1520']

interface ConfettiHeart {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  wobble: number
  rotate: number
}

interface Props {
  profile: Profile
  matchId?: string
  onClose: () => void
}

export default function MatchCelebration({ profile, matchId, onClose }: Props) {
  const { user } = useAuthStore()
  const [hearts, setHearts] = useState<ConfettiHeart[]>([])
  const [score, setScore] = useState(0)
  const rafRef = useRef<number>()
  const startRef = useRef<number | undefined>(undefined)
  const targetScore = profile.match_score ?? 94

  useEffect(() => {
    setHearts(
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        size: 10 + Math.random() * 18,
        delay: Math.random() * 2.6,
        duration: 3.0 + Math.random() * 2.0,
        wobble: (Math.random() - 0.5) * 55,
        rotate: Math.random() * 40 - 20,
      }))
    )
  }, [])

  useEffect(() => {
    const duration = 1800
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now
      const progress = Math.min((now - startRef.current) / duration, 1)
      setScore(Math.round(easeOut(progress) * targetScore))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, 700)
    return () => {
      clearTimeout(timeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetScore])

  const age = profile.birthdate
    ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear()
    : null

  const sharedInterests = (user?.interests ?? []).filter(interest =>
    profile.interests?.some(pi => pi.toLowerCase() === interest.toLowerCase())
  )

  const r = 28
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - score / 100)

  const userPhoto = user?.photos?.[0]
  const matchPhoto = profile.photos?.[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(4,1,6,0.94)', backdropFilter: 'blur(10px)' }}
    >
      {/* Gold radial flash */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.65, 0] }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 35%, rgba(201,168,76,0.65) 0%, rgba(114,47,55,0.22) 55%, transparent 78%)',
        }}
      />

      {/* Confetti hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hearts.map(h => (
          <motion.svg
            key={h.id}
            viewBox="0 0 40 37"
            width={h.size}
            height={h.size}
            className="absolute"
            style={{ left: `${h.x}%`, top: -50 }}
            initial={{ y: 0, opacity: 1, rotate: h.rotate }}
            animate={{
              y: 1400,
              opacity: [1, 1, 1, 0],
              x: [0, h.wobble, -h.wobble * 0.55, h.wobble * 0.25, 0],
            }}
            transition={{
              y: { duration: h.duration, delay: h.delay, ease: 'easeIn' },
              opacity: { duration: h.duration, delay: h.delay, times: [0, 0.45, 0.78, 1] },
              x: { duration: h.duration, delay: h.delay, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] },
            }}
          >
            <path
              d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"
              fill={h.color}
            />
          </motion.svg>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors z-10"
      >
        <X className="w-5 h-5 text-cream-200" />
      </button>

      {/* Modal card */}
      <motion.div
        initial={{ scale: 0.80, opacity: 0, y: 45 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 270, damping: 22, delay: 0.08 }}
        className="relative w-full max-w-sm rounded-[32px] overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #1d0b13 0%, #0f0609 55%, #1b0e08 100%)',
          border: '1px solid rgba(201,168,76,0.20)',
          boxShadow: '0 0 110px rgba(114,47,55,0.55), 0 50px 120px rgba(0,0,0,0.95)',
        }}
      >
        {/* Top gold shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/55 to-transparent" />

        <div className="px-7 pt-9 pb-8">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="text-center text-[11px] tracking-[0.28em] uppercase font-medium mb-5"
            style={{ color: 'rgba(201,168,76,0.62)' }}
          >
            It&apos;s a Match
          </motion.p>

          {/* Photos + connector */}
          <div className="flex items-center justify-center mb-6">
            {/* User photo — slides in from left */}
            <motion.div
              initial={{ x: -75, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.30 }}
              className="w-[92px] h-[92px] rounded-full overflow-hidden flex-shrink-0"
              style={{
                border: '3px solid #722F37',
                boxShadow: '0 0 26px rgba(114,47,55,0.7)',
              }}
            >
              {userPhoto ? (
                <img src={userPhoto} alt="You" className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#722F37] to-[#4A1520]">
                  <span className="text-cream-100 text-3xl font-serif font-bold">{user?.name?.[0] ?? '?'}</span>
                </div>
              )}
            </motion.div>

            {/* Pulsing gold heart connector */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.56 }}
              className="relative z-10 flex-shrink-0"
              style={{ margin: '0 -12px' }}
            >
              <motion.svg
                viewBox="0 0 40 37"
                width={42}
                height={42}
                animate={{ scale: [1, 1.26, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.95))' }}
              >
                <path
                  d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"
                  fill="#C9A84C"
                />
              </motion.svg>
            </motion.div>

            {/* Match photo — slides in from right */}
            <motion.div
              initial={{ x: 75, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.30 }}
              className="w-[92px] h-[92px] rounded-full overflow-hidden flex-shrink-0"
              style={{
                border: '3px solid #C9A84C',
                boxShadow: '0 0 26px rgba(201,168,76,0.55)',
              }}
            >
              {matchPhoto ? (
                <img src={matchPhoto} alt={profile.name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C9A84C] to-[#8B6914]">
                  <span className="text-[#1a0a10] text-3xl font-serif font-bold">{profile.name[0]}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Name + city */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.50 }}
            className="text-center mb-5"
          >
            <h2 className="font-serif text-3xl font-bold text-cream-100 leading-tight">
              {profile.name}{age ? `, ${age}` : ''}
            </h2>
            {profile.city && (
              <p className="mt-1 text-sm" style={{ color: 'rgba(233,212,182,0.38)' }}>{profile.city}</p>
            )}
          </motion.div>

          {/* Compatibility arc */}
          <motion.div
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.60, type: 'spring', stiffness: 220, damping: 20 }}
            className="flex justify-center mb-5"
          >
            <div className="relative w-20 h-20">
              <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0">
                <defs>
                  <linearGradient id="celebArcGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#722F37" />
                    <stop offset="100%" stopColor="#C9A84C" />
                  </linearGradient>
                </defs>
                <circle
                  cx="40" cy="40" r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle
                  cx="40" cy="40" r={r}
                  fill="none"
                  stroke="url(#celebArcGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '40px 40px',
                    transition: 'stroke-dashoffset 0.05s linear',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-xl leading-none" style={{ color: '#C9A84C' }}>{score}%</span>
                <span className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(233,212,182,0.35)' }}>match</span>
              </div>
            </div>
          </motion.div>

          {/* Shared interests */}
          {sharedInterests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72 }}
              className="mb-6"
            >
              <p
                className="text-center text-[10px] uppercase tracking-[0.22em] mb-2.5"
                style={{ color: 'rgba(233,212,182,0.30)' }}
              >
                You both love
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {sharedInterests.slice(0, 5).map((interest, i) => (
                  <motion.span
                    key={interest}
                    initial={{ opacity: 0, scale: 0.72 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.78 + i * 0.07 }}
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      background: 'rgba(201,168,76,0.10)',
                      border: '1px solid rgba(201,168,76,0.28)',
                      color: '#C9A84C',
                    }}
                  >
                    {interest}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.84 }}
            className="flex flex-col gap-3"
          >
            <Link
              href={matchId ? `/chat/${matchId}` : `/matches`}
              onClick={onClose}
              className="block w-full py-3.5 rounded-2xl text-center font-semibold text-sm tracking-wide transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #B8923A 0%, #E8C878 48%, #B8923A 100%)',
                color: '#1a0a10',
                boxShadow: '0 4px 30px rgba(201,168,76,0.52)',
              }}
            >
              Send a Message
            </Link>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm transition-colors"
              style={{ color: 'rgba(233,212,182,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(233,212,182,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(233,212,182,0.35)')}
            >
              Keep Swiping
            </button>
          </motion.div>
        </div>

        {/* Bottom burgundy shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-burgundy-900/35 to-transparent" />
      </motion.div>
    </motion.div>
  )
}
