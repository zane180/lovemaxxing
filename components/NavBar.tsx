'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Heart, User } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

const NAV_ITEMS = [
  { href: '/discover', icon: Compass, label: 'Discover', key: 'discover' },
  { href: '/matches', icon: Heart,    label: 'Matches',  key: 'matches'  },
  { href: '/profile', icon: User,     label: 'Profile',  key: 'profile'  },
] as const

type NavKey = typeof NAV_ITEMS[number]['key']

export default function NavBar({ active }: { active: NavKey }) {
  const totalUnread = useAuthStore((s) => s.totalUnread)

  return (
    <nav
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto relative flex items-center bg-white/75 dark:bg-[#1A0A0E]/80 backdrop-blur-2xl rounded-full border border-white/70 dark:border-white/8 p-1.5 shadow-[0_8px_40px_rgba(114,47,55,0.22),0_2px_12px_rgba(0,0,0,0.08)]">
        {NAV_ITEMS.map(({ href, icon: Icon, label, key }) => {
          const isActive   = active === key
          const showBadge  = key === 'matches' && totalUnread > 0
          return (
            <Link
              key={key}
              href={href}
              className="relative flex flex-col items-center gap-0.5 py-2.5 min-w-[76px] rounded-full active:scale-90 transition-transform duration-100"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-burgundy-900 rounded-full shadow-[0_2px_16px_rgba(114,47,55,0.55)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
                />
              )}

              {/* Icon + badge wrapper */}
              <div className="relative z-10">
                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive
                      ? 'text-cream-100 scale-110'
                      : 'text-burgundy-900/45 dark:text-cream-100/30'
                  }`}
                  fill={isActive && key === 'matches' ? 'currentColor' : 'none'}
                />

                {/* Unread badge — Instagram style */}
                <AnimatePresence>
                  {showBadge && (
                    <motion.div
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#E8253A] rounded-full flex items-center justify-center px-[3px] border-[1.5px] border-white dark:border-[#1A0A0E]"
                    >
                      <span className="text-white text-[9px] font-bold leading-none tabular-nums">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span
                className={`relative z-10 text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'text-cream-100'
                    : 'text-burgundy-900/45 dark:text-cream-100/30'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
