'use client'

import { useMemo, useEffect, useRef } from 'react'
import type { BandMessage } from '@/lib/types'
import GlassPanel from '@/components/ui/GlassPanel'
import MessageBlock from '@/components/war-room/MessageBlock'
import MonoLabel from '@/components/ui/MonoLabel'

export interface TerminalStreamProps {
  messages: BandMessage[]
}

export default function TerminalStream({ messages }: TerminalStreamProps) {
  const streamRef = useRef<HTMLDivElement>(null)

  const blurredMessagesCount = useMemo(() => {
    const last3 = 3
    if (messages.length <= last3) return 0
    return Math.max(0, messages.length - last3)
  }, [messages.length])

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight
    }
  }, [messages.length])

  return (
    <div className="glass-panel flex flex-col h-full max-h-[700px] overflow-hidden" aria-live="assertive">
      <div className="flex items-center justify-between p-6 shrink-0 border-b border-border-subtle/50 bg-surface-glass">
        <div>
          <h2 className="font-headline text-headline-md text-on-surface text-base font-semibold tracking-tight">
            AI Insights Stream
          </h2>
          <p className="text-xs text-on-surface-variant font-mono mt-1 tracking-widest uppercase">Live Activity Feed</p>
        </div>
        <div className="flex items-center gap-3">
          <MonoLabel className="text-on-surface-variant bg-surface-container px-3 py-1 rounded-md">
            {messages.length} events
          </MonoLabel>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-border-subtle border-dashed m-6 rounded-xl p-8 bg-surface-container/30">
          <MonoLabel className="animate-pulse-amber text-amber-agent">AWAITING PLANNER AGENT…</MonoLabel>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden flex flex-col p-6">
          <div className="absolute top-0 bottom-0 left-10 w-px bg-border-subtle" />
          <div className="absolute top-0 bottom-0 left-10 w-[2px] bg-gradient-to-b from-transparent via-accent-luminous to-transparent animate-trace-line opacity-60 -translate-x-[0.5px]" />
          
          <div ref={streamRef} className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4 scroll-smooth pb-8 relative z-10 custom-scrollbar">
            {messages.map((m, idx) => {
              const shouldBlur = idx < blurredMessagesCount
              return (
                <div key={`${m.metadata?.task_id ?? 'task'}-${m.metadata?.cycle ?? idx}-${m.action}-${idx}`} className="relative pl-16 group">
                  <div className="absolute left-[36px] top-5 w-2 h-2 rounded-full bg-accent-luminous shadow-glow-primary group-hover:scale-150 transition-transform duration-300" />
                  <MessageBlock 
                    m={m} 
                    isBlurred={shouldBlur} 
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
