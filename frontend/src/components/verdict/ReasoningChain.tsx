'use client'

import { useState } from 'react'
import type { ReasoningStep } from '@/lib/types'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'

export interface ReasoningChainProps {
  chain: ReasoningStep[]
}

export default function ReasoningChain({ chain }: ReasoningChainProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <div className="glass-panel h-full flex flex-col relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-glass to-transparent opacity-50" />
      <div className="relative z-10 p-6 flex-1">
        <h3 className="font-headline text-sm font-semibold text-on-surface mb-6 flex items-center justify-between">
          <span>Verification Chain</span>
          <span className="w-2 h-2 rounded-full bg-emerald-agent animate-pulse" />
        </h3>
        <ol className="flex flex-col gap-6 relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-[1px] bg-border-subtle" />
          <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-transparent via-emerald-agent to-transparent animate-trace-line opacity-50 -translate-x-[0.5px]" />
          
          {chain.map((step, idx) => (
            <li 
              key={`${step.agent}-${idx}`} 
              className="relative pl-8 cursor-pointer group/item"
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
            >
              <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full bg-surface border-2 transition-all duration-300 ${expandedIndex === idx ? 'border-accent-luminous shadow-glow-primary scale-125' : 'border-primary group-hover/item:border-accent-luminous group-hover/item:scale-110'}`} />
              <div className="flex items-center justify-between gap-4 mb-1">
                <MonoLabel className={`font-semibold transition-colors ${expandedIndex === idx ? 'text-accent-luminous' : 'text-on-surface group-hover/item:text-on-surface'}`}>{step.agent}</MonoLabel>
              <MonoLabel className="text-primary">{step.confidence}% conf</MonoLabel>
            </div>
            <div className="text-xs text-on-surface-variant/80 font-mono flex justify-between items-center mt-2">
              <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px] uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
                {step.api}
              </span>
              {step.reasoning && (
                <span className="text-text-muted text-[10px] uppercase cursor-pointer hover:text-on-surface transition-colors">
                  {expandedIndex === idx ? 'Collapse' : 'View Audit Log'}
                </span>
              )}
            </div>
            {expandedIndex === idx && step.reasoning && (
              <div className="mt-3 p-3 rounded bg-surface-container border border-border-subtle text-xs text-on-surface-variant font-mono whitespace-pre-wrap">
                {step.reasoning}
              </div>
            )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
