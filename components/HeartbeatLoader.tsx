'use client'
import { motion } from 'framer-motion'

export default function HeartbeatLoader({ size = 40 }: { size?: number }) {
  return (
    <motion.svg
      viewBox="0 0 40 37"
      width={size}
      height={size}
      animate={{ scale: [1, 1.25, 0.92, 1.18, 1] }}
      transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
      style={{ filter: 'drop-shadow(0 0 8px rgba(114,47,55,0.5))' }}
    >
      <path
        d="M20 34.5C20 34.5 1 21.5 1 10.5C1 5.25 5.25 1 10.5 1C13.95 1 17 2.85 18.75 5.6L20 7.4L21.25 5.6C23 2.85 26.05 1 29.5 1C34.75 1 39 5.25 39 10.5C39 21.5 20 34.5 20 34.5Z"
        fill="#722F37"
      />
    </motion.svg>
  )
}
