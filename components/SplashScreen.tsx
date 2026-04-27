'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'

interface Props { onComplete: () => void }

const WRITE_S   = 4.2
const ARROW_LEN = 160
// The quill SVG is 70px wide; the nib is at horizontal center (x=35).
// penX must offset by -35 so the nib lands exactly at the clip reveal edge.
const NIB_X     = 35

const T = {
  startWrite:  600,
  morphStart:  4900,
  arrowLaunch: 6400,   // ~1.5 s of heartbeat visible before arrow
  arrowHit:    8500,   // 2.1 s elegant flight
  burstStart:  8950,
  done:        11400,  // 2.45s after burst — enough for fade (0.35 + 1.8s) to fully complete
}

/* ── SVG components ──────────────────────────────────────────── */

function QuillPen() {
  // Parametric barb lengths: vane widens to peak around t=0.38 then tapers
  const yPositions = [12,20,29,38,48,58,68,80,92,106,120,135,150,166,180]
  const barbs = yPositions.map((y, i) => {
    const t = i / (yPositions.length - 1)
    const bell = t < 0.38 ? t / 0.38 : 1 - (t - 0.38) / 0.62
    const rReach = 4 + bell * 28        // right vane: up to 32px
    const lReach = 3 + bell * 20        // left vane: up to 23px (inner, narrower)
    const op = 0.72 - i * 0.022
    const sw = i < 5 ? 0.54 : 0.4
    return { y, rReach, lReach, op, sw }
  })

  return (
    <svg width="70" height="210" viewBox="0 0 70 210" fill="none">
      {/* Right (outer) vane — sweeping shape */}
      <path d="M35 8 C42 26 66 56 66 94 C66 126 56 160 44 194 L35 210 Z"
        fill="rgba(255,253,248,0.82)" />
      {/* Left (inner) vane — narrower */}
      <path d="M35 8 C28 24 10 50 8 86 C6 116 16 152 26 192 L35 210 Z"
        fill="rgba(249,244,234,0.70)" />
      {/* Vane sheen */}
      <path d="M35 8 C42 26 66 56 66 94 C66 126 56 160 44 194"
        stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" fill="none" />
      {/* Barbs */}
      {barbs.map(({ y, rReach, lReach, op, sw }) => (
        <g key={y}>
          <path d={`M35 ${y} Q${35 + rReach * 0.58} ${y+3} ${35+rReach} ${y+5}`}
            stroke={`rgba(255,252,245,${op})`} strokeWidth={sw} fill="none"/>
          <path d={`M35 ${y+2} Q${35 + rReach * 0.45} ${y+5} ${35 + rReach * 0.82} ${y+7}`}
            stroke={`rgba(255,252,245,${op*0.5})`} strokeWidth={sw*0.65} fill="none"/>
          <path d={`M35 ${y} Q${35 - lReach * 0.55} ${y+3} ${35-lReach} ${y+5}`}
            stroke={`rgba(255,252,245,${op*0.85})`} strokeWidth={sw*0.88} fill="none"/>
        </g>
      ))}
      {/* Central rachis */}
      <path d="M35 7 C35.4 85 35.2 150 35 205"
        stroke="#C5A585" strokeWidth="1.25" fill="none" opacity="0.88" />
      {/* Calamus (shaft below vane, gold) */}
      <path d="M33.5 178 C33 189 32.5 199 32 207"
        stroke="#C9A84C" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
      <path d="M36.5 178 C37 189 37.5 199 38 207"
        stroke="#A87E28" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M35 180 C35 191 35 201 35 206"
        stroke="rgba(255,220,110,0.28)" strokeWidth="0.8" fill="none"/>
      {/* Nib tip at bottom center (35, 210) */}
      <path d="M33 206 L31 210 L35 208 L39 210 L37 206 Z" fill="#C9A84C"/>
      <path d="M34.5 207 L35 210 L35.5 207" stroke="#7A5010" strokeWidth="0.65" fill="none"/>
    </svg>
  )
}

function HeartPath() {
  return <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
}

