'use client'
import React, { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useTimeOfDay } from '@/lib/useTimeOfDay'

// ── Grey-world chaos cards ───────────────────────────────────────────────────
const CHAOS_CARDS = [
  { name: 'Alex',   age: 27, score: 31, l: '6%',  t: '26%', r: -8  },
  { name: 'Morgan', age: 25, score: 22, l: '26%', t: '16%', r: 5   },
  { name: 'Riley',  age: 29, score: 41, l: '10%', t: '52%', r: -13 },
  { name: 'Casey',  age: 31, score: 18, l: '30%', t: '60%', r: 9   },
  { name: 'Taylor', age: 24, score: 35, l: '3%',  t: '72%', r: -4  },
]

function ChaoticCard({ name, age, score, l, t, r, idx }: typeof CHAOS_CARDS[0] & { idx: number }) {
  return (
    <motion.div
      className="absolute bg-gray-100 border border-gray-200/90 rounded-xl p-3 w-36 shadow-sm select-none"
      style={{ left: l, top: t, rotate: r, zIndex: idx, filter: 'grayscale(1) contrast(0.88)' }}
      animate={{ rotate: [r, r + 2.5, r - 1.5, r], y: [0, -5, 3, 0] }}
      transition={{ duration: 3.5 + idx * 0.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.25 }}
    >
      <div className="w-7 h-7 rounded-full bg-gray-300 mb-2 flex items-center justify-center text-[10px] font-bold text-gray-400">
        {name[0]}
      </div>
      <div className="text-xs font-bold text-gray-500 mb-1.5" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
        {name}, {age}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-350 rounded-full" style={{ width: `${score}%`, background: '#ccc' }} />
        </div>
        <span className="text-[9px] text-gray-400 font-mono">{score}%</span>
      </div>
    </motion.div>
  )
}

type CSSWithVars = React.CSSProperties & { [k: `--${string}`]: string | number }

