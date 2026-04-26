'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'

interface Props { onComplete: () => void }

const WRITE_S   = 4.2
const ARROW_LEN = 155

const T = {
  startWrite:  900,
  morphStart:  5500,
  arrowLaunch: 7000,
  arrowHit:    8850,
  burstStart:  9250,
  done:        11200,
}

/* ── SVG pieces ──────────────────────────────────────────────── */

function QuillPen() {
  return (
    <svg width="52" height="136" viewBox="0 0 52 136" fill="none">
      {[[-24,7,-33,18],[-18,8,-24,21],[-13,9,-17,22],[-7,9,-10,23],[-3,10,-4,23],
        [3,10,4,23],[7,9,10,23],[13,9,17,22],[18,8,24,21],[24,7,33,18]]
        .map(([cx,cy,ex,ey],i)=>(
          <path key={`tp${i}`} d={`M26 4 Q${26+cx} ${cy} ${26+ex} ${ey}`}
            stroke="rgba(255,252,245,0.54)" strokeWidth="0.55" fill="none"/>
        ))}
      {[[-33,14,-40,28],[-22,15,-28,29],[-11,16,-14,30],[11,16,14,30],[22,15,28,29],[33,14,40,28]]
        .map(([cx,cy,ex,ey],i)=>(
          <path key={`tt${i}`} d={`M26 4 Q${26+cx} ${cy} ${26+ex} ${ey}`}
            stroke="rgba(255,248,238,0.34)" strokeWidth="0.44" fill="none"/>
        ))}
      <path d="M26 3 C26.5 38 26 78 25 122" stroke="#C4A882" strokeWidth="1.5" fill="none" opacity="0.9"/>
      {[8,14,20,27,34,41,48,56,63,70,77,83].map((y,i)=>{
        const sp=Math.max(5,21-i*1.4), op=i<4?0.72:i<8?0.55:0.38, sw=Math.max(0.35,0.86-i*0.04)
        return (
          <g key={`bar${i}`}>
            <path d={`M26 ${y} Q${26-sp*0.55} ${y+4} ${26-sp} ${y+6}`} stroke={`rgba(255,250,242,${op})`} strokeWidth={sw} fill="none"/>
            <path d={`M26 ${y} Q${26+sp*0.55} ${y+4} ${26+sp} ${y+6}`} stroke={`rgba(255,250,242,${op})`} strokeWidth={sw} fill="none"/>
          </g>
        )
      })}
      {[10,24,38,52].map((y,r)=>(
        <g key={`bu${r}`}>
          <path d={`M23 ${y} Q18 ${y+3} 15 ${y+6}`}   stroke="rgba(255,252,246,0.26)" strokeWidth="0.38" fill="none"/>
          <path d={`M29 ${y} Q34 ${y+3} 37 ${y+6}`}   stroke="rgba(255,252,246,0.26)" strokeWidth="0.38" fill="none"/>
          <path d={`M22 ${y+5} Q16 ${y+8} 13 ${y+10}`} stroke="rgba(255,252,246,0.16)" strokeWidth="0.32" fill="none"/>
          <path d={`M30 ${y+5} Q36 ${y+8} 39 ${y+10}`} stroke="rgba(255,252,246,0.16)" strokeWidth="0.32" fill="none"/>
        </g>
      ))}
      <path d="M24.5 81 C24 96 23.5 109 23 123" stroke="#C9A84C" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <path d="M27.5 81 C28 96 28.5 109 29 123" stroke="#A87E28" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      <path d="M25.5 83 C25.5 97 25.5 111 25.5 121" stroke="rgba(255,225,120,0.36)" strokeWidth="0.9" fill="none"/>
      <path d="M22.5 120 L20 133 L26 128 L26 136 L26 128 L32 133 L29.5 120 Z" fill="#C9A84C"/>
      <path d="M25.5 125 L26 136 L26.5 125" stroke="#7A5010" strokeWidth="0.75" fill="none"/>
    </svg>
  )
}

function HeartPath() {
  return <path d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"/>
}

