'use client'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useTimeOfDay } from '@/lib/useTimeOfDay'

type CSSWithVars = React.CSSProperties & { [k: `--${string}`]: string | number }

// ── Self-writing headline ──────────────────────────────────────────────────────
function WritingHeadline() {
  return (
    <h1
      className="font-serif font-bold text-burgundy-950 dark:text-cream-100 leading-[1.08]"
      style={{ fontSize: 'clamp(2.8rem, 4.8vw, 4.8rem)' }}
    >
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
  )
}

// ── Card data ──────────────────────────────────────────────────────────────────
const CHAOS_CARDS = [
  { name: 'Alex',   age: 27, score: 12, left: '6%',  top: '12%', rotate: -8  },
  { name: 'Morgan', age: 32, score: 9,  left: '30%', top: '34%', rotate: 6   },
  { name: 'Riley',  age: 29, score: 18, left: '5%',  top: '58%', rotate: -11 },
  { name: 'Casey',  age: 31, score: 7,  left: '28%', top: '74%', rotate: 8   },
]

const MATCH_CARDS = [
  { name: 'Sofia', age: 24, score: 94, tags: ['Film', 'Jazz'],    left: '8%',  top: '10%', rotate: -3 },
  { name: 'James', age: 27, score: 91, tags: ['Books', 'Coffee'], left: '30%', top: '37%', rotate: 2  },
  { name: 'Priya', age: 25, score: 88, tags: ['Art', 'Travel'],   left: '6%',  top: '62%', rotate: -6 },
]

