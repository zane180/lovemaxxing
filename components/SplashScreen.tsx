'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'

interface Props {
  onComplete: () => void
}

const WRITE_S    = 4.2   // seconds to write the word
const ARROW_LEN  = 160   // arrow SVG width (px) — smaller than before
const IMPACT_DEG = 38    // angle the arrow arrives at (degrees from horizontal)

const T = {
  startWrite:   900,
  morphStart:   5500,
  arrowLaunch:  7100,
  arrowHit:     9000,   // arrow tip reaches heart
  burstStart:   9400,   // hearts explode outward
  done:         11000,  // onComplete fires (hearts still animating)
}

// Deterministic burst-heart parameters — no Math.random(), no hydration issues
const BURST = Array.from({ length: 32 }).map((_, i) => ({
  angle:    (i / 32) * Math.PI * 2 + ((i * 17) % 7) * 0.09,
  distance: 110 + ((i * 73 + 41) % 6) * 75,
  size:     11  + ((i * 31 + 13) % 5) * 7,
  delay:    (i  * 0.038) % 0.32,
  duration: 0.8 + ((i * 23 + 5) % 4) * 0.18,
  spin:     ((i * 47 + 11) % 3 - 1) * 160,
  color:    (['#722F37','#C9A84C','#E8A0A8','#FFD700','#B05060'] as const)[i % 5],
}))

/* ─────────── SVG components ─────────── */

function QuillPen() {
  return (
    <svg width="52" height="136" viewBox="0 0 52 136" fill="none">
      {/* Wispy plume tip — two tiers */}
      {[
        [-24,7,-33,18],[-18,8,-24,21],[-13,9,-17,22],[-7,9,-10,23],[-3,10,-4,23],
        [ 3,10,  4,23],[ 7,9, 10,23],[13,9, 17,22],[18,8, 24,21],[24,7, 33,18],
      ].map(([cx,cy,ex,ey],i) => (
        <path key={`tp${i}`} d={`M26 4 Q${26+cx} ${cy} ${26+ex} ${ey}`}
          stroke="rgba(255,252,245,0.54)" strokeWidth="0.55" fill="none"/>
      ))}
      {[
        [-33,14,-40,28],[-22,15,-28,29],[-11,16,-14,30],
        [ 11,16, 14,30],[ 22,15, 28,29],[ 33,14, 40,28],
      ].map(([cx,cy,ex,ey],i) => (
        <path key={`tt${i}`} d={`M26 4 Q${26+cx} ${cy} ${26+ex} ${ey}`}
          stroke="rgba(255,248,238,0.34)" strokeWidth="0.44" fill="none"/>
      ))}

      {/* Rachis */}
      <path d="M26 3 C26.5 38 26 78 25 122" stroke="#C4A882" strokeWidth="1.5" fill="none" opacity="0.9"/>

      {/* Vane barbs — left & right */}
      {[8,14,20,27,34,41,48,56,63,70,77,83].map((y,i) => {
        const sp = Math.max(5, 21 - i * 1.4)
        const op = i < 4 ? 0.72 : i < 8 ? 0.55 : 0.38
        const sw = Math.max(0.35, 0.86 - i * 0.04)
        return (
          <g key={`bar${i}`}>
            <path d={`M26 ${y} Q${26-sp*0.55} ${y+4} ${26-sp} ${y+6}`}
              stroke={`rgba(255,250,242,${op})`} strokeWidth={sw} fill="none"/>
            <path d={`M26 ${y} Q${26+sp*0.55} ${y+4} ${26+sp} ${y+6}`}
              stroke={`rgba(255,250,242,${op})`} strokeWidth={sw} fill="none"/>
          </g>
        )
      })}

      {/* Inner barbules (fine texture) */}
      {[10,24,38,52].map((y,r) => (
        <g key={`bu${r}`}>
          <path d={`M23 ${y} Q18 ${y+3} 15 ${y+6}`}  stroke="rgba(255,252,246,0.26)" strokeWidth="0.38" fill="none"/>
          <path d={`M29 ${y} Q34 ${y+3} 37 ${y+6}`}  stroke="rgba(255,252,246,0.26)" strokeWidth="0.38" fill="none"/>
          <path d={`M22 ${y+5} Q16 ${y+8} 13 ${y+10}`} stroke="rgba(255,252,246,0.16)" strokeWidth="0.32" fill="none"/>
          <path d={`M30 ${y+5} Q36 ${y+8} 39 ${y+10}`} stroke="rgba(255,252,246,0.16)" strokeWidth="0.32" fill="none"/>
        </g>
      ))}

      {/* Calamus (gold barrel) */}
      <path d="M24.5 81 C24 96 23.5 109 23 123" stroke="#C9A84C" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <path d="M27.5 81 C28 96 28.5 109 29 123" stroke="#A87E28" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      <path d="M25.5 83 C25.5 97 25.5 111 25.5 121" stroke="rgba(255,225,120,0.36)" strokeWidth="0.9" fill="none"/>

      {/* Nib */}
      <path d="M22.5 120 L20 133 L26 128 L26 136 L26 128 L32 133 L29.5 120 Z" fill="#C9A84C"/>
      <path d="M25.5 125 L26 136 L26.5 125" stroke="#7A5010" strokeWidth="0.75" fill="none"/>
      <path d="M22.5 120 L24 129" stroke="rgba(255,230,140,0.42)" strokeWidth="0.8" fill="none"/>
    </svg>
  )
}

