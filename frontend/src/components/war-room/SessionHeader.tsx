'use client'

import type { ConnectionStatus } from '@/lib/store'
import MonoLabel from '@/components/ui/MonoLabel'
import GlassPanel from '@/components/ui/GlassPanel'
import { motion, AnimatePresence } from 'framer-motion'

export interface SessionHeaderProps {
  taskId: string
  roomStatus: ConnectionStatus
  wsError: { message: string; recoverable: boolean } | null
}

export default function SessionHeader({ taskId, roomStatus, wsError }: SessionHeaderProps) {
  const isReconnecting = roomStatus === 'connecting'

  const statusColor =
    roomStatus === 'connected'
      ? 'text-emerald-agent'
      : roomStatus === 'connecting'
        ? 'text-amber-agent'
        : roomStatus === 'error'
          ? 'text-crimson-reject'
          : 'text-on-surface-variant'

  const dotColor =
    roomStatus === 'connected'
      ? 'bg-emerald-agent'
      : roomStatus === 'connecting'
        ? 'bg-amber-agent'
        : roomStatus === 'error'
          ? 'bg-crimson-reject'
          : 'bg-on-surface-variant'

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="font-headline text-headline-lg font-bold text-primary tracking-tight">
          War Room
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant flex items-center gap-2">
          Live workflow visualization <span className="text-border-subtle">|</span>{' '}
          <MonoLabel>{taskId}</MonoLabel>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* RECONNECTING badge — shown while connecting after initial connect */}
        <AnimatePresence>
          {isReconnecting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-1 rounded-full border border-amber-agent/30 bg-amber-agent/10 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-agent animate-pulse" />
              <MonoLabel className="text-amber-agent text-[10px]">RECONNECTING…</MonoLabel>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <GlassPanel
            key={roomStatus}
            className="px-4 py-2 !p-3 flex flex-col gap-1 min-w-[200px]"
            delay={0}
          >
            <div className="flex items-center justify-between gap-4">
              <MonoLabel className="text-on-surface-variant">Status</MonoLabel>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${dotColor}`} />
                <MonoLabel className={statusColor}>{roomStatus}</MonoLabel>
              </div>
            </div>
            {wsError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-crimson-reject mt-1 font-mono"
              >
                {wsError.message}
              </motion.p>
            )}
          </GlassPanel>
        </AnimatePresence>
      </div>
    </header>
  )
}
