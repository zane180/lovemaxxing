'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onComplete: () => void
}

// Writing duration (seconds) — must match clip-path & pen transitions
const WRITE_S = 2.3

// Millisecond timestamps for each phase
const T = {
  write:  380,   // start clip reveal + pen
  morph:  2900,  // "o" → heart
  arrow:  3450,  // arrow launches from left
  hit:    4080,  // arrowhead reaches heart
  exit:   4650,  // splash fades out
  done:   5500,  // onComplete fires
}

/* ─────────── SVG pieces ─────────── */

function QuillPen() {
  return (
    <svg width="20" height="58" viewBox="0 0 20 58" fill="none">
      {/* Central spine */}
      <path d="M10 1 Q13 18 10 54" stroke="#8B5A63" strokeWidth="1" fill="none" />
      <path d="M10 1 Q7 18 10 54"  stroke="#8B5A63" strokeWidth="0.7" fill="none" opacity="0.55" />
      {/* Right barbs */}
      {[5,10,16,22,28,35,41].map((y, i) => (
        <path key={`r${i}`}
          d={`M10 ${y} Q${13+i*0.4} ${y+2} ${16+i*0.15} ${y+5}`}
          stroke="#9E6670" strokeWidth="0.65" fill="none"
          opacity={Math.max(0.1, 0.58 - i * 0.07)}
        />
      ))}
      {/* Left barbs */}
      {[5,10,16,22,28,35,41].map((y, i) => (
        <path key={`l${i}`}
          d={`M10 ${y} Q${7-i*0.4} ${y+2} ${4-i*0.15} ${y+5}`}
          stroke="#9E6670" strokeWidth="0.65" fill="none"
          opacity={Math.max(0.1, 0.58 - i * 0.07)}
        />
      ))}
      {/* Nib tip */}
      <path d="M10 50 L8.8 58 L10 55 L11.2 58 Z" fill="#722F37" />
    </svg>
  )
}

function HeartSVG({ pulse }: { pulse: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 40 37"
      fill="#722F37"
      style={{ width: '0.62em', height: '0.57em', display: 'inline-block', overflow: 'visible' }}
      animate={pulse ? {
        scale:  [1.25, 2.0, 1.15, 1.4],
        filter: [
          'drop-shadow(0 0 3px rgba(114,47,55,0.5))',
          'drop-shadow(0 0 18px rgba(114,47,55,1))',
          'drop-shadow(0 0 10px rgba(114,47,55,0.7))',
          'drop-shadow(0 0 5px rgba(114,47,55,0.35))',
        ],
      } : {}}
      transition={pulse ? { duration: 0.55, ease: 'easeOut' } : {}}
    >
      <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z" />
    </motion.svg>
  )
}

function CupidArrow() {
  return (
    <svg width="260" height="28" viewBox="0 0 260 28" fill="none">
      {/* Tail feathers */}
      <path d="M0 14 L15 5"  stroke="#722F37" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M0 14 L15 14" stroke="#722F37" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M0 14 L15 23" stroke="#722F37" strokeWidth="2.2" strokeLinecap="round" />
      {/* Shaft */}
      <line x1="15" y1="14" x2="238" y2="14" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
      {/* Diamond arrowhead */}
      <path d="M238 14 L249 6 L260 14 L249 22 Z" fill="#722F37" />
    </svg>
  )
}

/* ─────────── Main component ─────────── */