function HeartSVG() {
  return (
    <svg viewBox="0 0 40 37" fill="#722F37"
      style={{ width: '0.6em', height: '0.55em', display: 'inline-block', overflow: 'visible' }}>
      <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
    </svg>
  )
}

function GoldenArrow() {
  const L = ARROW_LEN
  return (
    <svg width={L} height="26" viewBox={`0 0 ${L} 26`} fill="none">
      {/* Fletching */}
      <path d={`M0 13 L14 4`}  stroke="#C9A84C" strokeWidth="2"   strokeLinecap="round"/>
      <path d={`M0 13 L14 13`} stroke="#C9A84C" strokeWidth="2"   strokeLinecap="round"/>
      <path d={`M0 13 L14 22`} stroke="#C9A84C" strokeWidth="2"   strokeLinecap="round"/>
      <path d={`M4 13 L12  7`} stroke="rgba(255,228,110,0.52)" strokeWidth="0.9" strokeLinecap="round"/>
      <path d={`M4 13 L12 19`} stroke="rgba(255,228,110,0.52)" strokeWidth="0.9" strokeLinecap="round"/>
      {/* Shaft */}
      <line x1="14" y1="13" x2={L-18} y2="13" stroke="#C9A84C" strokeWidth="2.4" strokeLinecap="round"/>
      <line x1="14" y1="11.8" x2={L-18} y2="11.8" stroke="rgba(255,235,140,0.62)" strokeWidth="0.85" strokeLinecap="round"/>
      <line x1="14" y1="14.2" x2={L-18} y2="14.2" stroke="rgba(160,110,10,0.38)" strokeWidth="0.7" strokeLinecap="round"/>
      {/* Diamond head */}
      <path d={`M${L-18} 13 L${L-7} 5 L${L} 13 L${L-7} 21 Z`} fill="#C9A84C"/>
      <path d={`M${L-18} 13 L${L-7} 5 L${L-4} 10 Z`} fill="rgba(255,235,140,0.52)"/>
      <path d={`M${L-18} 13 L${L-7} 5 L${L} 13 L${L-7} 21 Z`} stroke="rgba(160,110,10,0.55)" strokeWidth="0.55" fill="none"/>
    </svg>
  )
}

/* ─────────── Main component ─────────── */

