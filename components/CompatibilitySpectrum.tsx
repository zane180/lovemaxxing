'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const N_DOTS = 90
const COLORS_CHAOS  = ['rgba(160,160,170,0.55)', 'rgba(140,140,155,0.45)', 'rgba(120,120,135,0.5)']
const CLUSTERS_LMXY  = [
  { x: 0.18, y: 0.30 }, { x: 0.24, y: 0.65 },
  { x: 0.42, y: 0.22 }, { x: 0.45, y: 0.72 },
  { x: 0.62, y: 0.32 }, { x: 0.68, y: 0.60 },
  { x: 0.82, y: 0.25 }, { x: 0.80, y: 0.70 },
]

interface Dot {
  cx: number; cy: number   // chaos position (0-1)
  ox: number; oy: number   // ordered position (0-1)
  ci: number               // cluster index
  hue: string
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function CompatibilitySpectrum({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [handle, setHandle]   = useState(0)
  const dotsRef  = useRef<Dot[]>([])
  const rafRef   = useRef<number>(0)
  const handleRef = useRef(0)

  // Init dots once
  useEffect(() => {
    const pairs   = CLUSTERS_LMXY.length / 2
    const clusterPairs = Array.from({ length: pairs }, (_, i) => [i * 2, i * 2 + 1])

    dotsRef.current = Array.from({ length: N_DOTS }, (_, i) => {
      const pairIdx   = i % pairs
      const side      = i < N_DOTS / 2 ? 0 : 1
      const clIdx     = clusterPairs[pairIdx][side]
      const cl        = CLUSTERS_LMXY[clIdx]
      const pairColors = [
        dark ? 'rgba(180,80,95,0.85)' : 'rgba(114,47,55,0.85)',
        'rgba(201,168,76,0.85)',
        dark ? 'rgba(120,140,200,0.75)' : 'rgba(80,100,170,0.75)',
        dark ? 'rgba(100,180,140,0.75)' : 'rgba(60,140,100,0.75)',
      ]
      return {
        cx:  Math.random(),
        cy:  Math.random(),
        ox: cl.x + (Math.random() - 0.5) * 0.10,
        oy: cl.y + (Math.random() - 0.5) * 0.14,
        ci: clIdx,
        hue: pairColors[pairIdx % pairColors.length],
      }
    })
  }, [dark])

  // Keep handleRef in sync
  useEffect(() => { handleRef.current = handle }, [handle])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0

    function resize() {
      W = canvas!.offsetWidth
      H = canvas!.offsetHeight
      canvas!.width  = W * window.devicePixelRatio
      canvas!.height = H * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    function frame() {
      ctx.clearRect(0, 0, W, H)
      const t = easeInOut(handleRef.current / 100)
      const dots = dotsRef.current

      // Draw connections between matched pairs at high t
      if (t > 0.5) {
        const alpha = easeInOut((t - 0.5) * 2)
        const pairs = CLUSTERS_LMXY.length / 2
        for (let p = 0; p < pairs; p++) {
          const leftDots  = dots.filter((_, i) => i < N_DOTS / 2 && i % pairs === p)
          const rightDots = dots.filter((_, i) => i >= N_DOTS / 2 && i % pairs === p)
          leftDots.forEach((ld, i) => {
            const rd = rightDots[i]
            if (!rd) return
            const lx = (ld.cx + (ld.ox - ld.cx) * t) * W
            const ly = (ld.cy + (ld.oy - ld.cy) * t) * H
            const rx = (rd.cx + (rd.ox - rd.cx) * t) * W
            const ry = (rd.cy + (rd.oy - rd.cy) * t) * H
            const g = ctx.createLinearGradient(lx, ly, rx, ry)
            g.addColorStop(0, ld.hue.replace('0.85', String(0.25 * alpha)))
            g.addColorStop(1, rd.hue.replace('0.85', String(0.25 * alpha)))
            ctx.strokeStyle = g
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(lx, ly)
            ctx.lineTo(rx, ry)
            ctx.stroke()
          })
        }
      }

      // Draw dots
      dots.forEach((dot, i) => {
        const x = (dot.cx + (dot.ox - dot.cx) * t) * W
        const y = (dot.cy + (dot.oy - dot.cy) * t) * H

        // Glow
        ctx.globalAlpha = 0.12 * t
        ctx.fillStyle = dot.hue
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.globalAlpha = 0.45 + 0.5 * t
        ctx.fillStyle = t > 0.5 ? dot.hue : (dark ? COLORS_CHAOS[i % 3] : COLORS_CHAOS[i % 3])
        ctx.beginPath()
        ctx.arc(x, y, 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 1
      })

      // Highlight "you" pair at 100%
      if (t > 0.92) {
        const yalpha = easeInOut((t - 0.92) / 0.08)
        const ld = dots[0], rd = dots[Math.floor(N_DOTS / 2)]
        if (ld && rd) {
          const lx = (ld.cx + (ld.ox - ld.cx) * t) * W
          const ly = (ld.cy + (ld.oy - ld.cy) * t) * H
          const rx = (rd.cx + (rd.ox - rd.cx) * t) * W
          const ry = (rd.cy + (rd.oy - rd.cy) * t) * H

          // Gold ring on both
          ;[{x: lx, y: ly}, {x: rx, y: ry}].forEach(pt => {
            ctx.globalAlpha = 0.9 * yalpha
            ctx.strokeStyle = '#C9A96E'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2)
            ctx.stroke()
            ctx.globalAlpha = 1
          })

          // Label
          ctx.globalAlpha = yalpha
          ctx.font = `italic 13px "Playfair Display", Georgia, serif`
          ctx.fillStyle = dark ? '#C9A96E' : '#B8923A'
          ctx.fillText('That could be you.', (lx + rx) / 2 - 55, Math.min(ly, ry) - 14)
          ctx.globalAlpha = 1
        }
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [dark])

  const onSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHandle(Number(e.target.value))
  }, [])

  return (
    <section className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-burgundy-700 dark:text-burgundy-400 mb-3">Interactive Proof</p>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-burgundy-950 dark:text-cream-100 mb-4">
            The Difference
          </h2>
          <p className="text-burgundy-800/55 dark:text-cream-300/45 text-lg max-w-lg mx-auto">
            Drag to see how Lovemaxxing turns chaos into connection.
          </p>
        </motion.div>

        {/* Slider */}
        <div className="flex items-center gap-5 mb-6 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium w-24 text-right shrink-0"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            Other apps
          </span>
          <div className="relative flex-1">
            <input
              type="range" min={0} max={100} value={handle}
              onChange={onSliderChange}
              className="w-full appearance-none h-1.5 rounded-full outline-none spectrum-slider"
              style={{
                background: `linear-gradient(to right, #C9A96E ${handle}%, ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} ${handle}%)`,
              }}
            />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-burgundy-700 dark:text-burgundy-400 font-medium w-24 shrink-0">
            Lovemaxxing
          </span>
        </div>

        {/* Canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden border border-cream-300 dark:border-white/[0.06]"
          style={{
            background: dark ? 'rgba(18,6,8,0.85)' : 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <canvas ref={canvasRef} className="w-full" style={{ height: '380px', display: 'block' }} />
          {/* Left label */}
          <div className="absolute left-5 top-5 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400"
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', opacity: Math.max(0, 1 - handle / 40) }}>
              Random matches
            </span>
          </div>
          {/* Right label */}
          <div className="absolute right-5 top-5 pointer-events-none"
            style={{ opacity: Math.min(1, (handle - 40) / 40) }}>
            <span className="text-[10px] uppercase tracking-[0.3em] text-burgundy-700 dark:text-burgundy-400">
              Perfect pairs
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
