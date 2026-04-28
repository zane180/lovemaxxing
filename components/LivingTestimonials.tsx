'use client'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    text: 'Matched with someone who has the same niche humor as me. It actually felt like the algorithm understood my soul.',
    name: 'Ava K.',    age: 26,
  },
  {
    text: "Every other app gave me people I had zero connection with. Lovemaxxing's AI actually gets what I'm about.",
    name: 'Marcus T.', age: 29,
  },
  {
    text: "I was skeptical about AI dating but my 91% match with my partner was no coincidence. We've been together 8 months.",
    name: 'Jordan M.', age: 31,
  },
  {
    text: "The face analysis feature is eerily accurate. It knew my type before I even did. Matched first week.",
    name: 'Priya S.',  age: 27,
  },
  {
    text: "Three months in and we're already planning our first trip together. Never thought an app could do this.",
    name: 'Carlos R.', age: 28,
  },
  {
    text: "I deleted Tinder the week I joined Lovemaxxing. Haven't looked back once.",
    name: 'Lily W.',   age: 24,
  },
  {
    text: "My match score was 88% and I thought it was marketing fluff. It wasn't. We share everything that matters.",
    name: 'Devon A.',  age: 30,
  },
  {
    text: "Honestly thought AI matching was a gimmick until it paired me with someone I'd never have found on my own.",
    name: 'Yasmin F.', age: 25,
  },
]

// Row 2 is the same set in a different order so the two rows don't mirror each other
const ROW1 = TESTIMONIALS
const ROW2 = [...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4)]

function TestimonialCard({ t, dark }: { t: typeof TESTIMONIALS[0]; dark: boolean }) {
  return (
    <div
      className="shrink-0 w-[320px] rounded-3xl p-6 mx-3"
      style={{
        background: dark
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(255,255,255,0.78)',
        border: dark
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid rgba(255,255,255,0.9)',
        boxShadow: dark
          ? '0 8px 32px rgba(0,0,0,0.30)'
          : '0 6px 28px rgba(114,47,55,0.09), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
        ))}
      </div>

      {/* Quote */}
      <p
        className="leading-relaxed mb-5 text-[1.08rem]"
        style={{
          fontFamily: "'Caveat', 'Dancing Script', cursive",
          color: dark ? 'rgba(250,247,242,0.82)' : 'rgba(74,21,32,0.82)',
        }}
      >
        "{t.text}"
      </p>

      {/* Divider */}
      <div
        className="h-px w-10 mb-4 rounded-full"
        style={{ background: dark ? 'rgba(201,168,76,0.28)' : 'rgba(114,47,55,0.18)' }}
      />

      {/* Author */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: dark ? 'rgba(114,47,55,0.28)' : 'rgba(114,47,55,0.09)',
            color: dark ? '#FAF7F2' : '#722F37',
          }}
        >
          {t.name[0]}
        </div>
        <div>
          <span
            className="block text-sm font-semibold"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '1.05rem',
              color: dark ? 'rgba(250,247,242,0.9)' : 'rgba(74,21,32,0.9)',
            }}
          >
            {t.name}
          </span>
          <span
            className="text-xs"
            style={{ color: dark ? 'rgba(250,247,242,0.32)' : 'rgba(114,47,55,0.38)' }}
          >
            {t.age} years old
          </span>
        </div>
      </div>
    </div>
  )
}

function MarqueeRow({
  items,
  direction,
  duration,
  dark,
}: {
  items: typeof TESTIMONIALS
  direction: 'left' | 'right'
  duration: number
  dark: boolean
}) {
  // Duplicate once for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden">
      <div
        className="marquee-track flex"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={i} t={t} dark={dark} />
        ))}
      </div>
    </div>
  )
}

export function LivingTestimonials({ dark }: { dark: boolean }) {
  return (
    <section id="testimonials" className="py-28 overflow-hidden">
      {/* Header */}
      <div className="px-6 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
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
      </div>

      {/* Marquee rows — full-bleed, edge-faded */}
      <div
        className="relative"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div className="flex flex-col gap-4">
          <MarqueeRow items={ROW1} direction="left"  duration={40} dark={dark} />
          <MarqueeRow items={ROW2} direction="right" duration={34} dark={dark} />
        </div>
      </div>
    </section>
  )
}
