'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Heart, Sparkles, Brain, Shield, ChevronRight, Star, ArrowDown, Moon, Sun } from 'lucide-react'
import SplashScreen from '@/components/SplashScreen'
import { useDarkMode } from '@/lib/useDarkMode'

const CYCLING_WORDS = ['your vibe', 'your humor', 'your type', 'your soul']

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Interest Matching',
    description: 'We analyze your humor, content taste, and passions to find someone who actually gets you.',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: Sparkles,
    title: 'Face Type Compatibility',
    description: "Our AI reads facial features and matches you with people whose look aligns with what you're genuinely attracted to.",
    iconBg: 'bg-gold-50 dark:bg-gold-500/10 border-gold-100 dark:border-gold-500/20',
    iconColor: 'text-gold-600 dark:text-gold-400',
  },
  {
    icon: Heart,
    title: 'Lovemaxxing Score',
    description: 'A proprietary compatibility score combining interests, values, and attraction — not just swipes.',
    iconBg: 'bg-burgundy-50 dark:bg-burgundy-900/20 border-burgundy-100 dark:border-burgundy-900/30',
    iconColor: 'text-burgundy-700 dark:text-burgundy-400',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your photos are processed securely. We never store biometric data. Your privacy is sacred.',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

const TESTIMONIALS = [
  { name: 'Ava K.',    age: 26, text: 'Matched with someone who has the same niche humor as me. It actually felt like the algorithm understood my soul.', stars: 5 },
  { name: 'Marcus T.', age: 29, text: "Every other app gave me people I had zero connection with. Lovemaxxing's AI actually gets what I'm about.", stars: 5 },
  { name: 'Priya S.',  age: 24, text: 'The face analysis feature is wild — matched me with someone who looks exactly like my type. Felt instant chemistry.', stars: 5 },
  { name: 'Jordan M.', age: 31, text: "I was skeptical about AI dating but my 91% match score with my partner was no coincidence. We've been together 8 months.", stars: 5 },
  { name: 'Zoe R.',    age: 23, text: 'Finally an app that understands attraction is more than just swiping on pretty pictures.', stars: 5 },
  { name: 'Theo B.',   age: 27, text: 'Met someone who shares my exact humor and aesthetic. Lovemaxxing just gets it.', stars: 5 },
]

const STEPS = [
  { title: 'Build Your Vibe',  desc: 'Select your interests, humor style, and content categories. Our AI profiles your unique personality.' },
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
  const [wordIdx,    setWordIdx]    = useState(0)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 40, damping: 25 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 25 })
  const card1X  = useTransform(springX, v => v * -1.8)
  const card1Y  = useTransform(springY, v => v * -1.4)
  const card2X  = useTransform(springX, v => v * 1.4)
  const card2Y  = useTransform(springY, v => v * 1.8)
  const orbX    = useTransform(springX, v => v * 2.2)
  const orbY    = useTransform(springY, v => v * 2.2)

  useEffect(() => {
    if (sessionStorage.getItem('lm-splash-seen')) setShowSplash(false)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth  / 2) / window.innerWidth  * 40)
      mouseY.set((e.clientY - window.innerHeight / 2) / window.innerHeight * 40)
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [mouseX, mouseY])

  useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % CYCLING_WORDS.length), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <>
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

      <div className="min-h-screen bg-cream-100 dark:bg-[#080306] transition-colors duration-300 overflow-x-hidden">

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
              <a href="#features"     className="text-sm text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Stories</a>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="w-9 h-9 rounded-full flex items-center justify-center text-burgundy-800/50 dark:text-cream-300/50 hover:text-burgundy-900 dark:hover:text-cream-100 hover:bg-burgundy-900/8 dark:hover:bg-white/8 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {dark
                  ? <Sun  className="w-4 h-4" />
                  : <Moon className="w-4 h-4" />
                }
              </button>
              <Link href="/login"  className="text-sm text-burgundy-800/70 dark:text-cream-300/60 font-medium hover:text-burgundy-950 dark:hover:text-cream-100 transition-colors">Sign In</Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

          {/* Ambient glow — subtle on light, rich on dark */}
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[560px] rounded-full blur-[130px] pointer-events-none"
            style={{
              background: dark
                ? 'radial-gradient(ellipse, rgba(114,47,55,0.28) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(114,47,55,0.07) 0%, transparent 70%)',
              x: orbX, y: orbY,
            }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-500/[0.06] dark:bg-gold-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Soft particles */}
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none bg-burgundy-900/20 dark:bg-cream-100/25"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${10 + (i * 5.4) % 82}%`,
                top:  `${8  + (i * 7.1) % 76}%`,
              }}
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.6, 1] }}
              transition={{ duration: 2.5 + (i % 4) * 0.7, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}

          {/* Profile Card — LEFT */}
          <motion.div
            className="absolute left-[7%] xl:left-[12%] top-1/2 -translate-y-[55%] hidden lg:block z-10"
            style={{ x: card1X, y: card1Y }}
            initial={{ opacity: 0, x: -60, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
          >
            <motion.div
              className="w-52 rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(114,47,55,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-burgundy-900/10 dark:border-white/[0.08]"
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="h-72 bg-gradient-to-br from-[#3a1020] via-[#5a1e2e] to-[#722F37] relative">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                  <span className="text-2xl font-serif font-bold text-white/50">S</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-serif text-lg font-semibold text-cream-100 leading-none mb-0.5">Sofia, 24</p>
                  <p className="text-xs text-cream-300/50 mb-3">New York, NY</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Travel', 'Art', 'Film'].map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-cream-100/70 border border-white/10">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Profile Card — RIGHT */}
          <motion.div
            className="absolute right-[7%] xl:right-[12%] top-1/2 -translate-y-[45%] hidden lg:block z-10"
            style={{ x: card2X, y: card2Y }}
            initial={{ opacity: 0, x: 60, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 1.1, duration: 1, ease: 'easeOut' }}
          >
            <motion.div
              className="w-52 rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(114,47,55,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-burgundy-900/10 dark:border-white/[0.08]"
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
            >
              <div className="h-72 bg-gradient-to-br from-[#1a0820] via-[#2d1040] to-[#3d1060] relative">
                {/* Match score badge */}
                <motion.div
                  className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-100/90 dark:bg-[#080306]/70 border border-gold-400/60 backdrop-blur-sm z-10"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.6, type: 'spring', stiffness: 200 }}
                  style={{ boxShadow: '0 0 12px rgba(201,169,110,0.3)' }}
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-gold-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  <span className="text-gold-600 dark:text-gold-400 font-bold text-xs">94% match</span>
                </motion.div>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                  <span className="text-2xl font-serif font-bold text-white/50">J</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-serif text-lg font-semibold text-cream-100 leading-none mb-0.5">James, 27</p>
                  <p className="text-xs text-cream-300/50 mb-3">New York, NY</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Music', 'Books', 'Coffee'].map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-cream-100/70 border border-white/10">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero copy */}
          <motion.div
            className="relative z-20 text-center max-w-3xl mx-auto px-6 pt-16"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-burgundy-900/20 dark:border-burgundy-900/40 bg-burgundy-900/8 dark:bg-burgundy-900/10 text-burgundy-700 dark:text-burgundy-300 text-sm font-medium mb-10"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Dating That Actually Works
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-serif text-5xl md:text-7xl font-bold text-burgundy-950 dark:text-cream-100 leading-[1.05] mb-2">
              Stop Swiping.
            </motion.h1>
            <motion.h2
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8"
              style={{
                fontFamily: "'Great Vibes', cursive",
                background: 'linear-gradient(135deg, #C9A96E 0%, #B8923A 50%, #C9A96E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Start Connecting.
            </motion.h2>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-burgundy-800/60 dark:text-cream-300/55 max-w-xl mx-auto mb-2 leading-relaxed">
              AI that truly understands{' '}
              <span className="inline-block min-w-[110px] text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIdx}
                    className="inline-block text-burgundy-900 dark:text-cream-100 font-semibold"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {CYCLING_WORDS[wordIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
              {' '}— and finds someone who matches it.
            </motion.p>

            <motion.p variants={fadeUp} className="text-burgundy-800/45 dark:text-cream-300/40 text-base max-w-lg mx-auto mb-10 leading-relaxed">
              No more wasted dates. No more mismatched connections. Just people who genuinely fit.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary flex items-center gap-2 text-base px-10 py-4">
                Find Your Match
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-950 dark:hover:text-cream-100 font-medium text-base transition-colors flex items-center gap-1.5">
                Already have an account <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-sm text-burgundy-800/35 dark:text-cream-300/25">
              Free to join · No credit card required
            </motion.p>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] } as any}
            transition={{ opacity: { delay: 2 }, y: { duration: 1.6, repeat: Infinity } } as any}
          >
            <ArrowDown className="w-5 h-5 text-burgundy-800/25 dark:text-cream-300/20" />
          </motion.div>
        </section>

        {/* ── STATS ───────────────────────────────────────────────── */}
        <section className="py-16 border-y border-cream-300 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.015]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-4 md:gap-12">
              {[
                { value: '94%',   label: 'Match Accuracy' },
                { value: '12k+',  label: 'Connections Made' },
                { value: '4.9 ★', label: 'Average Rating' },
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

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-20"
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.25em] text-burgundy-700 dark:text-burgundy-400 mb-3">The Technology</motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold text-burgundy-950 dark:text-cream-100 mb-4">Why Lovemaxxing?</motion.h2>
              <motion.p variants={fadeUp} className="text-burgundy-800/55 dark:text-cream-300/45 text-lg max-w-xl mx-auto">
                We built the dating app we always wanted — one that uses AI intelligently.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    className="group card-luxury hover:shadow-luxury transition-all duration-300 cursor-default"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                  >
                    <div className={`w-13 h-13 w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 transition-all duration-300 ${feature.iconBg}`}>
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-burgundy-950 dark:text-cream-100 mb-2">{feature.title}</h3>
                    <p className="text-burgundy-800/55 dark:text-cream-300/45 leading-relaxed">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS  (deliberately dark for contrast rhythm) ─ */}
        <section className="py-32 px-6 bg-gradient-to-br from-[#4A1520] via-[#722F37] to-[#3d1020] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,169,110,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(201,169,110,0.15) 0%, transparent 50%)' }}
          />
          <div className="max-w-5xl mx-auto relative">
            <motion.div
              className="text-center mb-20"
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-3">The Process</motion.p>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold text-cream-100 mb-4">How It Works</motion.h2>
              <motion.p variants={fadeUp} className="text-cream-300/60 text-lg">Three steps to finding someone who actually fits.</motion.p>
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
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full border border-gold-500/40 bg-gold-500/10 flex items-center justify-center mx-auto mb-6 relative z-10"
                    whileHover={{ scale: 1.1, borderColor: 'rgba(201,169,110,0.8)' }}
                  >
                    <span className="font-serif text-xl font-bold text-gold-400">{i + 1}</span>
                  </motion.div>
                  <h3 className="font-serif text-xl font-semibold text-cream-100 mb-3">{item.title}</h3>
                  <p className="text-cream-300/55 leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }}
            >
              <Link href="/signup" className="btn-gold inline-flex items-center gap-2 text-base px-10 py-4">
                Start for Free <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────── */}
        <section id="testimonials" className="py-32 overflow-hidden">
          <motion.div
            className="text-center mb-16 px-6"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.25em] text-burgundy-700 dark:text-burgundy-400 mb-3">Stories</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold text-burgundy-950 dark:text-cream-100 mb-4">Real Connections</motion.h2>
            <motion.p variants={fadeUp} className="text-burgundy-800/55 dark:text-cream-300/45 text-lg">From people who stopped settling.</motion.p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-cream-100 dark:from-[#080306] to-transparent z-10 pointer-events-none transition-colors duration-300" />
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-cream-100 dark:from-[#080306] to-transparent z-10 pointer-events-none transition-colors duration-300" />
            <motion.div
              className="flex gap-5 w-max pl-5"
              animate={{ x: ['0px', '-50%'] }}
              transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            >
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} className="w-80 flex-shrink-0 card hover:shadow-luxury transition-all duration-300">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                    ))}
                  </div>
                  <p className="text-burgundy-800/70 dark:text-cream-200/65 leading-relaxed mb-5 text-sm italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-burgundy-900/10 dark:bg-burgundy-900/30 border border-burgundy-900/15 dark:border-burgundy-900/30 flex items-center justify-center text-sm font-bold text-burgundy-700 dark:text-burgundy-300 flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-burgundy-950 dark:text-cream-100">{t.name}</p>
                      <p className="text-xs text-burgundy-800/45 dark:text-cream-300/35">{t.age} years old</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

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
              <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-lg px-14 py-5">
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
