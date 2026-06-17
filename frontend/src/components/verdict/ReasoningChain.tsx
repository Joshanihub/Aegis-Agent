'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { ReasoningStep, Citation } from '@/lib/types'
import MonoLabel from '@/components/ui/MonoLabel'

interface ReasoningChainProps {
  steps: ReasoningStep[]
  citations?: Citation[]
}

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  planner: { bg: 'bg-cyan-agent/10', text: 'text-cyan-agent', border: 'border-cyan-agent/30' },
  analyst: { bg: 'bg-indigo-init/10', text: 'text-indigo-init', border: 'border-indigo-init/30' },
  reviewer: { bg: 'bg-rose-agent/10', text: 'text-rose-agent', border: 'border-rose-agent/30' },
  finalizer: { bg: 'bg-emerald-agent/10', text: 'text-emerald-agent', border: 'border-emerald-agent/30' },
}

export default function ReasoningChain({ steps, citations }: ReasoningChainProps) {
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)

  if (!steps || steps.length === 0) return null

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2 mb-2">
        <MonoLabel className="text-on-surface-variant flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8"/><path d="M16 12h4v-4h-4"/><path d="M8 16H4v4h4"/><path d="M12 20v-4h4"/><circle cx="12" cy="12" r="2"/>
          </svg>
          REASONING CHAIN
        </MonoLabel>
      </div>

      <div className="relative pl-6 border-l border-border-subtle">
        {steps.map((step, idx) => {
          const colors = AGENT_COLORS[step.agent] ?? { bg: 'bg-surface-container', text: 'text-on-surface-variant', border: 'border-border-subtle' }
          return (
            <motion.div
              key={`${step.agent}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative mb-8 last:mb-0"
            >
              <div className={`absolute -left-[31px] top-2 w-3 h-3 rounded-full border-2 border-surface ${colors.bg}`} />
              <div className={`p-4 rounded-lg border ${colors.border} bg-surface-container-low`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-mono text-xs uppercase font-bold ${colors.text}`}>
                    {step.agent}
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant/50">
                    {step.confidence}% conf • {step.api}
                  </span>
                </div>
                <p className="text-sm text-on-surface/80 whitespace-pre-wrap font-body">
                  {step.reasoning || "Completed delegated reasoning task."}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {citations && citations.length > 0 && (
        <div className="mt-4 border-t border-border-subtle pt-6">
          <MonoLabel className="text-on-surface-variant mb-4">CITATIONS & EVIDENCE</MonoLabel>
          <div className="flex flex-wrap gap-3">
            {citations.map((cit) => (
              <button
                key={cit.id}
                onClick={() => setActiveCitation(cit)}
                className="px-3 py-1.5 text-xs font-mono rounded bg-surface-container border border-border-subtle text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                [{cit.id}] {cit.source_document}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Citation Popover */}
      <AnimatePresence>
        {activeCitation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm p-4"
            onClick={() => setActiveCitation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-high border border-border-subtle rounded-xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <MonoLabel className="text-primary mb-1">CITATION {activeCitation.id}</MonoLabel>
                  <h3 className="font-headline font-bold text-on-surface">{activeCitation.source_document}</h3>
                </div>
                <button
                  onClick={() => setActiveCitation(null)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              
              <div className="bg-surface border border-border-subtle rounded p-4 mb-4 font-mono text-sm text-on-surface-variant">
                "{activeCitation.snippet}"
              </div>
              
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 block mb-1">Relevance</span>
                <p className="text-sm font-body text-on-surface/90">
                  {activeCitation.relevance}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
