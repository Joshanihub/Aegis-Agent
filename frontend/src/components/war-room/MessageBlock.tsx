'use client'

import type { BandMessage } from '@/lib/types'
import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'
import TypewriterEffect from '@/components/ui/TypewriterEffect'
import DynamicComponent, { type DynamicUIPayload } from '@/components/war-room/DynamicComponent'

function ownerAccent(owner: string) {
  if (owner === 'planner') return 'text-cyan-agent'
  if (owner === 'analyst') return 'text-indigo-init'
  if (owner === 'reviewer') return 'text-rose-agent'
  if (owner === 'finalizer') return 'text-emerald-agent'
  return 'text-on-surface-variant'
}

function ownerBorder(owner: string) {
  if (owner === 'planner') return 'border-l-cyan-agent/50'
  if (owner === 'analyst') return 'border-l-indigo-init/50'
  if (owner === 'reviewer') return 'border-l-rose-agent/50'
  if (owner === 'finalizer') return 'border-l-emerald-agent/50'
  return 'border-l-border-subtle'
}

export interface MessageBlockProps {
  m: BandMessage
  isLatest: boolean
  index: number
}

const MessageBlock = memo(function MessageBlock({ m, isLatest, index }: MessageBlockProps) {
  const [showRaw, setShowRaw] = useState(false)
  const formatConfidence = (n: number) => `${Math.max(0, Math.min(100, n))}%`
  const accent = ownerAccent(m.owner)
  const border = ownerBorder(m.owner)

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-l-4 ${border} border-border-subtle/60 bg-surface-container-low p-5 transition-colors duration-300`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MonoLabel className={`${accent} font-bold uppercase tracking-widest text-[11px]`}>{m.owner}</MonoLabel>
            <span className="text-border-subtle text-xs">·</span>
            <MonoLabel className="text-on-surface-variant text-[10px] uppercase tracking-wider">{m.action}</MonoLabel>
          </div>
          <div className="text-sm text-on-surface font-semibold leading-snug">{m.task}</div>
          {m.context && (
            <div className="text-xs text-on-surface-variant/70 mt-0.5">{m.context}</div>
          )}
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            m.output.confidence >= 80 ? 'text-emerald-agent bg-emerald-agent/10' :
            m.output.confidence >= 60 ? 'text-amber-agent bg-amber-agent/10' :
            'text-rose-agent bg-rose-agent/10'
          }`}>
            {formatConfidence(m.output.confidence)}
          </span>
          <MonoLabel className="block text-on-surface-variant/50 text-[10px]">{m.output.api_used}</MonoLabel>
        </div>
      </div>

      {/* Reasoning block — typewriter only on latest message for performance */}
      <div className="text-sm text-on-surface-variant leading-relaxed font-mono whitespace-pre-wrap bg-surface-container/40 p-4 rounded-lg border border-border-subtle/40 max-h-[320px] overflow-y-auto custom-scrollbar">
        {isLatest
          ? <TypewriterEffect text={m.output.reasoning} speed={4} />
          : m.output.reasoning
        }
      </div>

      {/* Dynamic chart if the agent included one */}
      {m.output.data.dynamic_ui != null && typeof m.output.data.dynamic_ui === 'object' && (
        <DynamicComponent payload={m.output.data.dynamic_ui as DynamicUIPayload} />
      )}

      {/* Raw data toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-[10px] uppercase font-mono text-on-surface-variant/40 hover:text-accent-luminous transition-colors flex items-center gap-1"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          {showRaw ? 'Hide raw data' : 'View raw data'}
        </button>
        <AnimatePresence>
          {showRaw && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <pre className="bg-surface-container-lowest border border-border-subtle p-3 rounded-md text-[11px] text-on-surface-variant font-mono overflow-x-auto max-h-48 custom-scrollbar">
                {JSON.stringify(m.output.data, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Handoff arrow */}
      {m.next_handoff && (
        <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between gap-4">
          <MonoLabel className="text-on-surface-variant/60 text-[10px] flex items-center gap-2">
            HANDOFF
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span className="text-primary font-bold">{m.next_handoff.agent.toUpperCase()}</span>
          </MonoLabel>
          <div className="text-[10px] text-on-surface-variant/50 font-mono text-right max-w-[200px] line-clamp-2">{m.next_handoff.reason}</div>
        </div>
      )}
    </motion.div>
  )
})

export default MessageBlock