export default function SplashScreen({ onComplete }: Props) {
  type Phase = 'idle' | 'writing' | 'morphing' | 'arrow' | 'hit' | 'exit'
  const [phase, setPhase] = useState<Phase>('idle')
  const wrapRef  = useRef<HTMLDivElement>(null)
  const heartRef = useRef<HTMLSpanElement>(null)
  const [wrapW,    setWrapW]    = useState(0)
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 })

  // Measure text container once font is ready
  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setWrapW(wrapRef.current.offsetWidth)
    }
    document.fonts.ready.then(measure)
    measure()
  }, [])

  // Phase timeline
  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setPhase('writing'),  T.write),
      setTimeout(() => setPhase('morphing'), T.morph),
      setTimeout(() => {
        if (heartRef.current) {
          const r = heartRef.current.getBoundingClientRect()
          setHeartPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }
        setPhase('arrow')
      }, T.arrow),
      setTimeout(() => setPhase('hit'),  T.hit),
      setTimeout(() => setPhase('exit'), T.exit),
      setTimeout(onComplete,             T.done),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onComplete])

  const writing  = phase !== 'idle'
  const morphed  = ['morphing','arrow','hit','exit'].includes(phase)
  const arrowing = ['arrow','hit','exit'].includes(phase)
  const hit      = ['hit','exit'].includes(phase)

  // Arrow tip should land at heart center; SVG arrowhead is at x=260 within the SVG
  const arrowFinalX = heartPos.x - 260  // left edge position when tip is at heartPos.x

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #FAF7F2 0%, #F5EDE8 60%, #F0E8E2 100%)' }}
      initial={{ opacity: 1 }}
      animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.95, ease: 'easeInOut' }}
    >
      {/* Ambient glow behind text */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 220,
          background: 'radial-gradient(ellipse, rgba(114,47,55,0.07) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* ── Text + pen wrapper ── */}
      <div className="relative inline-flex flex-col items-center">

        {/* Quill pen cursor, sweeps left → right above the text */}
        <AnimatePresence>
          {writing && !morphed && wrapW > 0 && (
            <motion.div
              key="pen"
              className="absolute pointer-events-none"
              style={{ bottom: '100%', left: 0, marginBottom: 4 }}
              initial={{ x: 0, rotate: -28, opacity: 0 }}
              animate={{ x: wrapW, rotate: -28, opacity: 1 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
              transition={{
                x:       { duration: WRITE_S, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { duration: 0.18 },
              }}
            >
              <QuillPen />
            </motion.div>
          )}
        </AnimatePresence>

        {/* "lovemaxxing" in Dancing Script with clip-path write-on reveal */}
        <div ref={wrapRef}>
          <motion.div
            className="select-none flex items-baseline"
            style={{
              fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
              fontWeight: 700,
              fontSize: 'clamp(52px, 12vw, 92px)',
              color: '#722F37',
              lineHeight: 1.3,
            }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={writing ? { clipPath: 'inset(0 0% 0 0)' } : {}}
            transition={{ duration: WRITE_S, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* "l" */}
            <span>l</span>

            {/* "o" morphs into a heart */}
            <span
              className="relative inline-flex items-center justify-center"
              ref={heartRef}
            >
              {/* The letter */}
              <motion.span
                className="inline-block"
                animate={morphed
                  ? { opacity: 0, scale: 0.2, filter: 'blur(5px)' }
                  : { opacity: 1, scale: 1,   filter: 'blur(0px)' }}
                transition={{ duration: 0.38, ease: 'easeIn' }}
              >
                o
              </motion.span>

              {/* Heart replacement */}
              <motion.span
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0, rotate: -15 }}
                animate={morphed ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <HeartSVG pulse={hit} />
              </motion.span>
            </span>

            {/* rest of the word */}
            <span>vemaxxing</span>
          </motion.div>
        </div>

        {/* Ink underline that draws in after writing completes */}
        <AnimatePresence>
          {morphed && (
            <motion.div
              key="underline"
              className="rounded-full"
              style={{
                marginTop: 4,
                height: 1.5,
                background: 'rgba(114,47,55,0.22)',
                width: 0,
              }}
              animate={{ width: wrapW || '100%', opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Cupid arrow — fixed, flies across full viewport ── */}
      <AnimatePresence>
        {arrowing && heartPos.x > 0 && (
          <motion.div
            key="arrow"
            className="fixed pointer-events-none"
            style={{ top: heartPos.y - 14, left: 0, zIndex: 201 }}
            initial={{ x: -800, opacity: 1 }}
            animate={hit
              ? { x: arrowFinalX + 18, opacity: 0 }   // burst past the heart + fade
              : { x: arrowFinalX }                      // land tip-on-heart
            }
            transition={hit
              ? { duration: 0.14, ease: 'easeIn' }
              : { duration: 0.63, ease: [0.55, 0, 0.8, 0.42] }
            }
          >
            <CupidArrow />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Impact sparkles ── */}
      <AnimatePresence>
        {hit && heartPos.x > 0 && (
          <motion.div
            key="sparks"
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 202 }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle  = (i / 12) * Math.PI * 2
              const radius = 28 + (i % 4) * 14
              const size   = i % 3 === 0 ? 8 : i % 3 === 1 ? 5 : 3
              const colors = ['#722F37', '#C9A84C', '#B08090', '#9E2020', '#E8C870']
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width:  size,
                    height: size,
                    background: colors[i % colors.length],
                    top:  heartPos.y - size / 2,
                    left: heartPos.x - size / 2,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x:       Math.cos(angle) * radius,
                    y:       Math.sin(angle) * radius,
                    opacity: 0,
                    scale:   0,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 + i * 0.012 }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
