'use client'

import { motion } from 'framer-motion'

export interface WorkflowProgressProps {
  percentage: number
  activeAgent?: string | null
  status?: 'idle' | 'processing' | 'completing' | 'complete'
}

export default function WorkflowProgress({
  percentage,
  activeAgent,
  status = 'idle',
}: WorkflowProgressProps) {
  const isAnimating = status === 'processing' || status === 'completing'

  const statusColor = (() => {
    switch (status) {
      case 'processing':
      case 'completing':
        return 'from-accent-luminous to-primary'
      case 'complete':
        return 'from-emerald-agent to-emerald-agent'
      default:
        return 'from-border-subtle to-border-subtle'
    }
  })()

  const statusText = (() => {
    switch (status) {
      case 'processing':
      case 'completing':
        return `${percentage}% • ${activeAgent?.toUpperCase() || 'PROCESSING'}`
      case 'complete':
        return 'COMPLETE'
      default:
        return 'READY'
    }
  })()

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">
          Analysis Progress
        </span>
        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
          status === 'complete' ? 'text-emerald-agent' : 'text-primary'
        }`}>
          {statusText}
        </span>
      </div>

      <div className="relative h-1 w-full bg-surface-container-high rounded-full overflow-hidden border border-border-subtle/30">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${statusColor} rounded-full`}
        />

        {/* Shimmer effect during processing */}
        {isAnimating && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '300%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        )}
      </div>
    </div>
  )
}
