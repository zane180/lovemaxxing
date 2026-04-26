'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'

interface Props {
  onComplete: () => void
}

// Total ~11 s — slow, cinematic, romantic
const WRITE_S = 4.2   // seconds for the word to appear

const T = {
  startWrite:   900,    // pen begins tracing
  penLift:      5300,   // pen lifts off
  morphStart:   5600,   // "a" → heart
  morphEnd:     6500,   // heart fully formed
  heartPulse:   6700,   // first heartbeat
  arrowLaunch:  7200,   // golden arrow leaves
  arrowHit:     9100,   // tip strikes the heart
  impactSettle: 9800,
  fadeStart:    10100,
  done:         11800,
}

/* ─────────── SVG components ─────────── */

function QuillPen() {
  // Drawn vertically (nib at bottom, plume at top).
  // Parent rotates -30° to give writing angle.
  return (
    <svg width="52" height="136" viewBox="0 0 52 136" fill="none">

      {/* ── Plume tip: wispy branching strands ── */}
      {[
        { cx: -22, cy: 7,  ex: -30, ey: 18 },
        { cx: -17, cy: 8,  ex: -22, ey: 20 },
        { cx: -12, cy: 9,  ex: -16, ey: 21 },
        { cx: -7,  cy: 9,  ex: -9,  ey: 22 },
        { cx: -3,  cy: 10, ex: -4,  ey: 23 },
        { cx:  3,  cy: 10, ex:  4,  ey: 23 },
        { cx:  7,  cy: 9,  ex:  9,  ey: 22 },
        { cx:  12, cy: 9,  ex:  16, ey: 21 },
        { cx:  17, cy: 8,  ex:  22, ey: 20 },
        { cx:  22, cy: 7,  ex:  30, ey: 18 },
      ].map(({ cx, cy, ex, ey }, i) => (
        <path key={`tp${i}`}
          d={`M26 4 Q${26+cx} ${cy} ${26+ex} ${ey}`}
          stroke="rgba(255,252,245,0.52)"
          strokeWidth="0.55"
          fill="none"
        />
      ))}

      {/* ── Second-tier wispy tips ── */}
      {[
        { cx: -30, cy: 14, ex: -36, ey: 26 },
        { cx: -20, cy: 15, ex: -26, ey: 28 },
        { cx: -10, cy: 16, ex: -13, ey: 29 },
        { cx:  10, cy: 16, ex:  13, ey: 29 },
        { cx:  20, cy: 15, ex:  26, ey: 28 },
        { cx:  30, cy: 14, ex:  36, ey: 26 },
      ].map(({ cx, cy, ex, ey }, i) => (
        <path key={`tt${i}`}
          d={`M26 4 Q${26+cx} ${cy} ${26+ex} ${ey}`}
          stroke="rgba(255,250,240,0.35)"
          strokeWidth="0.45"
          fill="none"
        />
      ))}

      {/* ── Rachis (central spine) ── */}
      <path d="M26 3 C26.5 38 26 78 25 122" stroke="#C4A882" strokeWidth="1.5" fill="none" opacity="0.9"/>

      {/* ── Left vane barbs ── */}
      {[8,14,20,26,32,38,44,50,57,64,71,78].map((y, i) => {
        const spread  = Math.max(5, 20 - i * 1.2)
        const outerX  = 26 - spread
        const controlX= 26 - spread * 0.55
        const cy      = y + 4
        const opacity = i < 4 ? 0.72 : i < 8 ? 0.56 : 0.4
        const sw      = Math.max(0.38, 0.85 - i * 0.03)
        return (
          <path key={`lb${i}`}
            d={`M26 ${y} Q${controlX} ${cy} ${outerX} ${cy + 3}`}
            stroke={`rgba(255,250,242,${opacity})`}
            strokeWidth={sw}
            fill="none"
          />
        )
      })}

      {/* ── Right vane barbs ── */}
      {[8,14,20,26,32,38,44,50,57,64,71,78].map((y, i) => {
        const spread  = Math.max(5, 20 - i * 1.2)
        const outerX  = 26 + spread
        const controlX= 26 + spread * 0.55
        const cy      = y + 4
        const opacity = i < 4 ? 0.72 : i < 8 ? 0.56 : 0.4
        const sw      = Math.max(0.38, 0.85 - i * 0.03)
        return (
          <path key={`rb${i}`}
            d={`M26 ${y} Q${controlX} ${cy} ${outerX} ${cy + 3}`}
            stroke={`rgba(255,250,242,${opacity})`}
            strokeWidth={sw}
            fill="none"
          />
        )
      })}

      {/* ── Fine inner barbules (secondary feather texture) ── */}
      {[10, 22, 34, 46].map((y, row) => (
        <g key={`bu${row}`}>
          <path d={`M23 ${y} Q19 ${y+3} 16 ${y+5}`}  stroke="rgba(255,252,246,0.28)" strokeWidth="0.4" fill="none"/>
          <path d={`M29 ${y} Q33 ${y+3} 36 ${y+5}`}  stroke="rgba(255,252,246,0.28)" strokeWidth="0.4" fill="none"/>
          <path d={`M22 ${y+4} Q17 ${y+7} 14 ${y+9}`} stroke="rgba(255,252,246,0.18)" strokeWidth="0.35" fill="none"/>
          <path d={`M30 ${y+4} Q35 ${y+7} 38 ${y+9}`} stroke="rgba(255,252,246,0.18)" strokeWidth="0.35" fill="none"/>
        </g>
      ))}

      {/* ── Calamus (barrel / hollow quill) ── */}
      <path d="M24.5 80 C24 95 23.5 108 23 122" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M27.5 80 C28 95 28.5 108 29 122" stroke="#A87E28" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Barrel sheen */}
      <path d="M25.5 82 C25.5 96 25.5 110 25.5 120" stroke="rgba(255,225,120,0.38)" strokeWidth="0.9" fill="none"/>

      {/* ── Nib ── */}
      <path d="M22.5 119 L20 132 L26 127 L26 136 L26 127 L32 132 L29.5 119 Z" fill="#C9A84C"/>
      {/* Nib slit */}
      <path d="M25.5 124 L26 136 L26.5 124" stroke="#7A5010" strokeWidth="0.75" fill="none"/>
      {/* Nib highlight */}
      <path d="M22.5 119 L24 128" stroke="rgba(255,230,140,0.45)" strokeWidth="0.8" fill="none"/>
    </svg>
  )
}

