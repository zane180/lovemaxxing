'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** slide — slides in from the right (detail pages like chat, settings) */
  slide?: boolean
}

export default function PageWrapper({ children, slide = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: slide ? 0 : 14, x: slide ? 32 : 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
