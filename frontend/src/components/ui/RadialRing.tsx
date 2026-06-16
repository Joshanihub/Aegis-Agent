'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface RadialRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export default function RadialRing({ score, size = 110, strokeWidth = 10, className = '' }: RadialRingProps) {
  const clamped = useMemo(() => Math.max(0, Math.min(100, score)), [score])
  
  const color = useMemo(() => {
    if (clamped <= 33) return 'text-emerald-agent'
    if (clamped <= 66) return 'text-amber-agent'
    return 'text-rose-agent'
  }, [clamped])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="var(--border-subtle)" 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="relative flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-3xl font-bold font-display"
        >
          {clamped}
        </motion.div>
        <div className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest mt-1">Risk</div>
      </div>
    </div>
  )
}
