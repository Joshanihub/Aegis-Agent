'use client'

import { motion } from 'framer-motion'

export interface AegisTopBarProps {
  title?: string
  subtitle?: string
  status?: 'idle' | 'connecting' | 'live' | 'complete' | 'error'
  taskId?: string
  rightActions?: React.ReactNode
}

const statusConfig = {
  idle: { dot: 'bg-on-surface-variant', label: 'IDLE', color: 'text-on-surface-variant' },
  connecting: { dot: 'bg-amber-agent animate-pulse', label: 'CONNECTING', color: 'text-amber-agent' },
  live: { dot: 'bg-emerald-agent animate-pulse', label: 'LIVE', color: 'text-emerald-agent' },
  complete: { dot: 'bg-primary-container', label: 'COMPLETE', color: 'text-primary' },
  error: { dot: 'bg-crimson-reject', label: 'ERROR', color: 'text-crimson-reject' },
}

export default function AegisTopBar({ title, subtitle, status = 'idle', taskId, rightActions }: AegisTopBarProps) {
  const cfg = statusConfig[status]

  return (
    <header className="hidden md:flex justify-between items-center px-8 h-14 bg-surface-glass backdrop-blur-lg fixed top-0 right-0 w-[calc(100%-280px)] border-b border-border-subtle z-40">
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h2 className="font-headline text-sm font-semibold text-on-surface tracking-tight leading-none">{title}</h2>
            {subtitle && (
              <p className="font-mono text-[10px] text-on-surface-variant mt-0.5 tracking-[0.05em]">{subtitle}</p>
            )}
          </div>
        )}
        {taskId && (
          <>
            <div className="w-px h-4 bg-border-subtle" />
            <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-border-subtle">{taskId}</span>
          </>
        )}
      </div>

      {/* Center/Right nav tabs (optional) */}
      <div className="flex items-center gap-6">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-border-subtle">
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`font-mono text-[10px] tracking-[0.1em] ${cfg.color}`}>{cfg.label}</span>
        </div>

        {/* Notification bell */}
        <button className="text-on-surface-variant hover:text-primary transition-colors relative p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Profile avatar */}
        <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-border-subtle flex items-center justify-center overflow-hidden">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        {rightActions}
      </div>
    </header>
  )
}