function HeartSVG({ pulse }: { pulse: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 40 37"
      fill="#722F37"
      style={{ width: '0.6em', height: '0.55em', display: 'inline-block', overflow: 'visible' }}
      animate={pulse ? {
        scale:  [1.1, 1.85, 1.05, 1.3],
        filter: [
          'drop-shadow(0 0 4px rgba(114,47,55,0.6))',
          'drop-shadow(0 0 22px rgba(114,47,55,1))',
          'drop-shadow(0 0 10px rgba(114,47,55,0.7))',
          'drop-shadow(0 0 6px rgba(114,47,55,0.35))',
        ],
      } : {}}
      transition={pulse ? { duration: 0.65, ease: 'easeOut' } : {}}
    >
      <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
    </motion.svg>
  )
}

function GoldenArrow({ length = 290 }: { length?: number }) {
  return (
    <svg width={length} height="32" viewBox={`0 0 ${length} 32`} fill="none">
      {/* Fletching */}
      <path d="M0 16 L18 5"  stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M0 16 L18 16" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M0 16 L18 27" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round"/>
      {/* Fletching inner detail */}
      <path d="M5 16 L15  9" stroke="rgba(255,228,110,0.55)" strokeWidth="1" strokeLinecap="round"/>
      <path d="M5 16 L15 23" stroke="rgba(255,228,110,0.55)" strokeWidth="1" strokeLinecap="round"/>

      {/* Shaft */}
      <line x1="18" y1="16" x2={length - 24} y2="16" stroke="#C9A84C" strokeWidth="2.8" strokeLinecap="round"/>
      {/* Shaft highlight */}
      <line x1="18" y1="14.5" x2={length - 24} y2="14.5" stroke="rgba(255,235,140,0.65)" strokeWidth="1" strokeLinecap="round"/>
      {/* Shaft shadow */}
      <line x1="18" y1="17.5" x2={length - 24} y2="17.5" stroke="rgba(160,110,10,0.4)"  strokeWidth="0.8" strokeLinecap="round"/>

      {/* Arrowhead diamond */}
      <path d={`M${length-24} 16 L${length-9} 5 L${length} 16 L${length-9} 27 Z`} fill="#C9A84C"/>
      {/* Arrowhead highlight */}
      <path d={`M${length-24} 16 L${length-9} 5 L${length-5} 12 Z`} fill="rgba(255,235,140,0.55)"/>
      {/* Arrowhead edge */}
      <path d={`M${length-24} 16 L${length-9} 5 L${length} 16 L${length-9} 27 Z`}
        stroke="rgba(160,110,10,0.6)" strokeWidth="0.6" fill="none"/>
    </svg>
  )
}

