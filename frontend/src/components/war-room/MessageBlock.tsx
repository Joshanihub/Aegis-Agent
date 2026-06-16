'use client'

import type { BandMessage } from '@/lib/types'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'
import TypewriterEffect from '@/components/ui/TypewriterEffect'

function ownerAccent(owner: string) {
  if (owner === 'planner') return 'text-cyan-agent'
  if (owner === 'analyst') return 'text-indigo-init'
  if (owner === 'reviewer') return 'text-rose-agent'
  if (owner === 'finalizer') return 'text-emerald-agent'
  return 'text-on-surface-variant'
}

export interface MessageBlockProps {
  m: BandMessage
  isBlurred: boolean
}

export default function MessageBlock({ m, isBlurred }: MessageBlockProps) {
  const [showRaw, setShowRaw] = useState(false)
  const formatConfidence = (n: number) => `${Math.max(0, Math.min(100, n))}%`

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ 
        opacity: isBlurred ? 0.4 : 1, 
        x: 0,
        filter: isBlurred ? 'blur(1px)' : 'blur(0px)'
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border ${isBlurred ? 'border-border-subtle bg-transparent' : 'border-border-subtle/80 bg-surface-container-low'} p-5 transition-all duration-300 ambient-glow-hover`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MonoLabel className={ownerAccent(m.owner)}>{m.owner}</MonoLabel>
            <span className="text-border-subtle">•</span>
            <MonoLabel className="text-on-surface-variant">{m.action}</MonoLabel>
          </div>
          <div className="mt-2 text-sm text-on-surface font-semibold">
            {m.task}
          </div>
          {m.context && (
            <div className="mt-1 text-xs text-text-muted">
              {m.context}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <MonoLabel className="block text-on-surface-variant">CONF: {formatConfidence(m.output.confidence)}</MonoLabel>
          <MonoLabel className="block text-on-surface-variant/70 mt-1">API: {m.output.api_used}</MonoLabel>
        </div>
      </div>

      <div className="mt-4 text-sm text-on-surface-variant leading-relaxed font-mono whitespace-pre-wrap bg-surface-container/50 p-4 rounded-lg border border-border-subtle/50">
        <TypewriterEffect text={m.output.reasoning} speed={10} />
      </div>

      <div className="mt-3">
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className="text-[10px] uppercase font-mono text-text-muted hover:text-accent-luminous transition-colors flex items-center gap-1"
        >
          {showRaw ? 'HIDE RAW IMPLEMENTATION DATA' : 'VIEW RAW IMPLEMENTATION DATA'}
        </button>
        <AnimatePresence>
          {showRaw && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <pre className="bg-surface-container-lowest border border-border-subtle p-3 rounded-md text-[11px] text-on-surface-variant font-mono overflow-x-auto">
                {JSON.stringify(m.output.data, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {m.next_handoff && (
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-4">
          <MonoLabel className="text-text-muted">
            HANDOFF <span className="text-primary ml-1">→ {m.next_handoff.agent}</span>
          </MonoLabel>
          <div className="text-xs text-on-surface-variant/60 text-right">{m.next_handoff.reason}</div>
        </div>
      )}
    </motion.div>
  )
}