// ── Drag-to-compare card ───────────────────────────────────────────────────────
function ComparisonCard({ dark }: { dark: boolean }) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const lineRef       = useRef<HTMLDivElement>(null)
  const rightRef      = useRef<HTMLDivElement>(null)
  const leftLblRef    = useRef<HTMLSpanElement>(null)
  const rightLblRef   = useRef<HTMLSpanElement>(null)
  const isDragging    = useRef(false)
  const [hasDragged, setHasDragged] = useState(false)

  // Drag event listeners (document-level so drag doesn't break on fast moves)
  useEffect(() => {
    const move = (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
      if (lineRef.current)    lineRef.current.style.left = `${pct}%`
      if (rightRef.current)   rightRef.current.style.clipPath = `inset(0 0 0 ${pct}%)`
      if (leftLblRef.current) leftLblRef.current.style.opacity = pct > 18 ? '1' : '0'
      if (rightLblRef.current) rightLblRef.current.style.opacity = pct < 82 ? '1' : '0'
    }

    const onMouseMove  = (e: MouseEvent)      => { if (isDragging.current) move(e.clientX) }
    const onTouchMove  = (e: TouchEvent)      => { if (isDragging.current && e.touches[0]) move(e.touches[0].clientX) }
    const onUp         = ()                   => { isDragging.current = false }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onUp)
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend',  onUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend',  onUp)
    }
  }, [])

  // Intro animation: chaos → reveal Lovemaxxing so the concept is instantly obvious
  useEffect(() => {
    if (lineRef.current)  lineRef.current.style.left = '88%'
    if (rightRef.current) rightRef.current.style.clipPath = 'inset(0 0 0 88%)'

    const tid = setTimeout(() => {
      const ease = 'clip-path 1.5s cubic-bezier(0.4,0,0.2,1)'
      if (lineRef.current)  { lineRef.current.style.transition = 'left 1.5s cubic-bezier(0.4,0,0.2,1)'; lineRef.current.style.left = '50%' }
      if (rightRef.current) { rightRef.current.style.transition = ease; rightRef.current.style.clipPath = 'inset(0 0 0 50%)' }

      setTimeout(() => {
        if (lineRef.current)  lineRef.current.style.transition = ''
        if (rightRef.current) rightRef.current.style.transition = ''
      }, 1600)
    }, 700)

    return () => clearTimeout(tid)
  }, [])

  const startDrag = () => {
    isDragging.current = true
    if (!hasDragged) setHasDragged(true)
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden select-none"
      style={{ height: 420, cursor: 'ew-resize' }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      {/* ── LEFT: other apps / chaos ──────────────────── */}
      <div
        className="absolute inset-0"
        style={{ background: dark ? '#17080C' : '#EDEAE5' }}
      >
        {/* subtle scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)' }}
        />
        {CHAOS_CARDS.map(c => (
          <div
            key={c.name}
            className="absolute rounded-xl p-2.5 w-[120px] pointer-events-none"
            style={{
              left: c.left, top: c.top,
              transform: `rotate(${c.rotate}deg)`,
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)',
              border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
              filter: 'grayscale(1)',
            }}
          >
            <div className="text-[11px] font-semibold mb-1.5"
              style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', color: dark ? '#666' : '#999' }}>
              {c.name}, {c.age}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${c.score}%`, background: dark ? '#444' : '#ccc' }} />
              </div>
              <span className="text-[9px] font-mono" style={{ color: dark ? '#555' : '#bbb' }}>{c.score}%</span>
            </div>
          </div>
        ))}
        <div className="absolute bottom-5 left-0 right-[50%] text-center pointer-events-none">
          <p className="text-[9px] uppercase tracking-[0.3em]"
            style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', color: dark ? '#555' : '#bbb' }}>
            Random matches
          </p>
          <p className="text-sm font-medium mt-0.5"
            style={{ color: dark ? '#555' : '#bbb', fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
            Swipe. Hope. Repeat.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Lovemaxxing ────────────────────────── */}
      <div
        ref={rightRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: 'inset(0 0 0 50%)',
          background: dark
            ? 'radial-gradient(ellipse at 35% 30%, rgba(114,47,55,0.38) 0%, rgba(18,6,8,0.97) 65%)'
            : 'radial-gradient(ellipse at 35% 30%, rgba(114,47,55,0.10) 0%, rgba(250,247,242,0.97) 65%)',
        }}
      >
        {/* aurora blobs — no backdrop-filter, just radial gradients */}
        <div className="absolute -top-10 right-0 w-56 h-44 rounded-full blur-[80px]"
          style={{ background: dark ? 'rgba(114,47,55,0.55)' : 'rgba(114,47,55,0.18)' }} />
        <div className="absolute bottom-8 right-4 w-44 h-36 rounded-full blur-[60px]"
          style={{ background: dark ? 'rgba(201,168,76,0.32)' : 'rgba(201,168,76,0.16)' }} />

        {MATCH_CARDS.map(c => (
          <div
            key={c.name}
            className="absolute rounded-2xl p-3 w-[138px] pointer-events-none"
            style={{
              left: c.left, top: c.top,
              transform: `rotate(${c.rotate}deg)`,
              background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.92)',
              border: dark ? '1px solid rgba(255,255,255,0.11)' : '1px solid rgba(255,255,255,0.95)',
              boxShadow: dark ? '0 8px 28px rgba(0,0,0,0.45)' : '0 6px 22px rgba(114,47,55,0.13)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: 'rgba(114,47,55,0.14)', color: '#722F37' }}>
                {c.name[0]}
              </div>
              <span
                className="text-[11px] font-semibold truncate"
                style={{ fontFamily: "'Playfair Display', serif", color: dark ? '#FAF7F2' : '#4A1520' }}>
                {c.name}, {c.age}
              </span>
            </div>
            <div className="flex gap-1 mb-1.5 flex-wrap">
              {c.tags.map(tag => (
                <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(114,47,55,0.10)', color: '#722F37' }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ background: 'rgba(114,47,55,0.10)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${c.score}%`, background: 'linear-gradient(90deg,#722F37,#C9A96E)' }} />
              </div>
              <span className="text-[9px] font-bold" style={{ color: '#722F37' }}>{c.score}%</span>
            </div>
          </div>
        ))}

        <div className="absolute bottom-5 right-0 left-[50%] text-center pointer-events-none">
          <p className="text-[9px] uppercase tracking-[0.3em] text-burgundy-700 dark:text-burgundy-400">
            Perfect matches
          </p>
          <p className="text-sm font-medium mt-0.5"
            style={{ fontFamily: "'Playfair Display', serif", color: dark ? '#FAF7F2' : '#4A1520' }}>
            Match. Connect. Love.
          </p>
        </div>
      </div>

      {/* ── DIVIDER LINE ─────────────────────────────── */}
      <div ref={lineRef} className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: '50%' }}>
        <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
        {/* Handle pill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center"
          style={{ cursor: 'ew-resize' }}
        >
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 5H15M4.5 1.5L1 5L4.5 8.5M11.5 1.5L15 5L11.5 8.5"
              stroke="#722F37" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── TOP LABELS ───────────────────────────────── */}
      <span
        ref={leftLblRef}
        className="absolute top-3 left-4 z-20 text-[9px] uppercase tracking-[0.28em] pointer-events-none transition-opacity duration-200"
        style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', color: dark ? '#555' : '#bbb' }}
      >
        Other Apps
      </span>
      <span
        ref={rightLblRef}
        className="absolute top-3 right-4 z-20 text-[9px] uppercase tracking-[0.28em] text-burgundy-700 dark:text-burgundy-400 pointer-events-none transition-opacity duration-200"
        style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}
      >
        Lovemaxxing
      </span>

      {/* ── DRAG HINT (shown until first interaction) ── */}
      {!hasDragged && (
        <motion.div
          className="absolute bottom-[52px] left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          animate={{ x: [0, -7, 7, -5, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{
              background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
              color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.42)',
              fontFamily: 'Helvetica Neue, Arial, sans-serif',
            }}
          >
            ← Drag to compare →
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Main hero section ──────────────────────────────────────────────────────────
export function SplitWorldHero({ dark }: { dark: boolean }) {
  const { heroTag, subtext } = useTimeOfDay()

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full blur-[140px]"
          style={{
            width: 680, height: 520, top: '-8%', left: '-6%',
            background: dark ? 'rgba(114,47,55,0.42)' : 'rgba(114,47,55,0.14)',
          }}
          animate={{ x: [0, 55, -30, 50, 0], y: [0, -40, 60, -20, 0], scale: [1, 1.07, 0.94, 1.05, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-[110px]"
          style={{
            width: 440, height: 360, top: '25%', right: '-4%',
            background: dark ? 'rgba(201,168,76,0.26)' : 'rgba(201,168,76,0.11)',
          }}
          animate={{ x: [0, -40, 25, -32, 0], y: [0, 45, -25, 38, 0], scale: [1, 0.93, 1.1, 0.97, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        />
        <motion.div
          className="absolute rounded-full blur-[100px]"
          style={{
            width: 300, height: 260, bottom: '8%', left: '18%',
            background: dark ? 'rgba(158,26,43,0.24)' : 'rgba(158,26,43,0.09)',
          }}
          animate={{ x: [0, 35, -42, 22, 0], y: [0, -50, 30, -38, 0], scale: [1, 1.12, 0.9, 1.06, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 11 }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pt-28 pb-16 relative z-10">

        {/* ── Left: headline + CTAs ────────────────────── */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-burgundy-900/20 dark:border-burgundy-900/40 bg-burgundy-900/[0.07] dark:bg-burgundy-900/10 text-burgundy-700 dark:text-burgundy-300 text-sm font-medium mb-8 self-start"
          >
            <Sparkles className="w-4 h-4" />
            {heroTag}
          </motion.div>

          <WritingHeadline />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.9 }}
            className="text-base md:text-lg text-burgundy-800/60 dark:text-cream-300/55 max-w-sm mb-8 mt-5 leading-relaxed"
          >
            {subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/signup" data-magnetic className="btn-primary flex items-center gap-2 text-base px-10 py-4">
              Find Your Match <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 font-medium transition-colors flex items-center gap-1.5 text-sm self-center"
            >
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

        {/* ── Right: drag-to-compare card ──────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
          className="flex flex-col justify-center"
        >
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-3 lg:text-left text-center"
            style={{
              fontFamily: 'Helvetica Neue, Arial, sans-serif',
              color: dark ? 'rgba(250,247,242,0.28)' : 'rgba(114,47,55,0.35)',
            }}
          >
            See the difference
          </p>
          <ComparisonCard dark={dark} />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
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