/* ─────────── Main component ─────────── */

export default function SplashScreen({ onComplete }: Props) {
  type Phase = 'idle' | 'writing' | 'morphing' | 'arrow' | 'hit' | 'exit'
  const [phase, setPhase] = useState<Phase>('idle')

  const wrapRef  = useRef<HTMLDivElement>(null)
  const aRef     = useRef<HTMLSpanElement>(null)
  const [wrapW,  setWrapW]  = useState(0)
  const [aPos,   setAPos]   = useState({ x: 0, y: 0 })

  // Motion values for the quill tip position (x = 0→wrapW, y = oscillates with letter heights)
  const writeProgress = useMotionValue(0)

  // x: left edge of text → right edge
  const penX = useTransform(writeProgress, [0, 1], [0, wrapW])

  // y: nib height offset from bottom of text container.
  // Quill is anchored at bottom:0 (nib at baseline/bottom of text).
  // Negative = move nib UP into the text (toward x-height and ascenders).
  // lovemaxxing = l(0) o(1) v(2) e(3) m(4) a(5) x(6) x(7) i(8) n(9) g(10)
  const penY = useTransform(
    writeProgress,
    [0,    0.02,  0.07,  0.13,  0.18,  0.23,  0.27,  0.32,  0.37,  0.41,  0.47,  0.52,  0.58,  0.63,  0.67,  0.73,  0.79,  0.85,  0.92,  0.97,  1.0 ],
    [-75, -112,  -88,   -72,   -68,   -56,   -70,   -82,   -90,   -70,   -68,   -65,   -68,   -68,   -65,   -60,   -70,  -108,   -66,   -72,  -42  ]
  )

  // Measure the text container width after fonts load
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
      setTimeout(() => setPhase('writing'), T.startWrite),

      setTimeout(() => setPhase('morphing'), T.morphStart),

      setTimeout(() => {
        if (aRef.current) {
          const r = aRef.current.getBoundingClientRect()
          setAPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }
        setPhase('arrow')
      }, T.arrowLaunch),

      setTimeout(() => setPhase('hit'),  T.arrowHit),
      setTimeout(() => setPhase('exit'), T.fadeStart),
      setTimeout(onComplete,             T.done),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onComplete])

  // Drive writeProgress when writing starts
  useEffect(() => {
    if (phase !== 'writing') return
    const ctrl = animate(writeProgress, 1, { duration: WRITE_S, ease: [0.25, 0.08, 0.6, 1] })
    return () => ctrl.stop()
  }, [phase, writeProgress])

  const writing  = phase !== 'idle'
  const morphed  = ['morphing','arrow','hit','exit'].includes(phase)
  const arrowing = ['arrow','hit','exit'].includes(phase)
  const hit      = ['hit','exit'].includes(phase)

  // Golden arrow geometry: flies from bottom-left to the "a"
  const arrowLen = 290
  const screenH  = typeof window !== 'undefined' ? window.innerHeight : 800
  // Angle from bottom-left corner toward the "a" position
  const dx       = aPos.x - 0
  const dy       = aPos.y - screenH
  const angleRad = Math.atan2(dy, dx)
  const angleDeg = angleRad * (180 / Math.PI)

  // Position the element so the tip (at arrowLen along arrow direction) lands at aPos
  const finalElemX = aPos.x - arrowLen * Math.cos(angleRad)
  const finalElemY = aPos.y - 16 - arrowLen * Math.sin(angleRad)

  // Initial position: entire arrow fully off-screen (bottom-left corner, far enough that
  // even the tip (which points up-right) is still off-screen)
  const initElemX = -500
  const initElemY = screenH + 500 - 16

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FBF8F3 0%, #F5EDE5 50%, #F0E6DC 100%)' }}
      initial={{ opacity: 1 }}
      animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    >
      {/* Ambient glow that breathes */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 280,
          background: 'radial-gradient(ellipse, rgba(114,47,55,0.08) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
        animate={{ opacity: [0.4, 1, 0.6, 1, 0.4], scale: [0.95, 1.05, 0.98, 1.02, 0.95] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Text + quill wrapper ── */}
      <div className="relative inline-flex flex-col items-center">

        {/* Quill pen — follows the writing motion */}
        <AnimatePresence>
          {writing && !morphed && wrapW > 0 && (
            <motion.div
              key="quill"
              className="absolute pointer-events-none"
              style={{
                // Nib at bottom of SVG — anchor to text container bottom then move up via penY
                bottom: 0,
                left:   0,
                x: penX,
                y: penY,
                rotate: -30,
                transformOrigin: 'bottom center',
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                y: -40,
                scale: 0.8,
                transition: { duration: 0.8, ease: 'easeInOut' },
              }}
              transition={{ opacity: { duration: 0.4 }, scale: { duration: 0.4 } }}
            >
              <QuillPen />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "lovemaxxing" in Dancing Script ── */}
        <div ref={wrapRef}>
          <motion.div
            className="select-none flex items-baseline"
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontWeight: 700,
              fontSize:   'clamp(54px, 12vw, 96px)',
              color:      '#722F37',
              lineHeight: 1.25,
            }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={writing ? { clipPath: 'inset(0 0% 0 0)' } : {}}
            transition={{ duration: WRITE_S, ease: [0.25, 0.08, 0.6, 1] }}
          >
            {/* "lovem" */}
            <span>lovem</span>

            {/* "a" — transforms into a heart; ref for arrow targeting */}
            <span className="relative inline-flex items-center justify-center" ref={aRef}>
              {/* The letter */}
              <motion.span
                className="inline-block"
                animate={morphed
                  ? { opacity: 0, scale: 0.2, filter: 'blur(6px)' }
                  : { opacity: 1, scale: 1,   filter: 'blur(0px)' }}
                transition={{ duration: 0.7, ease: 'easeIn' }}
              >
                a
              </motion.span>

              {/* Heart */}
              <motion.span
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0, rotate: -20 }}
                animate={morphed ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                transition={{ duration: 0.75, ease: [0.34, 1.4, 0.64, 1] }}
              >
                <HeartSVG pulse={hit} />
              </motion.span>
            </span>

            {/* "xxing" */}
            <span>xxing</span>
          </motion.div>
        </div>
      </div>

      {/* ── Golden cupid arrow ── fixed, flies from bottom-left to "a" ── */}
      <AnimatePresence>
        {arrowing && aPos.x > 0 && (
          <motion.div
            key="golden-arrow"
            className="fixed pointer-events-none"
            style={{
              left:           0,
              top:            0,
              transformOrigin: '0px 16px',   // pivot at tail center
              rotate:          angleDeg,
              zIndex:          201,
            }}
            initial={{ x: initElemX, y: initElemY, opacity: 1 }}
            animate={hit
              ? { x: finalElemX + Math.cos(angleRad) * 24,
                  y: finalElemY + Math.sin(angleRad) * 24,
                  opacity: 0 }
              : { x: finalElemX, y: finalElemY }
            }
            transition={hit
              ? { duration: 0.18, ease: 'easeIn' }
              : { duration: 1.9,  ease: [0.15, 0, 0.5, 1] }
            }
          >
            <GoldenArrow length={arrowLen} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Impact sparkles ── */}
      <AnimatePresence>
        {hit && aPos.x > 0 && (
          <motion.div key="sparks" className="fixed inset-0 pointer-events-none" style={{ zIndex: 202 }}>
            {Array.from({ length: 14 }).map((_, i) => {
              const angle  = (i / 14) * Math.PI * 2
              const radius = 32 + (i % 4) * 16
              const size   = i % 3 === 0 ? 9 : i % 3 === 1 ? 5 : 3
              const colors = ['#C9A84C', '#722F37', '#E8C870', '#B08090', '#FFD700']
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width:  size,
                    height: size,
                    background: colors[i % colors.length],
                    top:  aPos.y - size / 2,
                    left: aPos.x - size / 2,
                    zIndex: 202,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x:       Math.cos(angle) * radius,
                    y:       Math.sin(angle) * radius,
                    opacity: 0,
                    scale:   0,
                  }}
                  transition={{ duration: 0.85, ease: 'easeOut', delay: 0.04 + i * 0.014 }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
