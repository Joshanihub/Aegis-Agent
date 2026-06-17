'use client'

import { useEffect, useRef, memo } from 'react'
import type { BandMessage } from '@/lib/types'
import GlassPanel from '@/components/ui/GlassPanel'
import MessageBlock from '@/components/war-room/MessageBlock'
import MonoLabel from '@/components/ui/MonoLabel'

export interface TerminalStreamProps {
  messages: BandMessage[]
  activeOwner?: string | null
}

const TerminalStream = memo(function TerminalStream({ messages, activeOwner }: TerminalStreamProps) {
  const streamRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever a new message arrives
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [messages.length])

  const agentColors: Record<string, string> = {
    planner: 'bg-cyan-agent',
    analyst: 'bg-indigo-init',
    reviewer: 'bg-rose-agent',
    finalizer: 'bg-emerald-agent',
  }

  return (
    <div className="glass-panel flex flex-col h-full max-h-[720px] overflow-hidden" aria-live="assertive">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border-subtle/50 bg-surface-glass">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-agent/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-agent/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-agent/50" />
          </div>
          <h2 className="font-mono text-xs text-on-surface-variant tracking-widest uppercase">AEGIS INTELLIGENCE STREAM</h2>
        </div>
        <div className="flex items-center gap-3">
          {activeOwner && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border-subtle/50 bg-surface-container">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${agentColors[activeOwner] ?? 'bg-accent-luminous'}`} />
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{activeOwner} active</span>
            </div>
          )}
          <MonoLabel className="text-on-surface-variant/60 text-[10px]">
            {messages.length} {messages.length === 1 ? 'event' : 'events'}
          </MonoLabel>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-border-subtle border-dashed m-6 rounded-xl p-8 bg-surface-container/20">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent-luminous animate-spin mx-auto mb-4" />
            <MonoLabel className="animate-pulse text-amber-agent text-xs tracking-widest">AWAITING PLANNER AGENT…</MonoLabel>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden flex flex-col px-6 pt-4">
          {/* Timeline spine */}
          <div className="absolute top-4 bottom-0 left-[46px] w-px bg-border-subtle/50" />
          <div className="absolute top-4 bottom-0 left-[46px] w-[2px] bg-gradient-to-b from-transparent via-accent-luminous to-transparent animate-trace-line opacity-40 -translate-x-[0.5px]" />

          <div
            ref={streamRef}
            className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 pb-8 relative z-10 custom-scrollbar"
          >
            {messages.map((m, idx) => {
              const isLatest = idx === messages.length - 1
              return (
                <div
                  key={`${m.owner}-${m.action}-${idx}`}
                  className="relative pl-14 group"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-[38px] top-5 w-2 h-2 rounded-full transition-all duration-300 ${
                    isLatest
                      ? `${agentColors[m.owner] ?? 'bg-accent-luminous'} shadow-glow-primary scale-125`
                      : 'bg-border-subtle group-hover:bg-accent-luminous/60'
                  }`} />
                  <MessageBlock m={m} isLatest={isLatest} index={idx} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

export default TerminalStream
