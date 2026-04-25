'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, Heart, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/discover', icon: Compass, label: 'Discover', key: 'discover' },
  { href: '/matches', icon: Heart, label: 'Matches', key: 'matches' },
  { href: '/profile', icon: User, label: 'Profile', key: 'profile' },
] as const

type NavKey = typeof NAV_ITEMS[number]['key']

export default function NavBar({ active }: { active: NavKey }) {
  const activeIndex = NAV_ITEMS.findIndex((item) => item.key === active)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1E0C10]/95 backdrop-blur-md border-t border-cream-300 dark:border-[#3D1E24] pb-safe-bottom">
      <div className="max-w-lg mx-auto">
        {/* Single indicator that slides across all three tabs */}
        <div className="relative h-0.5">
          <motion.div
            className="absolute inset-y-0 bg-burgundy-900 rounded-full"
            style={{ width: `${100 / NAV_ITEMS.length}%` }}
            initial={false}
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
          />
        </div>

        {/* Grid gives each tab an identical width so the indicator aligns perfectly */}
        <div className="grid grid-cols-3 py-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, key }) => {
            const isActive = active === key
            return (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center gap-1 py-2"
              >
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-burgundy-900' : 'text-burgundy-800/40'
                  }`}
                  fill={isActive && key === 'matches' ? 'currentColor' : 'none'}
                />
                <span
                  className={`text-xs transition-colors duration-200 ${
                    isActive ? 'text-burgundy-900 font-medium' : 'text-burgundy-800/40'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
