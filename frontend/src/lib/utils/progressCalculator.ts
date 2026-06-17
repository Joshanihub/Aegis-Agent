import type { AgentState } from '@/lib/types'

export interface ProgressMetrics {
  percentage: number
  activeAgent: string | null
  completedAgents: number
  totalAgents: number
  status: 'idle' | 'processing' | 'completing' | 'complete'
}

export function calculateWorkflowProgress(agents: AgentState[]): ProgressMetrics {
  // Expected agent order for progress calculation
  const agentOrder = ['planner', 'analyst', 'reviewer', 'finalizer']
  const totalAgents = agentOrder.length // Always 4 agents
  const agentStatusMap = new Map(agents.map(a => [a.agent_id, a.status]))

  let completedAgents = 0
  let processingAgent: string | null = null
  let status: 'idle' | 'processing' | 'completing' | 'complete' = 'idle'

  // Count completed agents and find processing agent
  for (const agentId of agentOrder) {
    const agentStatus = agentStatusMap.get(agentId)
    if (agentStatus === 'complete') {
      completedAgents++
    } else if (agentStatus === 'processing') {
      processingAgent = agentId
    }
  }

  // Calculate percentage based on completion
  let percentage = 0

  if (completedAgents === 0 && processingAgent === null) {
    percentage = 0
    status = 'idle'
  } else if (completedAgents === totalAgents) {
    percentage = 100
    status = 'complete'
  } else if (processingAgent) {
    // Agent order: planner (0), analyst (1), reviewer (2), finalizer (3)
    const agentIndex = agentOrder.indexOf(processingAgent)
    // Base progress: 25% per completed agent + current agent progress
    const baseProgress = (completedAgents / totalAgents) * 100
    const agentProgress = ((agentIndex + 1) / totalAgents) * 100
    // Current agent is between 10-90% complete
    percentage = baseProgress + (agentProgress - baseProgress) * 0.5
    status = 'processing'
  } else if (completedAgents === totalAgents - 1) {
    // Last agent is about to be called
    percentage = 95
    status = 'completing'
  } else {
    // Intermediate agents
    percentage = (completedAgents / totalAgents) * 100
    status = 'processing'
  }

  return {
    percentage: Math.round(percentage),
    activeAgent: processingAgent,
    completedAgents,
    totalAgents,
    status,
  }
}