function GoldenArrow() {
  const L = ARROW_LEN
  return (
    <svg width={L} height="30" viewBox={`0 0 ${L} 30`} fill="none">
      {/* Upper flight feather — organic leaf curve */}
      <path d="M10 14 C7 11 3 8 1 4 C-1 0 4 -1 7 2 C10 5 9 9 10 12 C11 13 12 13 13 13 L10 14"
        fill="#C9A84C"/>
      <path d="M4 8 Q6 6 9 5" stroke="rgba(255,240,160,0.7)" strokeWidth="0.8" fill="none"/>
      <path d="M3 11 Q5 10 7 10" stroke="rgba(255,240,160,0.5)" strokeWidth="0.6" fill="none"/>
      {/* Lower flight feather */}
      <path d="M10 16 C7 19 3 22 1 26 C-1 30 4 31 7 28 C10 25 9 21 10 18 C11 17 12 17 13 17 L10 16"
        fill="#B8923A"/>
      <path d="M4 22 Q6 24 9 25" stroke="rgba(255,240,160,0.55)" strokeWidth="0.8" fill="none"/>
      <path d="M3 19 Q5 20 7 20" stroke="rgba(255,240,160,0.4)" strokeWidth="0.6" fill="none"/>
      {/* Shaft */}
      <line x1="13" y1="15" x2={L-18} y2="15" stroke="#C9A84C" strokeWidth="2.6" strokeLinecap="round"/>
      <line x1="13" y1="13.5" x2={L-18} y2="13.5" stroke="rgba(255,240,150,0.65)" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="13" y1="16.5" x2={L-18} y2="16.5" stroke="rgba(140,90,5,0.35)" strokeWidth="0.7" strokeLinecap="round"/>
      {/* Arrowhead */}
      <path d={`M${L-18} 15 L${L-6} 6 L${L} 15 L${L-6} 24 Z`} fill="#C9A84C"/>
      <path d={`M${L-18} 15 L${L-6} 6 L${L-3} 11 Z`} fill="rgba(255,240,150,0.55)"/>
      <path d={`M${L-18} 15 L${L-6} 6 L${L} 15 L${L-6} 24 Z`}
        stroke="rgba(150,100,5,0.45)" strokeWidth="0.5" fill="none"/>
    </svg>
  )
}

/* ── Main component ─────────────────────────────────────────── */

