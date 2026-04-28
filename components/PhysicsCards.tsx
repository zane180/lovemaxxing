'use client'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useIsMobile } from '@/lib/useIsMobile'

// ── Card data ────────────────────────────────────────────────────────────────
const CARDS = [
  { id: 0, name: 'Sofia',  age: 24, tags: ['Film', 'Jazz', 'Travel'],   score: 94, color: '#722F37' },
  { id: 1, name: 'James',  age: 27, tags: ['Jazz', 'Books', 'Coffee'],  score: 94, color: '#722F37' },
  { id: 2, name: 'Priya',  age: 25, tags: ['Art', 'Travel', 'Yoga'],    score: 88, color: '#9E4A12' },
  { id: 3, name: 'Theo',   age: 28, tags: ['Art', 'Design', 'Coffee'],  score: 88, color: '#9E4A12' },
  { id: 4, name: 'Zoe',    age: 23, tags: ['Music', 'Coffee', 'Film'],  score: 79, color: '#4A5568' },
  { id: 5, name: 'Marcus', age: 30, tags: ['Music', 'Film', 'Travel'],  score: 79, color: '#4A5568' },
]

// Compatible pairs: (0,1), (2,3), (4,5)
function compatibility(i: number, j: number): number {
  if ((i === 0 && j === 1) || (i === 1 && j === 0)) return 1.0
  if ((i === 2 && j === 3) || (i === 3 && j === 2)) return 0.85
  if ((i === 4 && j === 5) || (i === 5 && j === 4)) return 0.65
  return 0
}

interface PhysCard {
  x: number; y: number
  vx: number; vy: number
  homeX: number; homeY: number
}

