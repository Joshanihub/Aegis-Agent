'use client'

import type { AgentState } from '@/lib/types'
import GlassPanel from '@/components/ui/GlassPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'

export interface AgentCardProps {
  agent: AgentState
  isActive: boolean
}

const processingVariants = {
  idle: {
    scale: 1,
    y: 0,
    opacity: 0.5,
    rotateX: 0,
    rotateY: 0,
  },
  active: {
    scale: 1.02,
    y: -2,
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
  },
  processing: {
    scale: [1.02, 1.04, 1.02],
    y: [-2, -6, -2],
    opacity: 1,
    rotateX: [0, 1, 0, -0.5, 0],
    rotateY: [0, -1, 0, 0.5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  complete: {
    scale: 1,
    y: 0,
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
  },
}

export default function AgentCard({
  agent,
  isActive,
}: AgentCardProps) {
  const isProcessing = agent.status === 'processing'
  const isComplete = agent.status === 'complete'

  const borderClass = (() => {
    if (agent.agent_id === 'planner') return 'border-cyan-agent shadow-glow-cyan'
    if (agent.agent_id === 'analyst') return 'border-indigo-init shadow-[0_0_20px_rgba(99,102,241,0.1)]'
    if (agent.agent_id === 'reviewer') return 'border-rose-agent shadow-[0_0_20px_rgba(244,63,94,0.1)]'
    if (agent.agent_id === 'finalizer') return 'border-emerald-agent shadow-[0_0_20px_rgba(16,185,129,0.1)]'
    return 'border-border-subtle'
  })()

  const glowColor = (() => {
    if (agent.agent_id === 'planner') return 'rgba(6,182,212,0.15)'
    if (agent.agent_id === 'analyst') return 'rgba(99,102,241,0.15)'
    if (agent.agent_id === 'reviewer') return 'rgba(244,63,94,0.15)'
    if (agent.agent_id === 'finalizer') return 'rgba(16,185,129,0.15)'
    return 'rgba(255,255,255,0.05)'
  })()

  type BadgeVariant = 'cyan' | 'indigo' | 'rose' | 'emerald' | 'default'
  const variantMap: Record<string, BadgeVariant> = {
    planner: 'cyan',
    analyst: 'indigo',
    reviewer: 'rose',
    finalizer: 'emerald',
  }
  const badgeVariant: BadgeVariant = variantMap[agent.agent_id] ?? 'default'

  const statusLine = agent.last_action?.trim() ? agent.last_action : 'AWAITING…'
  const isAgentIdle = statusLine === 'AWAITING…'

  const gradientHeader = (() => {
    if (agent.agent_id === 'planner') return 'from-cyan-agent/20 to-transparent border-b-cyan-agent/20'
    if (agent.agent_id === 'analyst') return 'from-indigo-init/20 to-transparent border-b-indigo-init/20'
    if (agent.agent_id === 'reviewer') return 'from-rose-agent/20 to-transparent border-b-rose-agent/20'
    if (agent.agent_id === 'finalizer') return 'from-emerald-agent/20 to-transparent border-b-emerald-agent/20'
    return 'from-border-subtle/20 to-transparent border-b-border-subtle/20'
  })()

  const animateState = isProcessing
    ? 'processing'
    : isComplete
      ? 'complete'
      : isActive
        ? 'active'
        : 'idle'

  return (
    <motion.div
      variants={processingVariants}
      animate={animateState}
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 800 }}
      data-testid="agent-card"
      className={`glass-panel overflow-hidden transition-colors duration-300 relative ${isActive ? `${borderClass} ambient-glow node-card` : 'border-border-subtle'}`}
      aria-live="polite"
    >
      {/* Processing glow overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${glowColor}, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* Scan line overlay during processing */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 w-full h-px z-0 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`, boxShadow: `0 0 12px 3px ${glowColor}` }}
          />
        )}
      </AnimatePresence>

      {/* Header Area */}
      <div className={`h-12 w-full bg-gradient-to-b ${gradientHeader} border-b flex items-center justify-between px-4 relative z-10`}>
        <div className="flex items-center gap-2">
          <motion.div
            animate={isProcessing ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
            transition={isProcessing ? { duration: 1.2, repeat: Infinity } : {}}
            className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-on-surface' : 'bg-on-surface-variant'}`}
          />
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">{agent.role}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container-high border border-border-subtle font-mono text-[9px] text-on-surface-variant tracking-wider truncate max-w-[100px]">
            {agent.api_used || (['analyst', 'reviewer'].includes(agent.agent_id) ? 'Featherless AI' : 'AI/ML API')}
          </span>
          <StatusBadge status={agent.status} variant={badgeVariant} />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 relative z-10">
        <div className="font-headline text-headline-md text-on-surface text-base font-semibold mb-3 flex items-center justify-between">
          <span>{agent.name}</span>
          {/* Confidence indicator on complete */}
          <AnimatePresence>
            {isComplete && agent.confidence != null && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-mono text-emerald-agent bg-emerald-agent/10 px-2 py-0.5 rounded"
              >
                {agent.confidence}%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={statusLine}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-body-md text-on-surface-variant text-sm font-mono break-words line-clamp-2 h-10"
              title={statusLine}
            >
              {statusLine}
            </motion.div>
          </AnimatePresence>

          {isActive && !isAgentIdle && (
            <div className="absolute -bottom-4 left-0 w-full h-0.5 bg-surface-container rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="h-full bg-accent-luminous w-1/3 rounded-full"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
