'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

export default function RiskRing({ score, size = 110, strokeWidth = 10 }: { score: number, size?: number, strokeWidth?: number }) {
  const clamped = useMemo(() => Math.max(0, Math.min(100, score)), [score])

  const color = useMemo(() => {
    if (clamped <= 33) return 'emerald'
    if (clamped <= 66) return 'amber'
    return 'rose'
  }, [clamped])

  const ringClass = (() => {
    if (color === 'emerald') return 'text-emerald-agent'
    if (color === 'amber') return 'text-amber-agent'
    return 'text-rose-agent'
  })()

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border-subtle)" strokeWidth={strokeWidth} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={ringClass}
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="relative flex flex-col items-center justify-center">
          <div className="text-3xl font-bold font-display">{clamped}</div>
          <div className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest mt-1">Risk</div>
        </div>
      </div>

      <div className="text-center w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Risk Grade</div>
        <div className="mt-1 text-lg font-semibold font-headline tracking-wide">
          {color === 'emerald' ? 'LOW' : color === 'amber' ? 'MEDIUM' : 'HIGH'}
        </div>
      </div>
    </div>
  )
}