export default function SplashScreen({ onComplete }: Props) {
  type Phase = 'idle'|'writing'|'morphing'|'arrow'|'hit'|'burst'
  const [phase, setPhase] = useState<Phase>('idle')

  const wrapRef  = useRef<HTMLDivElement>(null)
  const aRef     = useRef<HTMLSpanElement>(null)
  const [wrapW,  setWrapW]  = useState(0)
  const [aPos,   setAPos]   = useState({ x: 0, y: 0 })

  // Motion values that drive the quill's hand-tracing path
  const writeProgress = useMotionValue(0)
  const penX = useTransform(writeProgress, [0, 1], [0, wrapW])
  // penY: nib height offset from container bottom (negative = move nib UP into text)
  // Approximate stroke heights for each letter: l o v e m a x x i n g
  const penY = useTransform(
    writeProgress,
    [0,   0.02, 0.07, 0.12, 0.17, 0.22, 0.27, 0.31, 0.36, 0.40, 0.46, 0.52, 0.57, 0.62, 0.67, 0.72, 0.78, 0.84, 0.91, 0.96, 1.0],
    [-76,-114,  -90,  -73,  -69,  -57,  -72,  -85,  -92,  -71,  -68,  -66,  -68,  -68,  -66,  -61,  -71, -110,  -67,  -73,  -44]
  )

  // Measure text container after font loads
  useEffect(() => {
    const measure = () => { if (wrapRef.current) setWrapW(wrapRef.current.offsetWidth) }
    document.fonts.ready.then(measure)
    measure()
  }, [])

  // Phase timeline
  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setPhase('writing'),  T.startWrite),
      setTimeout(() => setPhase('morphing'), T.morphStart),
      setTimeout(() => {
        if (aRef.current) {
          const r = aRef.current.getBoundingClientRect()
          setAPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }
        setPhase('arrow')
      }, T.arrowLaunch),
      setTimeout(() => setPhase('hit'),   T.arrowHit),
      setTimeout(() => setPhase('burst'), T.burstStart),
      setTimeout(onComplete,              T.done),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onComplete])

  // Drive writeProgress smoothly
  useEffect(() => {
    if (phase !== 'writing') return
    const ctrl = animate(writeProgress, 1, { duration: WRITE_S, ease: [0.25, 0.08, 0.6, 1] })
    return () => ctrl.stop()
  }, [phase, writeProgress])

  const writing  = phase !== 'idle'
  const morphed  = ['morphing','arrow','hit','burst'].includes(phase)
  const arrowing = ['arrow','hit','burst'].includes(phase)
  const hit      = ['hit','burst'].includes(phase)
  const bursting = phase === 'burst'

  // ── Parabolic arrow arc keyframes ──────────────────────────────────────────
  // The arrow tip follows a 4-point arc from off-screen bottom-left → heart.
  // Rotation tracks the tangent direction at each waypoint.
  const arrowKF = useMemo(() => {
    if (aPos.x === 0) return null
    const sH = typeof window !== 'undefined' ? window.innerHeight : 800
    const sW = typeof window !== 'undefined' ? window.innerWidth  : 390
    const IR = IMPACT_DEG * Math.PI / 180  // impact angle in radians

    // Final element position: tip at aPos, coming in at IMPACT_DEG
    const ex3 = aPos.x - ARROW_LEN * Math.cos(IR)
    const ey3 = aPos.y - 13 - ARROW_LEN * Math.sin(IR)

    // Approach waypoint (70% of flight): ~120px above and 80px left of final
    const ex2 = ex3 - 75
    const ey2 = ey3 - 130
    const r2  = Math.atan2(ey3 - ey2, ex3 - ex2) * 180 / Math.PI

    // Peak waypoint (35% of flight): upper-left quadrant, arrow arcing high
    const ex1 = sW * 0.05 - ARROW_LEN
    const ey1 = sH * 0.14
    const r1  = Math.atan2(ey2 - ey1, ex2 - ex1) * 180 / Math.PI * 0.55

    // Launch position: completely off-screen bottom-left
    const ex0 = -ARROW_LEN - 120
    const ey0 = sH + 340
    const r0  = Math.atan2(ey1 - ey0, ex1 - ex0) * 180 / Math.PI

    return {
      x:   [ex0, ex1, ex2, ex3],
      y:   [ey0, ey1, ey2, ey3],
      rot: [r0,  r1,  r2,  IMPACT_DEG],
    }
  }, [aPos])

  // Center of screen for burst origin
  const screenCx = typeof window !== 'undefined' ? window.innerWidth  / 2 : 195
  const screenCy = typeof window !== 'undefined' ? window.innerHeight / 2 : 406

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FBF8F3 0%, #F5EDE5 50%, #F0E6DC 100%)' }}
      animate={bursting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 1.6, ease: 'easeInOut', delay: bursting ? 0.3 : 0 }}
    >
      {/* Breathing ambient glow */}
      <motion.div className="absolute pointer-events-none"
        style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:700, height:280, borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(114,47,55,0.08) 0%,transparent 68%)' }}
        animate={{ opacity:[0.4,1,0.6,1,0.4], scale:[0.95,1.05,0.98,1.02,0.95] }}
        transition={{ duration:9, repeat:Infinity, ease:'easeInOut' }}
      />

      {/* ── Text + quill ── */}
      <div className="relative inline-flex flex-col items-center">

        {/* Quill — nib at bottom, anchored there, x/y drive the nib position */}
        <AnimatePresence>
          {writing && !morphed && wrapW > 0 && (
            <motion.div key="quill" className="absolute pointer-events-none"
              style={{ bottom:0, left:0, x:penX, y:penY, rotate:-30, transformOrigin:'bottom center' }}
              initial={{ opacity:0, scale:0.88 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, y:-50, scale:0.8, transition:{ duration:0.9, ease:'easeInOut' } }}
              transition={{ opacity:{ duration:0.35 }, scale:{ duration:0.35 } }}
            >
              <QuillPen />
            </motion.div>
          )}
        </AnimatePresence>

        {/* "lovemaxxing" — clip reveals left→right */}
        <div ref={wrapRef}>
          <motion.div
            className="select-none flex items-baseline"
            style={{ fontFamily:"'Dancing Script',cursive", fontWeight:700,
              fontSize:'clamp(54px,12vw,96px)', color:'#722F37', lineHeight:1.25 }}
            initial={{ clipPath:'inset(0 100% 0 0)' }}
            animate={writing ? { clipPath:'inset(0 0% 0 0)' } : {}}
            transition={{ duration:WRITE_S, ease:[0.25,0.08,0.6,1] }}
          >
            <span>lovem</span>

            {/* "a" transforms into a heart */}
            <span className="relative inline-flex items-center justify-center" ref={aRef}>
              <motion.span className="inline-block"
                animate={morphed ? { opacity:0, scale:0.15, filter:'blur(6px)' }
                                 : { opacity:1, scale:1,    filter:'blur(0px)' }}
                transition={{ duration:0.75, ease:'easeIn' }}>
                a
              </motion.span>
              <motion.span className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity:0, scale:0, rotate:-20 }}
                animate={morphed ? { opacity:1, scale:1, rotate:0 } : {}}
                transition={{ duration:0.8, ease:[0.34,1.4,0.64,1] }}>
                <HeartSVG />
              </motion.span>
            </span>

            <span>xxing</span>
          </motion.div>
        </div>
      </div>

      {/* ── Golden arrow ── parabolic arc, rotation tracks tangent ── */}
      <AnimatePresence>
        {arrowing && arrowKF && (
          <motion.div key="arrow" className="fixed pointer-events-none"
            style={{ left:0, top:0, zIndex:201, transformOrigin:'0px 13px' }}
            initial={{ x:arrowKF.x[0], y:arrowKF.y[0], rotate:arrowKF.rot[0], opacity:1 }}
            animate={hit
              ? { x: arrowKF.x[3] + Math.cos(IMPACT_DEG*Math.PI/180)*22,
                  y: arrowKF.y[3] + Math.sin(IMPACT_DEG*Math.PI/180)*22,
                  opacity: 0 }
              : { x: arrowKF.x, y: arrowKF.y, rotate: arrowKF.rot }
            }
            transition={hit
              ? { duration:0.22, ease:'easeIn' }
              : { duration:(T.arrowHit-T.arrowLaunch)/1000,
                  times:[0,0.35,0.70,1],
                  ease:'easeInOut',
                  rotate:{ times:[0,0.35,0.70,1], ease:'easeInOut' } }
            }
          >
            <GoldenArrow />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cupid-heart impact effect ── */}
      <AnimatePresence>
        {hit && aPos.x > 0 && (
          <motion.div key="impact" className="fixed pointer-events-none" style={{ zIndex:202 }}>

            {/* Heart burst — the "a" heart scales up dramatically */}
            <motion.div className="fixed" style={{ top:aPos.y, left:aPos.x, zIndex:203 }}>
              <motion.div style={{ x:'-50%', y:'-50%' }}
                initial={{ scale:1 }}
                animate={{ scale:[1, 3.2, 1.8, 2.4], opacity:[1,1,0.9,0] }}
                transition={{ duration:1.1, times:[0,0.25,0.6,1], ease:'easeOut' }}>
                <svg viewBox="0 0 40 37" fill="#722F37" style={{ width:48, height:44 }}>
                  <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
                </svg>
              </motion.div>
            </motion.div>

            {/* Radial gold glow rings */}
            {[0, 1, 2].map(i => (
              <motion.div key={`ring${i}`} className="fixed rounded-full"
                style={{ border:'2px solid rgba(201,168,76,0.7)',
                  top:aPos.y, left:aPos.x, x:'-50%', y:'-50%', zIndex:202 }}
                initial={{ width:20, height:20, opacity:0.9 }}
                animate={{ width:180+i*60, height:180+i*60, opacity:0 }}
                transition={{ duration:0.9, delay:i*0.18, ease:'easeOut' }}
              />
            ))}

            {/* Mini hearts scatter from impact */}
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2
              const d = 45 + ((i * 53) % 5) * 28
              const sz = 8 + ((i * 31) % 4) * 6
              const col = ['#722F37','#C9A84C','#E8A0A8','#FFD700'][i % 4]
              return (
                <motion.div key={`mh${i}`} className="fixed"
                  style={{ top:aPos.y, left:aPos.x, zIndex:202 }}>
                  <motion.div
                    initial={{ x:0, y:0, opacity:1, scale:0, rotate:0 }}
                    animate={{ x:Math.cos(a)*d, y:Math.sin(a)*d, opacity:0, scale:1.4, rotate:((i%2)*2-1)*200 }}
                    transition={{ duration:0.7+i*0.03, ease:'easeOut', delay:0.05 }}>
                    <svg viewBox="0 0 40 37" fill={col} style={{ width:sz, height:sz }}>
                      <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
                    </svg>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Heart burst transition — 32 hearts explode outward ── */}
      <AnimatePresence>
        {bursting && (
          <motion.div key="burst" className="fixed inset-0 pointer-events-none" style={{ zIndex:210 }}>
            {BURST.map(({ angle, distance, size, delay, duration, spin, color }, i) => (
              <motion.div key={i} className="fixed"
                style={{ top:screenCy, left:screenCx, zIndex:210 }}>
                <motion.div
                  initial={{ x:0, y:0, opacity:0, scale:0, rotate:0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity:[0, 1, 1, 0],
                    scale:[0, 1.3, 1.1, 0],
                    rotate: spin,
                  }}
                  transition={{ duration, delay, ease:'easeOut',
                    opacity:{ times:[0,0.15,0.6,1] },
                    scale:  { times:[0,0.2, 0.5,1] } }}
                >
                  <svg viewBox="0 0 40 37" fill={color} style={{ width:size, height:size }}>
                    <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
                  </svg>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
