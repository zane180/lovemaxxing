'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

type NavKey = 'discover' | 'matches' | 'profile'

export default function AppNavBar() {
  const pathname = usePathname()

  let active: NavKey | null = null
  if (pathname.startsWith('/discover')) active = 'discover'
  else if (pathname.startsWith('/matches')) active = 'matches'
  else if (pathname.startsWith('/profile')) active = 'profile'

  if (!active) return null

  return <NavBar active={active} />
}
