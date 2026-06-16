'use client'

import type { AgentState } from '@/lib/types'
import AgentCard from '@/components/war-room/AgentCard'
import { motion } from 'framer-motion'
import MonoLabel from '@/components/ui/MonoLabel'

export interface AgentGridProps {
  agents: AgentState[]
}

export default function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 border border-border-subtle border-dashed rounded-xl glass-panel text-on-surface-variant">
        <MonoLabel>Awaiting agents…</MonoLabel>
      </div>
    )
  }

  const activeAgents = agents.filter(a => a.status === 'processing')
  const activeAgentId = activeAgents.length > 0 ? activeAgents[0].agent_id : null

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
    >
      {agents.map((agent) => (
        <motion.div
          key={agent.agent_id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <AgentCard 
            agent={agent} 
            isActive={activeAgentId ? activeAgentId === agent.agent_id : true} 
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
