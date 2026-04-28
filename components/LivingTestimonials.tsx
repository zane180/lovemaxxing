'use client'
import React, { useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'

type CSSWithVars = React.CSSProperties & { [k: `--${string}`]: string | number }

const TESTIMONIALS = [
  {
    text: 'Matched with someone who has the same niche humor as me. It actually felt like the algorithm understood my soul.',
    name: 'Ava K.',
    age: 26,
    accent: { light: 'rgba(114,47,55,0.08)',  dark: 'rgba(114,47,55,0.22)' },
    glow:   { light: 'rgba(114,47,55,0.12)',  dark: 'rgba(180,80,95,0.28)' },
  },
  {
    text: "Every other app gave me people I had zero connection with. Lovemaxxing's AI actually gets what I'm about.",
    name: 'Marcus T.',
    age: 29,
    accent: { light: 'rgba(201,168,76,0.10)', dark: 'rgba(201,168,76,0.22)' },
    glow:   { light: 'rgba(201,168,76,0.14)', dark: 'rgba(201,168,76,0.30)' },
  },
  {
    text: "I was skeptical about AI dating but my 91% match with my partner was no coincidence. We've been together 8 months.",
    name: 'Jordan M.',
    age: 31,
    accent: { light: 'rgba(158,26,43,0.07)',  dark: 'rgba(158,26,43,0.22)' },
    glow:   { light: 'rgba(158,26,43,0.10)',  dark: 'rgba(158,80,95,0.28)' },
  },
]

// Waveform component (two sine waves showing two personalities syncing)
function Waveform({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const tRef      = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext('2d')
    if (!rawCtx) return
    const ctx = rawCtx
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W * window.devicePixelRatio
    canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    function frame() {
      ctx.clearRect(0, 0, W, H)
      tRef.current += 0.018

      const drawWave = (phaseOffset: number, color: string, amp: number) => {
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        for (let x = 0; x < W; x++) {
          const prog = x / W
          const y = H / 2 + Math.sin(prog * Math.PI * 6 + tRef.current + phaseOffset) * amp
            + Math.sin(prog * Math.PI * 10 + tRef.current * 1.3 + phaseOffset) * amp * 0.35
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      drawWave(0, dark ? 'rgba(180,80,95,0.7)' : 'rgba(114,47,55,0.55)', 5)
      drawWave(Math.PI * 0.08, dark ? 'rgba(201,168,76,0.65)' : 'rgba(184,146,58,0.55)', 5)
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dark])

  return <canvas ref={canvasRef} className="w-full" style={{ height: '28px', display: 'block' }} />
}

// Individual testimonial card with writing-reveal animation
function TestimonialCard({ t, idx, dark }: { t: typeof TESTIMONIALS[0]; idx: number; dark: boolean }) {
  const ref    = useRef<HTMLDivElement>(null)
  const isView = useInView(ref, { once: true, margin: '-80px' })
  const textRef = useRef<HTMLParagraphElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!isView) return
    // Two rAF frames let the browser register the initial --wq-x: 0% before we change it
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (textRef.current) textRef.current.style.setProperty('--wq-x', '110%')
      })
    })
    const t2 = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (nameRef.current) nameRef.current.style.setProperty('--wq-x', '110%')
        })
      })
    }, 2400)
    return () => { cancelAnimationFrame(raf1); clearTimeout(t2) }
  }, [isView])

  const bg   = dark ? t.accent.dark : t.accent.light
  const glow = dark ? t.glow.dark   : t.glow.light

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: idx * 0.15, duration: 0.7, ease: 'easeOut' }}
      className="relative rounded-3xl p-8 overflow-hidden"
      style={{
        background: dark
          ? `radial-gradient(ellipse at 20% 20%, ${bg} 0%, rgba(255,255,255,0.02) 70%)`
          : `radial-gradient(ellipse at 20% 20%, ${bg} 0%, rgba(255,255,255,0.6) 70%)`,
        border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        boxShadow: dark
          ? `0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`
          : `0 8px 32px rgba(114,47,55,0.10), inset 0 1px 0 rgba(255,255,255,0.9)`,
      }}
    >
      {/* Background glow blob */}
      <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-[50px] pointer-events-none"
        style={{ background: glow }} />

      {/* Stars */}
      <div className="flex gap-1 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
        ))}
      </div>

      {/* Quote — CSS mask writing reveal */}
      <p
        ref={textRef}
        className="writing-quote mb-6 leading-relaxed text-base"
        style={{
          fontFamily: "'Caveat', 'Dancing Script', cursive",
          fontSize: '1.18rem',
          color: dark ? 'rgba(250,247,242,0.85)' : 'rgba(74,21,32,0.85)',
        }}
      >
        "{t.text}"
      </p>

      {/* Divider */}
      <div className="h-px w-12 mb-5 rounded-full"
        style={{ background: dark ? 'rgba(201,168,76,0.3)' : 'rgba(114,47,55,0.2)' }} />

      {/* Waveform */}
      <div className="mb-4 opacity-60">
        <Waveform dark={dark} />
      </div>

      {/* Signature */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: dark ? 'rgba(114,47,55,0.3)' : 'rgba(114,47,55,0.1)',
            color: dark ? '#FAF7F2' : '#722F37',
          }}>
          {t.name[0]}
        </div>
        <div>
          <span
            ref={nameRef}
            className="writing-quote block text-sm font-semibold"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.05rem',
              color: dark ? 'rgba(250,247,242,0.9)' : 'rgba(74,21,32,0.9)',
              '--write-delay': '0s',
            } as CSSWithVars}
          >
            {t.name}
          </span>
          <span className="text-xs"
            style={{ color: dark ? 'rgba(250,247,242,0.35)' : 'rgba(114,47,55,0.4)' }}>
            {t.age} years old
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function LivingTestimonials({ dark }: { dark: boolean }) {
  return (
    <section id="testimonials" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-burgundy-700 dark:text-burgundy-400 mb-3">Stories</p>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-burgundy-950 dark:text-cream-100 mb-4">
            Real Connections
          </h2>
          <p className="text-burgundy-800/55 dark:text-cream-300/45 text-lg">
            From people who stopped settling.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} idx={i} dark={dark} />
          ))}
        </div>
      </div>
    </section>
  )
}