export function PhysicsCards({ dark }: { dark: boolean }) {
  const mobile     = useIsMobile()
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([])
  const stateRef   = useRef<PhysCard[]>([])
  const mouseRef   = useRef<{ x: number; y: number } | null>(null)
  const rafRef     = useRef<number>(0)
  const visibleRef = useRef(false)

  useEffect(() => {
    if (mobile) return // static layout on mobile — no rAF needed
    const section = sectionRef.current
    if (!section) return

    function initCards() {
      const rect = section!.getBoundingClientRect()
      const W = rect.width, H = rect.height
      const cols = Math.min(3, CARDS.length)
      const rows = Math.ceil(CARDS.length / cols)

      stateRef.current = CARDS.map((_, i) => {
        const col = i % cols, row = Math.floor(i / cols)
        const x = (W / (cols + 1)) * (col + 1) - 70
        const y = (H / (rows + 1)) * (row + 1) - 50
        return { x, y, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, homeX: x, homeY: y }
      })
    }

    function loop() {
      if (!visibleRef.current) { rafRef.current = 0; return }
      const section = sectionRef.current
      if (!section) return
      const rect   = section.getBoundingClientRect()
      const W = rect.width, H = rect.height
      const CARD_W = 140, CARD_H = 100
      const st = stateRef.current
      const mouse = mouseRef.current

      st.forEach((card, i) => {
        let fx = 0, fy = 0

        // Card-to-card attraction for compatible pairs
        st.forEach((other, j) => {
          if (i === j) return
          const c = compatibility(i, j)
          if (c === 0) return
          const dx = other.x - card.x, dy = other.y - card.y
          const dist = Math.hypot(dx, dy)
          if (dist < 10) return
          const ideal = 160
          const diff  = dist - ideal
          const force = diff * 0.0008 * c
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        })

        // Gentle home-spring (keeps cards from flying away)
        fx += (card.homeX - card.x) * 0.003
        fy += (card.homeY - card.y) * 0.003

        // Mouse gravity (relative to section)
        if (mouse) {
          const relX = mouse.x - rect.left
          const relY = mouse.y - rect.top
          const dx   = relX - (card.x + CARD_W / 2)
          const dy   = relY - (card.y + CARD_H / 2)
          const dist = Math.hypot(dx, dy)
          if (dist > 5 && dist < 300) {
            const force = (1 - dist / 300) * 0.012
            fx += (dx / dist) * force
            fy += (dy / dist) * force
          }
        }

        // Integrate
        card.vx = (card.vx + fx) * 0.93
        card.vy = (card.vy + fy) * 0.93
        card.x  += card.vx
        card.y  += card.vy

        // Soft boundary
        const pad = 20
        if (card.x < pad)              { card.x = pad;          card.vx *= -0.4 }
        if (card.x > W - CARD_W - pad) { card.x = W - CARD_W - pad; card.vx *= -0.4 }
        if (card.y < pad)              { card.y = pad;          card.vy *= -0.4 }
        if (card.y > H - CARD_H - pad) { card.y = H - CARD_H - pad; card.vy *= -0.4 }

        // Apply
        const el = cardRefs.current[i]
        if (el) el.style.transform = `translate(${card.x}px, ${card.y}px)`
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const onLeave = ()              => { mouseRef.current = null }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting && !rafRef.current) {
          rafRef.current = requestAnimationFrame(loop)
        }
      },
      { threshold: 0.1 },
    )

    initCards()
    window.addEventListener('mousemove', onMouse, { passive: true })
    section.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', initCards)
    observer.observe(section)

    return () => {
      observer.disconnect()
      window.removeEventListener('mousemove', onMouse)
      section.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', initCards)
      cancelAnimationFrame(rafRef.current)
    }
  }, [mobile])

  // ── Mobile: simple grid, no physics ──────────────────────────────────────────
  if (mobile) {
    return (
      <section className="py-24 px-6 overflow-hidden">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-burgundy-700 dark:text-burgundy-400 mb-3">Live Demo</p>
          <h2 className="font-serif text-4xl font-bold text-burgundy-950 dark:text-cream-100 mb-3">
            This is what compatibility looks like.
          </h2>
          <p className="text-burgundy-800/50 dark:text-cream-300/45 text-base max-w-sm mx-auto">
            Compatible people find each other — the AI does the work.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {CARDS.map(card => (
            <div
              key={card.id}
              className="rounded-2xl p-3"
              style={{
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
                border: dark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.9)',
                boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.35)' : '0 4px 16px rgba(114,47,55,0.10)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="font-serif font-semibold text-xs text-burgundy-950 dark:text-cream-100 leading-tight">
                    {card.name}, {card.age}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {card.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[7px] px-1 py-0.5 rounded-full"
                        style={{ background: dark ? 'rgba(114,47,55,0.3)' : 'rgba(114,47,55,0.08)', color: dark ? '#FAF7F2' : '#4A1520' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Heart className="w-3.5 h-3.5 shrink-0" style={{ color: card.color, fill: card.color + '40' }} />
              </div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[7px] text-burgundy-800/40 dark:text-cream-300/30 uppercase tracking-wider">match</span>
                <span className="text-[8px] font-bold" style={{ color: card.color }}>{card.score}%</span>
              </div>
              <div className="h-0.5 bg-burgundy-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${card.score}%`, background: `linear-gradient(90deg, ${card.color}, #C9A96E)` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-6 overflow-hidden">
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-burgundy-700 dark:text-burgundy-400 mb-3">Live Demo</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-burgundy-950 dark:text-cream-100 mb-3">
          This is what compatibility looks like.
        </h2>
        <p className="text-burgundy-800/50 dark:text-cream-300/45 text-base max-w-md mx-auto">
          Compatible people find each other. Move your cursor through them.
        </p>
      </motion.div>

      {/* Physics arena */}
      <div
        ref={sectionRef}
        className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-cream-300 dark:border-white/[0.06]"
        style={{
          height: '420px',
          background: dark
            ? 'linear-gradient(135deg, rgba(18,6,8,0.9) 0%, rgba(24,10,14,0.9) 100%)'
            : 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {CARDS.map((card, i) => (
          <div
            key={card.id}
            ref={el => { cardRefs.current[i] = el }}
            className="absolute top-0 left-0 will-change-transform"
            style={{ width: 140, height: 100 }}
          >
            <div
              className="w-full h-full rounded-2xl p-3 flex flex-col justify-between select-none"
              style={{
                background: dark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(255,255,255,0.75)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'}`,
                backdropFilter: 'blur(12px)',
                boxShadow: dark
                  ? '0 8px 28px rgba(0,0,0,0.45)'
                  : '0 6px 24px rgba(114,47,55,0.12)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-serif font-semibold text-sm text-burgundy-950 dark:text-cream-100 leading-tight">
                    {card.name}, {card.age}
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {card.tags.slice(0, 2).map(t => (
                      <span key={t}
                        className="text-[8px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: dark ? 'rgba(114,47,55,0.3)' : 'rgba(114,47,55,0.08)',
                          color: dark ? '#FAF7F2' : '#4A1520',
                        }}
                      >{t}</span>
                    ))}
                  </div>
                </div>
                <Heart className="w-4 h-4 flex-shrink-0" style={{ color: card.color, fill: card.color + '40' }} />
              </div>
              {/* Compatibility score bar */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] text-burgundy-800/40 dark:text-cream-300/30 uppercase tracking-wider">match</span>
                  <span className="text-[9px] font-bold" style={{ color: card.color }}>{card.score}%</span>
                </div>
                <div className="h-0.5 bg-burgundy-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${card.score}%`, background: `linear-gradient(90deg, ${card.color}, #C9A96E)` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* "Drag to explore" hint */}
        <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.3em] text-burgundy-900/25 dark:text-cream-300/20 pointer-events-none">
          Move cursor to attract
        </div>
      </div>
    </section>
  )
}