export default function SplashScreen({ onComplete }: Props) {
  type Phase = 'idle'|'writing'|'morphing'|'arrow'|'hit'|'burst'
  const [phase, setPhase]   = useState<Phase>('idle')
  const wrapRef             = useRef<HTMLDivElement>(null)
  const aRef                = useRef<HTMLSpanElement>(null)
  const [wrapW, setWrapW]   = useState(0)
  const [aPos,  setAPos]    = useState({ x: 0, y: 0 })
  const onCompleteRef       = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const writeProgress = useMotionValue(0)

  // penX: offset by -NIB_X so the nib tip aligns with the clip reveal edge
  const penX = useTransform(writeProgress, [0, 1], [-NIB_X, wrapW - NIB_X])
  const penY = useTransform(
    writeProgress,
    [0,   0.02, 0.07, 0.12, 0.17, 0.22, 0.27, 0.31, 0.36, 0.40, 0.46, 0.52, 0.57, 0.62, 0.67, 0.72, 0.78, 0.84, 0.91, 0.96, 1.0],
    [-76,-114,  -90,  -73,  -69,  -57,  -72,  -85,  -92,  -71,  -68,  -66,  -68,  -68,  -66,  -61,  -71, -110,  -67,  -73,  -44]
  )

  useEffect(() => {
    const m = () => { if (wrapRef.current) setWrapW(wrapRef.current.offsetWidth) }
    document.fonts.ready.then(m); m()
  }, [])

  useEffect(() => {
    const ts = [
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
      setTimeout(() => onCompleteRef.current(), T.done),
    ]
    return () => ts.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase !== 'writing') return
    const c = animate(writeProgress, 1, { duration: WRITE_S, ease: [0.25, 0.08, 0.6, 1] })
    return () => c.stop()
  }, [phase, writeProgress])

  const writing  = phase !== 'idle'
  const morphed  = ['morphing','arrow','hit','burst'].includes(phase)
  const arrowing = ['arrow','hit','burst'].includes(phase)
  const hit      = ['hit','burst'].includes(phase)
  const bursting = phase === 'burst'

  /* ── Arrow geometry ── */
  const arrow = useMemo(() => {
    if (!aPos.x) return null
    const sH = window.innerHeight
    const tailStartX = -ARROW_LEN - 80
    const tailStartY = sH + 90
    const angleRad   = Math.atan2(aPos.y - tailStartY, aPos.x - tailStartX)
    const angleDeg   = angleRad * (180 / Math.PI)
    const initX      = tailStartX
    const initY      = tailStartY - 15
    const finalX     = aPos.x - ARROW_LEN * Math.cos(angleRad)
    const finalY     = aPos.y - 15 - ARROW_LEN * Math.sin(angleRad)
    const overshootX = finalX + Math.cos(angleRad) * 22
    const overshootY = finalY + Math.sin(angleRad) * 22
    return { initX, initY, finalX, finalY, overshootX, overshootY, angleDeg, angleRad }
  }, [aPos])

  /* ── Burst + flood hearts ── */
  const { radialHearts, floodHearts, screenCx, screenCy } = useMemo(() => {
    if (!bursting) return { radialHearts: [], floodHearts: [], screenCx: 195, screenCy: 406 }
    const W   = window.innerWidth
    const H   = window.innerHeight
    const cx  = W / 2
    const cy  = H / 2
    const maxD = Math.sqrt(cx * cx + cy * cy) * 1.25
    const colors = ['#722F37','#C9A84C','#E8A0A8','#FFD700','#FF6B8A','#9E1A2B','#D4A0B0','#FFC0CB']

    // 80 radial hearts exploding from impact centre
    const radialHearts = Array.from({ length: 80 }).map((_, i) => ({
      angle:    (i / 80) * Math.PI * 2 + ((i * 17) % 7) * 0.06,
      distance: maxD * (0.12 + ((i * 73 + 41) % 11) * 0.08),  // 0.12 → ~1.0 × maxD
      size:     8 + ((i * 31 + 13) % 8) * 7,
      delay:    (i * 0.012) % 0.2,
      duration: 0.85 + ((i * 23 + 5) % 5) * 0.18,
      spin:     ((i * 47 + 11) % 3 - 1) * 240,
      color:    colors[i % 8],
    }))

    // 150 flood hearts in a 15×10 grid covering every pixel of the screen
    const COLS = 15, ROWS = 10
    const cW = W / COLS, cH = H / ROWS
    const floodHearts = Array.from({ length: 150 }).map((_, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const jx  = ((i * 137 + 41) % 21 - 10) / 10 * cW * 0.42
      const jy  = ((i * 173 + 37) % 17 - 8)  /  8 * cH * 0.42
      const size = 14 + ((i * 29 + 7) % 7) * 9   // 14 – 68 px
      return {
        left:     col * cW + cW / 2 + jx - size / 2,
        top:      row * cH + cH / 2 + jy - size / 2,
        size,
        delay:    0.04 + ((i * 19 + 3) % 23) * 0.028,  // 0.04 – 0.68 s
        duration: 0.55 + ((i * 37 + 11) % 5) * 0.17,   // 0.55 – 1.23 s
        spin:     ((i * 53 + 7) % 3 - 1) * 170,
        color:    colors[i % 8],
      }
    })

    return { radialHearts, floodHearts, screenCx: cx, screenCy: cy }
  }, [bursting])

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background:'linear-gradient(160deg,#FBF8F3 0%,#F5EDE5 50%,#F0E6DC 100%)' }}
      animate={bursting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 1.8, ease: 'easeInOut', delay: bursting ? 0.35 : 0 }}
    >
      {/* Breathing glow */}
      <motion.div className="absolute pointer-events-none"
        style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:700, height:280, borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(114,47,55,0.08) 0%,transparent 68%)' }}
        animate={{ opacity:[0.4,1,0.6,1,0.4], scale:[0.95,1.05,0.98,1.02,0.95] }}
        transition={{ duration:9, repeat:Infinity, ease:'easeInOut' }}
      />

      {/* ── Text + quill ── */}
      <div className="relative inline-flex flex-col items-center">
        <AnimatePresence>
          {writing && !morphed && wrapW > 0 && (
            <motion.div key="quill" className="absolute pointer-events-none"
              style={{ bottom:0, left:0, x:penX, y:penY, rotate:-28, transformOrigin:'bottom center' }}
              initial={{ opacity:0, scale:0.9 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, y:-60, scale:0.75, transition:{ duration:1.0, ease:'easeInOut' } }}
              transition={{ opacity:{ duration:0.4 }, scale:{ duration:0.4 } }}
            >
              <QuillPen />
              {/* Ink glow at nib tip — shows where ink is being deposited */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  bottom: 0, left: '50%',
                  width: 10, height: 5,
                  background: 'rgba(55,15,20,0.55)',
                  borderRadius: '50%',
                  filter: 'blur(1.5px)',
                  transform: 'translateX(-50%)',
                }}
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={wrapRef}>
          <motion.div className="select-none flex items-baseline"
            style={{
              fontFamily: "'Great Vibes', cursive",
              fontWeight: 400,
              fontSize: 'clamp(58px,13vw,100px)',
              color: '#722F37',
              lineHeight: 1.3,
            }}
            initial={{ clipPath:'inset(0 100% 0 0)' }}
            animate={writing ? { clipPath:'inset(0 0% 0 0)' } : {}}
            transition={{ duration:WRITE_S, ease:[0.25,0.08,0.6,1] }}
          >
            <span>lovem</span>

            {/* "a" → heart */}
            <span className="relative inline-flex items-center justify-center" ref={aRef}>
              <motion.span className="inline-block"
                animate={morphed ? { opacity:0, scale:0.12, filter:'blur(7px)' }
                                 : { opacity:1, scale:1,    filter:'blur(0px)' }}
                transition={{ duration:0.72, ease:'easeIn' }}>a</motion.span>

              <motion.span className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity:0, scale:0, rotate:-18 }}
                animate={morphed ? { opacity:1, scale:1, rotate:0 } : {}}
                transition={{ duration:0.85, ease:[0.34,1.4,0.64,1] }}>
                {/* Heart beats while alive, waiting for the arrow */}
                <motion.span
                  animate={morphed && !hit
                    ? {
                        scale: [1, 1.2, 1, 1.14, 1],
                        filter: [
                          'drop-shadow(0 0 0px transparent)',
                          'drop-shadow(0 0 9px rgba(114,47,55,0.55))',
                          'drop-shadow(0 0 0px transparent)',
                          'drop-shadow(0 0 6px rgba(114,47,55,0.38))',
                          'drop-shadow(0 0 0px transparent)',
                        ],
                      }
                    : {}}
                  transition={{ duration:1.3, repeat:Infinity, ease:'easeInOut' }}
                >
                  <svg viewBox="0 0 40 37" fill="#722F37"
                    style={{ width:'0.62em', height:'0.57em', display:'inline-block', overflow:'visible' }}>
                    <HeartPath />
                  </svg>
                </motion.span>
              </motion.span>
            </span>

            <span>xxing</span>
          </motion.div>
        </div>
      </div>

      {/* ── Golden arrow ── */}
      <AnimatePresence>
        {arrowing && arrow && (
          <motion.div key="arrow" className="fixed pointer-events-none"
            style={{
              left: 0, top: 0, zIndex: 201,
              rotate: arrow.angleDeg,
              transformOrigin: '0px 15px',
            }}
            initial={{ x: arrow.initX, y: arrow.initY, opacity: 1 }}
            animate={hit
              ? { x: arrow.overshootX, y: arrow.overshootY, opacity: 0 }
              : { x: arrow.finalX,     y: arrow.finalY }
            }
            transition={hit
              ? { duration: 0.18, ease: 'easeIn' }
              : { duration: (T.arrowHit - T.arrowLaunch) / 1000, ease: [0.45, 0, 0.55, 1] }
            }
          >
            <GoldenArrow />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gold flash on impact ── */}
      <AnimatePresence>
        {hit && (
          <motion.div key="flash" className="fixed inset-0 pointer-events-none"
            style={{ zIndex:203,
              background:'radial-gradient(ellipse 60% 40% at 50% 42%, rgba(255,235,140,0.75) 0%, transparent 70%)' }}
            initial={{ opacity:0 }}
            animate={{ opacity:[0, 1, 0] }}
            transition={{ duration:0.55, times:[0, 0.15, 1], ease:'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── Cupid-heart impact ── */}
      <AnimatePresence>
        {hit && aPos.x > 0 && (
          <motion.div key="impact" className="fixed inset-0 pointer-events-none" style={{ zIndex:202 }}>
            <motion.div className="fixed" style={{ top:aPos.y, left:aPos.x }}>
              <motion.div style={{ x:'-50%', y:'-50%' }}
                initial={{ scale:1, opacity:1 }}
                animate={{ scale:[1,3.4,2], opacity:[1,1,0] }}
                transition={{ duration:1.1, times:[0,0.28,1], ease:'easeOut' }}>
                <svg viewBox="0 0 40 37" fill="#722F37" style={{ width:46, height:42 }}><HeartPath/></svg>
              </motion.div>
            </motion.div>

            {[0,1,2].map(i => (
              <motion.div key={`r${i}`} className="fixed rounded-full"
                style={{ border:`${i===0?2.5:1.8}px solid rgba(201,168,76,${i===0?0.85:0.55})`,
                  top:aPos.y, left:aPos.x, x:'-50%', y:'-50%' }}
                initial={{ width:16, height:16, opacity:0.9 }}
                animate={{ width:180+i*70, height:180+i*70, opacity:0 }}
                transition={{ duration:1.0, delay:i*0.2, ease:'easeOut' }}
              />
            ))}

            {Array.from({ length:16 }).map((_,i) => {
              const a = (i/16)*Math.PI*2, d = 40+((i*53)%5)*30, sz = 8+((i*31)%4)*7
              const col = ['#722F37','#C9A84C','#E8A0A8','#FFD700'][i%4]
              return (
                <motion.div key={`mh${i}`} className="fixed" style={{ top:aPos.y, left:aPos.x }}>
                  <motion.div
                    initial={{ x:0, y:0, opacity:1, scale:0, rotate:0 }}
                    animate={{ x:Math.cos(a)*d, y:Math.sin(a)*d, opacity:0, scale:1.4, rotate:((i%2)*2-1)*220 }}
                    transition={{ duration:0.75, ease:'easeOut', delay:0.06 }}>
                    <svg viewBox="0 0 40 37" fill={col} style={{ width:sz, height:sz }}><HeartPath/></svg>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Heart burst: radial explosion + full-screen flood ── */}
      <AnimatePresence>
        {bursting && (
          <motion.div key="burst" className="fixed inset-0 pointer-events-none" style={{ zIndex:210 }}>

            {/* Radial: 80 hearts from impact centre */}
            {radialHearts.map(({ angle, distance, size, delay, duration, spin, color }, i) => (
              <motion.div key={`r${i}`} className="fixed" style={{ top:screenCy, left:screenCx }}>
                <motion.div
                  initial={{ x:0, y:0, opacity:0, scale:0, rotate:0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [0, 1, 1, 0],
                    scale:   [0, 1.5, 1.1, 0],
                    rotate:  spin,
                  }}
                  transition={{
                    duration, delay, ease:'easeOut',
                    opacity: { times:[0, 0.1, 0.6, 1] },
                    scale:   { times:[0, 0.16, 0.55, 1] },
                  }}
                >
                  <svg viewBox="0 0 40 37" fill={color} style={{ width:size, height:size, display:'block' }}>
                    <HeartPath/>
                  </svg>
                </motion.div>
              </motion.div>
            ))}

            {/* Flood: 150 hearts in a 15×10 grid — every corner covered */}
            {floodHearts.map(({ left, top, size, delay, duration, spin, color }, i) => (
              <motion.div key={`f${i}`} className="fixed pointer-events-none"
                style={{ left, top, zIndex:211 }}>
                <motion.div
                  initial={{ opacity:0, scale:0, rotate:0 }}
                  animate={{ opacity:[0, 1, 1, 0], scale:[0, 1.3, 1, 0], rotate:spin }}
                  transition={{
                    delay, duration, ease:'easeOut',
                    opacity: { times:[0, 0.15, 0.65, 1] },
                    scale:   { times:[0, 0.2, 0.6, 1] },
                  }}
                >
                  <svg viewBox="0 0 40 37" fill={color} style={{ width:size, height:size, display:'block' }}>
                    <HeartPath/>
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
