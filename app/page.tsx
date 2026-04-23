'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Brain, Shield, ChevronRight, Star } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Interest Matching',
    description: 'We analyze your vibe — your humor, content taste, and passions — to find someone who actually gets you.',
  },
  {
    icon: Sparkles,
    title: 'Face Type Compatibility',
    description: 'Our AI reads facial features and matches you with people whose look aligns with what you\'re genuinely attracted to.',
  },
  {
    icon: Heart,
    title: 'Lovemaxxing Score',
    description: 'A proprietary compatibility score combining interests, values, and attraction — not just swipes.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your photos are processed locally. We never store biometric data. Your privacy is sacred.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Ava K.',
    age: 26,
    text: 'Matched with someone who has the same niche humor as me. It actually felt like the algorithm understood my soul.',
    stars: 5,
  },
  {
    name: 'Marcus T.',
    age: 29,
    text: 'Every other app gave me people I had zero connection with. Lovemaxxing\'s AI actually gets what I\'m about.',
    stars: 5,
  },
  {
    name: 'Priya S.',
    age: 24,
    text: 'The face analysis feature is wild — matched me with someone who looks exactly like my type. Met in person and felt instant chemistry.',
    stars: 5,
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-cream-100 overflow-x-hidden">
      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 40
            ? 'bg-white/90 backdrop-blur-md shadow-card border-b border-cream-300'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-burgundy-900 fill-burgundy-900" />
            <span className="font-serif text-xl font-bold text-burgundy-950">Lovemaxxing</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-burgundy-900 hover:text-burgundy-700 transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm text-burgundy-900 hover:text-burgundy-700 transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-burgundy-900 font-medium hover:text-burgundy-700 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-burgundy-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="max-w-4xl mx-auto px-6 text-center"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-burgundy-900/10 text-burgundy-900 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Dating That Actually Works
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-serif text-5xl md:text-7xl font-bold text-burgundy-950 leading-tight mb-6"
          >
            Stop Swiping.
            <br />
            <span className="italic text-burgundy-900">Start Connecting.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-burgundy-800/70 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Lovemaxxing matches you based on your real personality — your humor, your interests,
            your taste — combined with AI that understands genuine physical attraction.
            No more wasted dates.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Find Your Match
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
              Sign In
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 text-sm text-burgundy-800/50">
            Free to join · No credit card required
          </motion.p>
        </motion.div>

        {/* Floating cards preview */}
        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="relative w-48">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute w-40 h-56 bg-white rounded-3xl shadow-luxury border border-cream-300"
                style={{
                  top: i * -8,
                  right: i * 12,
                  zIndex: 3 - i,
                  transform: `rotate(${(i - 1) * 6}deg)`,
                  background: i === 0
                    ? 'linear-gradient(135deg, #722F37, #4A1520)'
                    : i === 1
                    ? '#FAF7F2'
                    : '#F5F0E8',
                }}
              >
                {i === 0 && (
                  <div className="p-4 flex flex-col h-full justify-end">
                    <div className="w-8 h-8 rounded-full bg-white/20 mb-2" />
                    <div className="h-2 w-20 bg-white/40 rounded mb-1" />
                    <div className="h-2 w-12 bg-white/30 rounded" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-burgundy-950 mb-4">
              Why Lovemaxxing?
            </h2>
            <p className="text-burgundy-800/60 text-lg max-w-xl mx-auto">
              We built the dating app we always wanted — one that uses AI intelligently.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  className="card-luxury group hover:shadow-luxury transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-burgundy-900/10 flex items-center justify-center flex-shrink-0 group-hover:bg-burgundy-900 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-burgundy-900 group-hover:text-cream-100 transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-burgundy-950 mb-2">{feature.title}</h3>
                      <p className="text-burgundy-800/60 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gradient-luxury">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold text-cream-100 mb-4">
            How It Works
          </motion.h2>
          <motion.p variants={fadeUp} className="text-cream-300 text-lg mb-16">
            Three steps to finding someone who actually fits.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Build Your Vibe', desc: 'Select your interests, humor style, and content categories. Tell us what you love.' },
              { step: '02', title: 'Face Analysis', desc: 'Upload a photo. Our AI reads your features and you describe your physical type preferences.' },
              { step: '03', title: 'Get Matched', desc: 'We surface your highest-compatibility matches — not thousands of randoms, just the right ones.' },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="text-left">
                <div className="font-serif text-6xl font-bold text-gold-500/40 mb-3">{item.step}</div>
                <h3 className="font-serif text-xl font-semibold text-cream-100 mb-2">{item.title}</h3>
                <p className="text-cream-300/80 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="mt-16">
            <Link href="/signup" className="btn-gold inline-flex items-center gap-2 text-base px-8 py-4">
              Start for Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-burgundy-950 mb-4">Real Connections</h2>
            <p className="text-burgundy-800/60 text-lg">From people who stopped settling.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp} className="card-luxury">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold-500 fill-gold-500" />
                  ))}
                </div>
                <p className="text-burgundy-800/80 leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-burgundy-900/20 flex items-center justify-center text-xs font-bold text-burgundy-900">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-burgundy-950">{t.name}</p>
                    <p className="text-xs text-burgundy-800/50">{t.age} years old</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold text-burgundy-950 mb-4">
            Ready to Lovemaxx?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-burgundy-800/60 text-lg mb-8">
            Join thousands of people who finally found matches worth their time.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
              Create Your Profile
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cream-300 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-burgundy-900 fill-burgundy-900" />
            <span className="font-serif font-bold text-burgundy-950">Lovemaxxing</span>
          </div>
          <p className="text-sm text-burgundy-800/50">© 2025 Lovemaxxing. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-burgundy-800/50 hover:text-burgundy-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-burgundy-800/50 hover:text-burgundy-900 transition-colors">Terms</Link>
            <a href="mailto:support@lovemaxxing.com" className="text-sm text-burgundy-800/50 hover:text-burgundy-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
