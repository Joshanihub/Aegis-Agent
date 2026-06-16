'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  interactive?: boolean
  className?: string
  delay?: number
}

export default function GlassPanel({ children, interactive = false, className = '', delay = 0, ...props }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1], // ease-physics
        delay
      }}
      className={`glass-panel rounded-xl p-6 ${interactive ? 'glass-panel-hover cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
