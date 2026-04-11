'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, Heart, MessageCircle, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/discover', icon: Compass, label: 'Discover', key: 'discover' },
  { href: '/matches', icon: Heart, label: 'Matches', key: 'matches' },
  { href: '/profile', icon: User, label: 'Profile', key: 'profile' },
] as const

type NavKey = typeof NAV_ITEMS[number]['key']

export default function NavBar({ active }: { active: NavKey }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-cream-300 pb-safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, key }) => {
          const isActive = active === key
          return (
            <Link
              key={key}
              href={href}
              className="flex flex-col items-center gap-1 py-2 px-4 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-burgundy-900 rounded-full"
                />
              )}
              <Icon
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive
                    ? 'text-burgundy-900'
                    : 'text-burgundy-800/40'
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
    </nav>
  )
}
