'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ChevronRight, Moon, Sun } from 'lucide-react'
import SplashScreen from '@/components/SplashScreen'
import { useDarkMode } from '@/lib/useDarkMode'
import { MagneticCursor }         from '@/components/MagneticCursor'
import { SplitWorldHero }         from '@/components/SplitWorldHero'
import { ScrollCinema }           from '@/components/ScrollCinema'
import { PhysicsCards }           from '@/components/PhysicsCards'
import { CompatibilitySpectrum }  from '@/components/CompatibilitySpectrum'
import { LivingTestimonials }     from '@/components/LivingTestimonials'

const STEPS = [
  { title: 'Build Your Vibe',  desc: 'Select interests, humor style, and content categories. Our AI profiles your unique personality.' },
  { title: 'Face Analysis',    desc: "Upload a photo. Our AI analyzes facial features and learns what physical types you're genuinely drawn to." },
  { title: 'Get Matched',      desc: 'We surface your highest-compatibility matches — not thousands of randoms, just the right ones.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

export default function LandingPage() {
  const { dark, toggle: toggleDark } = useDarkMode()
  const [showSplash, setShowSplash] = useState(true)
  const [scrollY,    setScrollY]    = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem('lm-splash-seen')) setShowSplash(false)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Global magnetic cursor */}
      <MagneticCursor />

      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            key="splash"
            onComplete={() => {
              sessionStorage.setItem('lm-splash-seen', '1')
              setShowSplash(false)
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-cream-100 dark:bg-transparent transition-colors duration-300 overflow-x-hidden">

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? 'bg-cream-100/90 dark:bg-[#080306]/90 backdrop-blur-xl border-b border-cream-300 dark:border-white/[0.06] shadow-sm dark:shadow-none'
            : 'bg-transparent'
        }`}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-burgundy-900 dark:text-burgundy-400 fill-burgundy-900 dark:fill-burgundy-400" />
              <span className="font-serif text-xl font-bold text-burgundy-950 dark:text-cream-100">Lovemaxxing</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Stories</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDark}
                data-magnetic
                className="w-9 h-9 rounded-full flex items-center justify-center text-burgundy-800/50 dark:text-cream-300/50 hover:text-burgundy-900 dark:hover:text-cream-100 hover:bg-burgundy-900/8 dark:hover:bg-white/8 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link href="/login"  className="text-sm text-burgundy-800/70 dark:text-cream-300/60 font-medium hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Sign In</Link>
              <Link href="/signup" data-magnetic className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </div>
          </div>
        </nav>

        {/* ── SPLIT WORLD HERO ────────────────────────────────────── */}
        <SplitWorldHero dark={dark} />

        {/* ── STATS ───────────────────────────────────────────────── */}
        <section className="py-16 border-y border-cream-300 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.015]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-4 md:gap-12">
              {[
                { value: '94%',   label: 'Match Accuracy'    },
                { value: '12k+',  label: 'Connections Made'  },
                { value: '4.9 ★', label: 'Average Rating'    },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                >
                  <p className="font-serif text-4xl md:text-5xl font-bold text-burgundy-950 dark:text-cream-100 mb-1">{stat.value}</p>
                  <p className="text-burgundy-800/45 dark:text-cream-300/35 text-xs md:text-sm uppercase tracking-[0.15em]">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCROLL CINEMA ───────────────────────────────────────── */}
        <ScrollCinema dark={dark} />

        {/* ── PHYSICS CARDS ───────────────────────────────────────── */}
        <PhysicsCards dark={dark} />

        {/* ── COMPATIBILITY SPECTRUM ──────────────────────────────── */}
        <CompatibilitySpectrum dark={dark} />

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <section id="how-it-works" className="py-32 px-6 border-y border-cream-300 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.015] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(114,47,55,0.05) 0%, transparent 55%), radial-gradient(circle at 80% 50%, rgba(201,169,110,0.04) 0%, transparent 55%)' }}
          />
          <div className="max-w-5xl mx-auto relative">
            <motion.div
              className="text-center mb-20"
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.25em] text-burgundy-700 dark:text-burgundy-400 mb-3">The Process</motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold text-burgundy-950 dark:text-cream-100 mb-4">How It Works</motion.h2>
              <motion.p variants={fadeUp} className="text-burgundy-800/55 dark:text-cream-300/45 text-lg">Three steps to finding someone who actually fits.</motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 relative">
              <div className="absolute top-[52px] left-[calc(16%+32px)] right-[calc(16%+32px)] h-px hidden md:block overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold-500/20 via-gold-500/50 to-gold-500/20"
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }} style={{ transformOrigin: 'left' }}
                />
              </div>
              {STEPS.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="relative text-center p-8"
                  data-tilt
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full border border-gold-500/50 dark:border-gold-500/40 bg-gold-500/8 dark:bg-gold-500/10 flex items-center justify-center mx-auto mb-6 relative z-10"
                    whileHover={{ scale: 1.1, borderColor: 'rgba(201,169,110,0.8)' }}
                  >
                    <span className="font-serif text-xl font-bold text-gold-600 dark:text-gold-400">{i + 1}</span>
                  </motion.div>
                  <h3 className="font-serif text-xl font-semibold text-burgundy-950 dark:text-cream-100 mb-3">{item.title}</h3>
                  <p className="text-burgundy-800/55 dark:text-cream-300/45 leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }}
            >
              <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
                Start for Free <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── LIVING TESTIMONIALS ─────────────────────────────────── */}
        <LivingTestimonials dark={dark} />

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-burgundy-900/8 dark:bg-burgundy-900/20 rounded-full blur-[100px]" />
          </div>
          <motion.div
            className="max-w-3xl mx-auto text-center relative"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="relative inline-block mb-10">
              <motion.div
                className="w-24 h-24 rounded-full border border-burgundy-900/20 dark:border-burgundy-900/30 bg-burgundy-900/8 dark:bg-burgundy-900/10 flex items-center justify-center mx-auto"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart className="w-11 h-11 text-burgundy-700 dark:text-burgundy-400 fill-burgundy-200 dark:fill-burgundy-900/60" />
              </motion.div>
              <motion.div
                className="absolute inset-[-10px] rounded-full border border-burgundy-900/10 dark:border-burgundy-900/15"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <motion.h2 variants={fadeUp} className="font-serif text-5xl md:text-7xl font-bold text-burgundy-950 dark:text-cream-100 mb-6 leading-tight">
              Ready to Lovemaxx?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-burgundy-800/55 dark:text-cream-300/45 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of people who finally found matches worth their time.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/signup" data-magnetic className="btn-primary inline-flex items-center gap-2 text-lg px-14 py-5">
                Create Your Profile <ChevronRight className="w-6 h-6" />
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-6 text-burgundy-800/35 dark:text-cream-300/25 text-sm">
              Free to join · No credit card required
            </motion.p>
          </motion.div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="border-t border-cream-300 dark:border-white/[0.05] py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-burgundy-900 dark:text-burgundy-500 fill-burgundy-900 dark:fill-burgundy-800" />
              <span className="font-serif font-bold text-burgundy-950 dark:text-cream-300/40">Lovemaxxing</span>
            </div>
            <p className="text-sm text-burgundy-800/40 dark:text-cream-300/25">© 2026 Lovemaxxing. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-burgundy-800/40 dark:text-cream-300/30 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Privacy</Link>
              <Link href="/terms"   className="text-sm text-burgundy-800/40 dark:text-cream-300/30 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Terms</Link>
              <a href="mailto:lovemaxxingbeta@gmail.com" className="text-sm text-burgundy-800/40 dark:text-cream-300/30 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