function GoldenArrow() {
  const L = ARROW_LEN
  return (
    <svg width={L} height="26" viewBox={`0 0 ${L} 26`} fill="none">
      <path d={`M0 13 L13 5`}  stroke="#C9A84C" strokeWidth="2"   strokeLinecap="round"/>
      <path d={`M0 13 L13 13`} stroke="#C9A84C" strokeWidth="2"   strokeLinecap="round"/>
      <path d={`M0 13 L13 21`} stroke="#C9A84C" strokeWidth="2"   strokeLinecap="round"/>
      <path d={`M4 13 L11 8`}  stroke="rgba(255,228,110,0.5)" strokeWidth="0.9" strokeLinecap="round"/>
      <path d={`M4 13 L11 18`} stroke="rgba(255,228,110,0.5)" strokeWidth="0.9" strokeLinecap="round"/>
      <line x1="13" y1="13" x2={L-17} y2="13" stroke="#C9A84C" strokeWidth="2.4" strokeLinecap="round"/>
      <line x1="13" y1="11.8" x2={L-17} y2="11.8" stroke="rgba(255,235,140,0.6)" strokeWidth="0.8" strokeLinecap="round"/>
      <line x1="13" y1="14.2" x2={L-17} y2="14.2" stroke="rgba(160,110,10,0.36)" strokeWidth="0.7" strokeLinecap="round"/>
      <path d={`M${L-17} 13 L${L-6} 5 L${L} 13 L${L-6} 21 Z`} fill="#C9A84C"/>
      <path d={`M${L-17} 13 L${L-6} 5 L${L-3} 10 Z`} fill="rgba(255,235,140,0.5)"/>
      <path d={`M${L-17} 13 L${L-6} 5 L${L} 13 L${L-6} 21 Z`} stroke="rgba(160,110,10,0.5)" strokeWidth="0.5" fill="none"/>
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

  const writeProgress = useMotionValue(0)
  const penX = useTransform(writeProgress, [0, 1], [0, wrapW])
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
      setTimeout(onComplete,              T.done),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onComplete])

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

  /* ── Arrow geometry: straight shot from bottom-left to the "a" ── */
  const arrow = useMemo(() => {
    if (!aPos.x) return null
    const sH = window.innerHeight

    // The tail of the arrow starts at bottom-left, well off-screen
    const tailStartX = -ARROW_LEN - 80   // off-screen left
    const tailStartY = sH + 90           // off-screen below

    // Angle: from the starting tail screen-position straight to aPos
    const angleRad = Math.atan2(aPos.y - tailStartY, aPos.x - tailStartX)
    const angleDeg = angleRad * (180 / Math.PI)

    // Element positions (transformOrigin is '0 13px' = left-centre = tail)
    // So element x,y are the tail's screen coords (y offset by -13 for top vs center)
    const initX = tailStartX
    const initY = tailStartY - 13

    // Final: tip (at x=ARROW_LEN in local space after rotation) lands on aPos
    const finalX = aPos.x - ARROW_LEN * Math.cos(angleRad)
    const finalY = aPos.y - 13 - ARROW_LEN * Math.sin(angleRad)

    // Overshoot for the "quiver" after impact
    const overshootX = finalX + Math.cos(angleRad) * 28
    const overshootY = finalY + Math.sin(angleRad) * 28

    return { initX, initY, finalX, finalY, overshootX, overshootY, angleDeg, angleRad }
  }, [aPos])

  /* ── Burst hearts: computed from real screen dims when burst starts ── */
  const burstHearts = useMemo(() => {
    if (!bursting) return []
    const cx = window.innerWidth  / 2
    const cy = window.innerHeight / 2
    // Half-diagonal + 25% so hearts reach every corner
    const maxD = Math.sqrt(cx * cx + cy * cy) * 1.25
    return Array.from({ length: 60 }).map((_, i) => ({
      angle:    (i / 60) * Math.PI * 2 + ((i * 17) % 7) * 0.06,
      distance: maxD * (0.35 + ((i * 73 + 41) % 8) * 0.082),
      size:     9  + ((i * 31 + 13) % 7) * 7,
      delay:    (i * 0.018) % 0.25,
      duration: 0.85 + ((i * 23 + 5) % 5) * 0.16,
      spin:     ((i * 47 + 11) % 3 - 1) * 230,
      color:    ['#722F37','#C9A84C','#E8A0A8','#FFD700','#FF6B8A','#9E1A2B','#D4A0B0','#FFC0CB'][i % 8],
    }))
  }, [bursting])

  const screenCx = typeof window !== 'undefined' ? window.innerWidth  / 2 : 195
  const screenCy = typeof window !== 'undefined' ? window.innerHeight / 2 : 406

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

        <div ref={wrapRef}>
          <motion.div className="select-none flex items-baseline"
            style={{ fontFamily:"'Dancing Script',cursive", fontWeight:700,
              fontSize:'clamp(54px,12vw,96px)', color:'#722F37', lineHeight:1.25 }}
            initial={{ clipPath:'inset(0 100% 0 0)' }}
            animate={writing ? { clipPath:'inset(0 0% 0 0)' } : {}}
            transition={{ duration:WRITE_S, ease:[0.25,0.08,0.6,1] }}
          >
            <span>lovem</span>

            {/* "a" → heart */}
            <span className="relative inline-flex items-center justify-center" ref={aRef}>
              <motion.span className="inline-block"
                animate={morphed ? { opacity:0, scale:0.15, filter:'blur(6px)' }
                                 : { opacity:1, scale:1,    filter:'blur(0px)' }}
                transition={{ duration:0.75, ease:'easeIn' }}>a</motion.span>

              <motion.span className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity:0, scale:0, rotate:-20 }}
                animate={morphed ? { opacity:1, scale:1, rotate:0 } : {}}
                transition={{ duration:0.8, ease:[0.34,1.4,0.64,1] }}>
                <svg viewBox="0 0 40 37" fill="#722F37"
                  style={{ width:'0.6em', height:'0.55em', display:'inline-block', overflow:'visible' }}>
                  <HeartPath />
                </svg>
              </motion.span>
            </span>

            <span>xxing</span>
          </motion.div>
        </div>
      </div>

      {/* ── Golden arrow: straight shot, fixed rotation, clean trajectory ── */}
      <AnimatePresence>
        {arrowing && arrow && (
          <motion.div key="arrow" className="fixed pointer-events-none"
            style={{
              left: 0, top: 0, zIndex: 201,
              // Rotation is fixed for the whole flight — arrow always points at the heart
              rotate: arrow.angleDeg,
              transformOrigin: '0px 13px',  // tail-centre is the pivot
            }}
            initial={{ x: arrow.initX, y: arrow.initY, opacity: 1 }}
            animate={hit
              ? { x: arrow.overshootX, y: arrow.overshootY, opacity: 0 }
              : { x: arrow.finalX,     y: arrow.finalY }
            }
            transition={hit
              ? { duration: 0.2, ease: 'easeIn' }
              : {
                  duration: (T.arrowHit - T.arrowLaunch) / 1000,
                  ease: [0.3, 0, 0.65, 1],  // ease-in: slow deliberate start, accelerates
                }
            }
          >
            <GoldenArrow />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cupid-heart impact ── */}
      <AnimatePresence>
        {hit && aPos.x > 0 && (
          <motion.div key="impact" className="fixed inset-0 pointer-events-none" style={{ zIndex:202 }}>
            {/* Heart blooms */}
            <motion.div className="fixed" style={{ top:aPos.y, left:aPos.x }}>
              <motion.div style={{ x:'-50%', y:'-50%' }}
                initial={{ scale:1, opacity:1 }}
                animate={{ scale:[1,3.4,2], opacity:[1,1,0] }}
                transition={{ duration:1.1, times:[0,0.28,1], ease:'easeOut' }}>
                <svg viewBox="0 0 40 37" fill="#722F37" style={{ width:46, height:42 }}><HeartPath/></svg>
              </motion.div>
            </motion.div>

            {/* Gold ripple rings */}
            {[0,1,2].map(i=>(
              <motion.div key={`r${i}`} className="fixed rounded-full"
                style={{ border:`${i===0?2.5:1.8}px solid rgba(201,168,76,${i===0?0.85:0.55})`,
                  top:aPos.y, left:aPos.x, x:'-50%', y:'-50%' }}
                initial={{ width:16, height:16, opacity:0.9 }}
                animate={{ width:180+i*70, height:180+i*70, opacity:0 }}
                transition={{ duration:1.0, delay:i*0.2, ease:'easeOut' }}
              />
            ))}

            {/* Mini hearts scatter */}
            {Array.from({length:16}).map((_,i)=>{
              const a=(i/16)*Math.PI*2, d=40+((i*53)%5)*30, sz=8+((i*31)%4)*7
              const col=['#722F37','#C9A84C','#E8A0A8','#FFD700'][i%4]
              return (
                <motion.div key={`mh${i}`} className="fixed" style={{top:aPos.y,left:aPos.x}}>
                  <motion.div
                    initial={{ x:0, y:0, opacity:1, scale:0, rotate:0 }}
                    animate={{ x:Math.cos(a)*d, y:Math.sin(a)*d, opacity:0, scale:1.4, rotate:((i%2)*2-1)*220 }}
                    transition={{ duration:0.75, ease:'easeOut', delay:0.06 }}>
                    <svg viewBox="0 0 40 37" fill={col} style={{width:sz,height:sz}}><HeartPath/></svg>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Heart burst: 60 hearts fill the entire screen ── */}
      <AnimatePresence>
        {bursting && burstHearts.length > 0 && (
          <motion.div key="burst" className="fixed inset-0 pointer-events-none" style={{ zIndex:210 }}>
            {burstHearts.map(({ angle, distance, size, delay, duration, spin, color }, i) => (
              <motion.div key={i} className="fixed" style={{ top:screenCy, left:screenCx }}>
                <motion.div
                  initial={{ x:0, y:0, opacity:0, scale:0, rotate:0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [0, 1, 1, 0],
                    scale:   [0, 1.4, 1.1, 0],
                    rotate:  spin,
                  }}
                  transition={{
                    duration, delay, ease:'easeOut',
                    opacity: { times:[0, 0.12, 0.65, 1] },
                    scale:   { times:[0, 0.18, 0.55, 1] },
                  }}
                >
                  <svg viewBox="0 0 40 37" fill={color}
                    style={{ width:size, height:size, display:'block' }}>
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
