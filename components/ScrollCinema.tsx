'use client'
import { useEffect, useRef, useState } from 'react'
import { useScroll, motion } from 'framer-motion'

// ── Particle silhouette generator ──────────────────────────────────────────
function genPerson(cx: number, cy: number, n: number): [number, number][] {
  const pts: [number, number][] = []
  const H = 200
  const headR = 26, headCy = cy - H * 0.32
  // Head
  for (let i = 0; i < n * 0.22; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * headR * 0.9
    pts.push([cx + Math.cos(a) * r, headCy + Math.sin(a) * r * 0.9])
  }
  // Shoulders
  for (let i = 0; i < n * 0.08; i++) {
    const t = (Math.random() - 0.5) * 2
    pts.push([cx + t * 42, cy - H * 0.14 + Math.abs(t) * 18])
  }
  // Torso
  for (let i = 0; i < n * 0.32; i++) {
    const ty = Math.random()
    pts.push([cx + (Math.random() - 0.5) * (60 - ty * 25), cy - H * 0.1 + ty * H * 0.38])
  }
  // Arms
  for (let i = 0; i < n * 0.18; i++) {
    const side = i < n * 0.09 ? -1 : 1
    const ty   = Math.random()
    pts.push([cx + side * (36 + ty * 28) + (Math.random() - 0.5) * 8, cy - H * 0.07 + ty * H * 0.32])
  }
  // Legs
  for (let i = 0; i < n * 0.20; i++) {
    const side = i < n * 0.10 ? -1 : 1
    const ty   = Math.random()
    pts.push([cx + side * (10 + ty * 6) + (Math.random() - 0.5) * 10, cy + H * 0.28 + ty * H * 0.38])
  }
  return pts
}

// ── Easing ──────────────────────────────────────────────────────────────────
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function range(v: number, inMin: number, inMax: number): number {
  return clamp01((v - inMin) / (inMax - inMin))
}

// ── Phase labels ─────────────────────────────────────────────────────────────
const PHASES = [
  { p: 0.00, label: '' },
  { p: 0.15, label: 'Two people. Living parallel lives.' },
  { p: 0.30, label: 'The AI begins to see them.' },
  { p: 0.50, label: 'Connections emerge.' },
  { p: 0.68, label: '94% compatibility. Confirmed.' },
  { p: 0.85, label: 'This is what Lovemaxxing does.' },
]

const TRAITS = ['Film', 'Jazz', 'Coffee', 'Travel', 'Books', 'Art']

