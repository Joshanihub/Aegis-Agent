'use client'

import type { AgentState, BandMessage } from '@/lib/types'
import AgentCard from '@/components/war-room/AgentCard'
import { motion } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'
import { memo, useMemo } from 'react'

export interface AgentGridProps {
  agents: AgentState[]
  messages: BandMessage[]
}

const AgentGrid = memo(function AgentGrid({ agents, messages }: AgentGridProps) {
  // Derive active agent: prefer 'processing' status, then last message owner
  const activeAgentId = useMemo(() => {
    const processing = agents.find(a => a.status === 'processing')
    if (processing) return processing.agent_id
    // Sync with latest terminal message when no agent is flagged processing
    if (messages.length > 0) {
      const latestOwner = messages[messages.length - 1].owner
      if (agents.some(a => a.agent_id === latestOwner)) return latestOwner
    }
    return null
  }, [agents, messages])

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 border border-border-subtle border-dashed rounded-xl glass-panel">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent-luminous animate-spin mx-auto mb-4" />
          <MonoLabel className="text-on-surface-variant text-xs">Awaiting agents…</MonoLabel>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } }
      }}
    >
      {agents.map((agent) => (
        <motion.div
          key={agent.agent_id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <AgentCard
            agent={agent}
            isActive={activeAgentId === null ? agent.status !== 'idle' : activeAgentId === agent.agent_id}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})

export default AgentGrid