// ── Self-writing headline via CSS mask sweep ─────────────────────────────────
function WritingHeadline() {
  return (
    <div>
      <h1 className="font-serif font-bold text-burgundy-950 dark:text-cream-100 leading-[1.08]"
        style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.6rem)' }}>
        <span className="block writing-reveal" style={{ '--delay': '0.2s' } as CSSWithVars}>
          Stop Swiping.
        </span>
        <span
          className="block writing-reveal"
          style={{
            '--delay': '0.9s',
            fontFamily: "'Great Vibes', cursive",
            background: 'linear-gradient(135deg, #C9A96E 0%, #B8923A 50%, #C9A96E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            padding: '0.15em 0.05em',
            fontSize: '1.12em',
          } as CSSWithVars}
        >
          Start Connecting.
        </span>
      </h1>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function SplitWorldHero({ dark }: { dark: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftRef      = useRef<HTMLDivElement>(null)
  const rightRef     = useRef<HTMLDivElement>(null)
  const divLineRef   = useRef<HTMLDivElement>(null)
  const { heroTag, subtext } = useTimeOfDay()

  // Direct DOM update — bypasses React state for smooth 60fps cursor tracking
  const setDivider = useCallback((pct: number) => {
    const p = Math.min(84, Math.max(16, pct))
    if (leftRef.current)
      leftRef.current.style.clipPath = `polygon(0 0,${p}% 0,${p}% 100%,0 100%)`
    if (rightRef.current)
      rightRef.current.style.clipPath = `polygon(${p}% 0,100% 0,100% 100%,${p}% 100%)`
    if (divLineRef.current)
      divLineRef.current.style.left = `${p}%`
  }, [])

  useEffect(() => {
    // Animate intro: center → slight Lovemaxxing favour
    setDivider(50)
    const t = setTimeout(() => {
      if (leftRef.current)   leftRef.current.style.transition   = 'clip-path 1.2s cubic-bezier(0.4,0,0.2,1)'
      if (rightRef.current)  rightRef.current.style.transition  = 'clip-path 1.2s cubic-bezier(0.4,0,0.2,1)'
      if (divLineRef.current) divLineRef.current.style.transition = 'left 1.2s cubic-bezier(0.4,0,0.2,1)'
      setDivider(42)
      setTimeout(() => {
        // Remove slow transition so cursor tracking is instant
        if (leftRef.current)   leftRef.current.style.transition   = 'clip-path 0.04s linear'
        if (rightRef.current)  rightRef.current.style.transition  = 'clip-path 0.04s linear'
        if (divLineRef.current) divLineRef.current.style.transition = 'left 0.04s linear'
      }, 1300)
    }, 500)
    return () => clearTimeout(t)
  }, [setDivider])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setDivider(((e.clientX - rect.left) / rect.width) * 100)
  }, [setDivider])

  const onMouseLeave = useCallback(() => {
    if (leftRef.current)   leftRef.current.style.transition   = 'clip-path 0.9s cubic-bezier(0.4,0,0.2,1)'
    if (rightRef.current)  rightRef.current.style.transition  = 'clip-path 0.9s cubic-bezier(0.4,0,0.2,1)'
    if (divLineRef.current) divLineRef.current.style.transition = 'left 0.9s cubic-bezier(0.4,0,0.2,1)'
    setDivider(42)
    setTimeout(() => {
      if (leftRef.current)   leftRef.current.style.transition   = 'clip-path 0.04s linear'
      if (rightRef.current)  rightRef.current.style.transition  = 'clip-path 0.04s linear'
      if (divLineRef.current) divLineRef.current.style.transition = 'left 0.04s linear'
    }, 950)
  }, [setDivider])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* ── LEFT: Grey world ────────────────────────────────────────── */}
      <div ref={leftRef} className="absolute inset-0" style={{ clipPath: 'polygon(0 0,50% 0,50% 100%,0 100%)' }}>
        <div className="absolute inset-0 bg-[#F0EEE9] dark:bg-[#141414]">
          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-25"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.045) 3px,rgba(0,0,0,0.045) 4px)' }}
          />
          {/* Glitch lines */}
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              className="absolute left-0 right-0 h-px"
              style={{ top: `${22 + i * 22}%`, background: 'rgba(100,100,100,0.18)' }}
              animate={{ opacity: [0, 0.7, 0], scaleX: [0.6, 1, 0.8] }}
              transition={{ duration: 2.5 + i * 0.8, repeat: Infinity, delay: i * 1.1, ease: 'easeInOut' }}
            />
          ))}
          {CHAOS_CARDS.map((card, i) => (
            <ChaoticCard key={card.name} {...card} idx={i + 1} />
          ))}
          {/* Grey-world label */}
          <div className="absolute bottom-[22%] left-0 right-0 text-center pointer-events-none px-6">
            <div className="text-gray-400 text-[10px] tracking-[0.4em] uppercase mb-2"
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Every other app
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xl font-semibold"
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              Swipe. Mismatch. Repeat.
            </div>
          </div>
        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div ref={divLineRef} className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: '50%' }}>
        <div className="absolute inset-0 w-px bg-white/55 shadow-[0_0_16px_rgba(255,255,255,0.55)]" />
        {/* Handle pill */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white/85 dark:bg-white/20 backdrop-blur-md border border-white/70 flex items-center justify-center shadow-xl">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 5H13M4.5 1.5L1 5L4.5 8.5M9.5 1.5L13 5L9.5 8.5" stroke="#722F37" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── RIGHT: Lovemaxxing world ─────────────────────────────────── */}
      <div ref={rightRef} className="absolute inset-0" style={{ clipPath: 'polygon(50% 0,100% 0,100% 100%,50% 100%)' }}>
        {/* Aurora blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div className="absolute rounded-full blur-[130px]"
            style={{ width: 580, height: 440, top: '-8%', right: '-10%',
              background: dark
                ? 'radial-gradient(ellipse, rgba(114,47,55,0.52) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(114,47,55,0.22) 0%, transparent 70%)',
            }}
            animate={{ x:[0,45,-25,45,0], y:[0,-35,55,-18,0], scale:[1,1.08,0.94,1.05,1] }}
            transition={{ duration:18, repeat:Infinity, ease:'easeInOut' }}
          />
          <motion.div className="absolute rounded-full blur-[110px]"
            style={{ width: 380, height: 300, bottom: '8%', right: '6%',
              background: dark
                ? 'radial-gradient(ellipse, rgba(201,168,76,0.3) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(201,168,76,0.16) 0%, transparent 70%)',
            }}
            animate={{ x:[0,-38,22,-28,0], y:[0,42,-22,36,0], scale:[1,0.93,1.1,0.97,1] }}
            transition={{ duration:22, repeat:Infinity, ease:'easeInOut', delay:4 }}
          />
          <motion.div className="absolute rounded-full blur-[90px]"
            style={{ width: 280, height: 240, top: '35%', right: '35%',
              background: dark
                ? 'radial-gradient(ellipse, rgba(158,26,43,0.28) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(158,26,43,0.12) 0%, transparent 70%)',
            }}
            animate={{ x:[0,30,-40,20,0], y:[0,-45,28,-35,0], scale:[1,1.12,0.9,1.06,1] }}
            transition={{ duration:15, repeat:Infinity, ease:'easeInOut', delay:8 }}
          />
        </div>

        {/* Soft particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 2 + (i % 3), height: 2 + (i % 3),
              left: `${55 + (i * 4.1) % 38}%`,
              top:  `${10 + (i * 6.7) % 72}%`,
              background: dark ? 'rgba(250,247,242,0.3)' : 'rgba(114,47,55,0.25)',
            }}
            animate={{ opacity:[0.2,0.8,0.2], scale:[1,1.7,1] }}
            transition={{ duration: 2.2 + (i % 4) * 0.6, repeat: Infinity, delay: i * 0.28 }}
          />
        ))}

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-xl mx-auto px-8 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-burgundy-900/20 dark:border-burgundy-900/40 bg-burgundy-900/[0.07] dark:bg-burgundy-900/10 text-burgundy-700 dark:text-burgundy-300 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              {heroTag}
            </motion.div>

            <WritingHeadline />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.9 }}
              className="text-base md:text-lg text-burgundy-800/60 dark:text-cream-300/55 max-w-sm mx-auto mb-8 mt-5 leading-relaxed"
            >
              {subtext}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup" data-magnetic className="btn-primary flex items-center gap-2 text-base px-10 py-4">
                Find Your Match <ChevronRight className="w-5 h-5" />
              </Link>
              <Link href="/login"
                className="text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 font-medium transition-colors flex items-center gap-1.5 text-sm">
                Sign in <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.9 }}
              className="mt-5 text-xs text-burgundy-800/30 dark:text-cream-300/22"
            >
              Free to join · No credit card required
            </motion.p>
          </div>
        </div>

        {/* Corner brand label */}
        <div className="absolute bottom-[21%] right-6 text-right pointer-events-none">
          <div className="text-burgundy-600/40 dark:text-burgundy-400/40 text-[10px] tracking-[0.4em] uppercase mb-1.5">Lovemaxxing</div>
          <div className="font-serif text-burgundy-900/70 dark:text-cream-100/60 text-lg font-semibold">Match. Connect. Love.</div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2, duration: 0.6 }}
      >
        <motion.div
          className="w-px h-10 bg-gradient-to-b from-transparent via-burgundy-900/30 dark:via-cream-100/25 to-transparent"
          animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