// ── Main component ────────────────────────────────────────────────────────────
export function ScrollCinema({ dark }: { dark: boolean }) {
  const wrapRef    = useRef<HTMLDivElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const progressRef = useRef(0)
  const [phaseLabel, setPhaseLabel] = useState('')
  const [scoreVisible, setScoreVisible] = useState(false)
  const [score, setScore] = useState(0)

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] })

  // Track progress in a ref so canvas loop reads latest value
  useEffect(() => {
    return scrollYProgress.on('change', v => { progressRef.current = v })
  }, [scrollYProgress])

  useEffect(() => {
    return scrollYProgress.on('change', v => {
      // Update phase label
      let lbl = ''
      for (const ph of PHASES) {
        if (v >= ph.p) lbl = ph.label
      }
      setPhaseLabel(lbl)

      // Trigger score counter
      if (v >= 0.68 && v < 0.90) {
        setScoreVisible(true)
        setScore(Math.min(94, Math.round(v * 130)))
      } else if (v < 0.65) {
        setScoreVisible(false)
        setScore(0)
      }
    })
  }, [scrollYProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext('2d')
    if (!rawCtx) return
    const cv  = canvas
    const ctx = rawCtx

    let W = 0, H = 0
    let leftPts:  [number, number][] = []
    let rightPts: [number, number][] = []
    let scatterL: [number, number][] = []
    let scatterR: [number, number][] = []
    let embers:   { x:number; y:number; vx:number; vy:number; life:number; color:string; size:number }[] = []
    let prevExplosion = false

    const N = 130

    function init() {
      W = window.innerWidth
      H = window.innerHeight
      cv.width  = W
      cv.height = H

      const lx = W * 0.32, rx = W * 0.68
      const cy = H * 0.48

      leftPts  = genPerson(lx, cy, N)
      rightPts = genPerson(rx, cy, N)

      // Random scatter positions
      scatterL = Array.from({ length: N }, () => [
        W * 0.05 + Math.random() * W * 0.38,
        H * 0.05 + Math.random() * H * 0.90,
      ] as [number, number])
      scatterR = Array.from({ length: N }, () => [
        W * 0.57 + Math.random() * W * 0.38,
        H * 0.05 + Math.random() * H * 0.90,
      ] as [number, number])
    }

    function drawParticle(x: number, y: number, r: number, color: string, alpha: number) {
      ctx.globalAlpha = alpha * 0.18
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, r * 2.8, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 1
    }

    function drawScanLine(y: number) {
      const g = ctx.createLinearGradient(0, y - 14, 0, y + 14)
      g.addColorStop(0, 'transparent')
      g.addColorStop(0.5, dark ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.25)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, y - 14, W, 28)
    }

    function drawDataNode(x: number, y: number, label: string, progress: number) {
      if (progress <= 0) return
      const a = easeInOut(progress)
      ctx.globalAlpha = a

      // Dot
      ctx.fillStyle = dark ? '#C9A96E' : '#B8923A'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      // Pulse ring
      ctx.strokeStyle = dark ? 'rgba(201,168,76,0.4)' : 'rgba(184,146,58,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 4 + 6 * a, 0, Math.PI * 2)
      ctx.stroke()

      // Label
      ctx.font = `${11}px Inter, system-ui, sans-serif`
      ctx.fillStyle = dark ? 'rgba(201,168,76,0.9)' : 'rgba(114,47,55,0.85)'
      ctx.fillText(label, x + 10, y + 4)

      ctx.globalAlpha = 1
    }

    function drawConnectionLine(
      x1: number, y1: number, x2: number, y2: number,
      progress: number, idx: number
    ) {
      if (progress <= 0) return
      const t = easeInOut(Math.min(1, progress))

      const ex = x1 + (x2 - x1) * t
      const ey = y1 + (y2 - y1) * t

      const g = ctx.createLinearGradient(x1, y1, ex, ey)
      g.addColorStop(0, dark ? 'rgba(180,80,90,0.7)' : 'rgba(114,47,55,0.65)')
      g.addColorStop(1, dark ? 'rgba(201,168,76,0.8)' : 'rgba(184,146,58,0.75)')

      ctx.strokeStyle = g
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.stroke()
      ctx.setLineDash([])

      // Glow dot at leading edge
      ctx.globalAlpha = 0.9
      ctx.fillStyle = dark ? '#C9A96E' : '#B8923A'
      ctx.beginPath()
      ctx.arc(ex, ey, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    function spawnEmbers(cx: number, cy: number) {
      const colors = [
        dark ? 'rgba(200,80,95,0.9)' : 'rgba(114,47,55,0.9)',
        'rgba(201,168,76,0.9)',
        dark ? 'rgba(180,100,115,0.8)' : 'rgba(158,26,43,0.8)',
        'rgba(255,255,255,0.7)',
      ]
      for (let i = 0; i < 80; i++) {
        const a = Math.random() * Math.PI * 2
        const spd = 1.5 + Math.random() * 5
        embers.push({
          x: cx, y: cy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 2,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1.5 + Math.random() * 3,
        })
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H)

      const p = progressRef.current
      const lx = W * 0.32, rx = W * 0.68, cy = H * 0.48

      // ── Phase 1: scatter drift (0 → 0.15) ─────────────────────────
      const scatterT = 1 - easeInOut(range(p, 0.0, 0.14))

      // ── Phase 2: converge to silhouettes (0.13 → 0.35) ────────────
      const convergeT = easeInOut(range(p, 0.13, 0.34))

      const leftColor  = dark ? 'rgba(160,160,175,0.75)' : 'rgba(120,120,130,0.7)'
      const rightColor = dark ? 'rgba(185,90,100,0.85)'  : 'rgba(114,47,55,0.82)'

      for (let i = 0; i < N && i < leftPts.length; i++) {
        const [tx, ty] = leftPts[i]
        const [sx, sy] = scatterL[i]
        const x = sx + (tx - sx) * convergeT
        const y = sy + (ty - sy) * convergeT
        const a = 0.3 + convergeT * 0.55
        drawParticle(x, y, 1.8, leftColor, a)
      }
      for (let i = 0; i < N && i < rightPts.length; i++) {
        const [tx, ty] = rightPts[i]
        const [sx, sy] = scatterR[i]
        const x = sx + (tx - sx) * convergeT
        const y = sy + (ty - sy) * convergeT
        const a = 0.3 + convergeT * 0.55
        drawParticle(x, y, 1.8, rightColor, a)
      }

      // ── Phase 3: AI scan line (0.30 → 0.50) ───────────────────────
      const scanP = range(p, 0.30, 0.50)
      if (scanP > 0 && scanP < 1) {
        drawScanLine(H * 0.08 + (H * 0.84) * easeInOut(scanP))
      }

      // Data nodes appear after scan passes them
      const nodeOffset = [0.04, 0.08, 0.12, 0.16, 0.18, 0.22]
      const traitPositions = [
        // left side
        [lx - 50, cy - 55], [lx + 45, cy - 20],
        [lx - 40, cy + 50], [lx + 42, cy + 85],
        // right side  (matching traits first)
        [rx + 48, cy - 55], [rx - 48, cy - 20],
      ]
      const scanDone = range(p, 0.30, 0.52)
      nodeOffset.forEach((off, i) => {
        const np = range(scanDone, off, off + 0.2)
        const pos = traitPositions[i]
        if (pos) drawDataNode(pos[0], pos[1], TRAITS[i] ?? '', np)
      })

      // ── Phase 4: connection threads (0.48 → 0.68) ─────────────────
      const connStart = 0.48
      const connPairs = [
        [0, 4], // Film  L→R
        [1, 5], // Jazz  L→R
        [2, 4], // Coffee (approximate) - use pos 4 offset slightly
      ]
      connPairs.forEach(([li, ri], idx) => {
        const lp = traitPositions[li], rp = traitPositions[ri]
        if (!lp || !rp) return
        const cp = range(p, connStart + idx * 0.04, connStart + idx * 0.04 + 0.14)
        drawConnectionLine(lp[0], lp[1], rp[0], rp[1], cp, idx)
      })

      // ── Phase 5: explosion (0.66 → 0.70) ──────────────────────────
      const doExplosion = p >= 0.66 && p < 0.88
      if (doExplosion && !prevExplosion) {
        spawnEmbers((lx + rx) / 2, cy)
      }
      prevExplosion = doExplosion

      // Update and draw embers
      embers = embers.filter(e => e.life > 0.01)
      for (const e of embers) {
        e.x  += e.vx
        e.y  += e.vy
        e.vy += 0.06  // gravity
        e.vx *= 0.97
        e.vy *= 0.97
        e.life -= 0.018
        drawParticle(e.x, e.y, e.size, e.color, e.life)
      }

      // ── Central glow at match moment (0.65 → 0.88) ────────────────
      const glowP = easeInOut(range(p, 0.65, 0.72)) * (1 - range(p, 0.82, 0.88))
      if (glowP > 0) {
        const gCx = (lx + rx) / 2
        const grad = ctx.createRadialGradient(gCx, cy, 0, gCx, cy, 240)
        grad.addColorStop(0, `rgba(201,168,76,${0.28 * glowP})`)
        grad.addColorStop(0.5, `rgba(114,47,55,${0.18 * glowP})`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(gCx, cy, 240, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    init()
    window.addEventListener('resize', init)
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', init)
      cancelAnimationFrame(rafRef.current)
    }
  }, [dark])

  return (
    <div ref={wrapRef} className="relative" style={{ height: '500vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Canvas layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: 'transparent' }}
        />

        {/* Score counter */}
        {scoreVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[180%] text-center pointer-events-none z-10"
          >
            <div
              className="font-serif font-bold"
              style={{
                fontSize: 'clamp(3.5rem, 8vw, 7rem)',
                background: 'linear-gradient(135deg, #C9A96E 0%, #B8923A 50%, #C9A96E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {score}%
            </div>
            <div className="text-xs uppercase tracking-[0.35em] text-burgundy-700 dark:text-burgundy-400 mt-1">
              Compatibility
            </div>
          </motion.div>
        )}

        {/* Phase label */}
        <motion.div
          key={phaseLabel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phaseLabel ? 1 : 0, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 px-6"
        >
          <p className="font-serif text-xl md:text-2xl text-burgundy-900 dark:text-cream-100/85 font-medium">
            {phaseLabel}
          </p>
        </motion.div>

        {/* Scroll progress hint */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none opacity-30">
          <div className="text-[10px] uppercase tracking-[0.3em] text-burgundy-900 dark:text-cream-300 rotate-90 origin-center mb-4">
            Scroll
          </div>
          <motion.div
            className="w-px bg-burgundy-900/40 dark:bg-cream-300/30 origin-top"
            style={{ height: '60px', scaleY: scrollYProgress }}
          />
        </div>
      </div>
    </div>
  )
}
