export type AnalysisDepth = 'SURFACE' | 'STANDARD' | 'DEEP'

export type TaskStatus =
  | 'created'
  | 'planning'
  | 'analyzing'
  | 'reviewing'
  | 'finalizing'
  | 'complete'
  | 'cancelled'
  | 'error'

export type AgentStatus = 'idle' | 'processing' | 'awaiting' | 'complete' | 'error'

export type MessageStatus = 'completed' | 'needs-review' | 'error'

export type VerdictType = 'approve' | 'caution' | 'reject'

export interface BandMessageOutput {
  data: Record<string, unknown>
  confidence: number
  reasoning: string
  api_used: string
}

export interface NextHandoff {
  agent: string
  reason: string
}

export interface BandMessage {
  owner: string
  task: string
  context: string
  action: string
  output: BandMessageOutput
  status: string
  next_handoff: NextHandoff | null
  metadata: Record<string, unknown>
}

export interface AgentState {
  agent_id: string
  name: string
  role: string
  status: AgentStatus
  last_action: string
  api_used: string
  confidence: number
  updated_at: string
}

export interface TaskState {
  task_id: string
  room_id: string
  company_name: string
  deal_context: string
  risk_tolerance: number
  analysis_depth: string
  status: TaskStatus
  current_agent: string | null
  cycle_count: number
  messages: BandMessage[]
  agents: AgentState[]
  created_at: string
  updated_at: string
}

export interface Vulnerability {
  description: string
  severity: string
  details?: string
}

export interface ReasoningStep {
  agent: string
  api: string
  confidence: number
  reasoning?: string
}

export interface Citation {
  id: string
  source_document: string
  snippet: string
  relevance: string
  confidence?: number
}

export interface VerdictData {
  risk_score: number
  verdict: VerdictType
  summary: string
  vulnerabilities: Vulnerability[]
  reasoning_chain: ReasoningStep[]
  citations?: Citation[]
  historical_context?: string
  future_path?: string
  competitive_alternatives?: string[]
  conditions?: string[]
}

export interface CreateRoomRequest {
  company_name: string
  deal_context: string
  risk_tolerance: number
  analysis_depth: AnalysisDepth
  persona?: string
  preferred_aiml_model?: string
  preferred_featherless_model?: string
  document_ids?: string[]
}

export interface CreateRoomResponse {
  room_id: string
  task_id: string
}

export interface SessionSummary {
  task_id: string
  room_id: string
  company_name: string
  status: TaskStatus
  risk_tolerance: number
  analysis_depth: string
  created_at: string
  updated_at: string
  message_count: number
  verdict?: VerdictType | null
  risk_score?: number | null
}

export interface ComparisonCriterion {
  criterion: string
  primary: string
  alternative: string
}

export interface ComparisonData {
  primary_company: string
  alternative_company: string
  primary_risk_score: number
  alternative_risk_score: number | null
  recommendation: string
  confidence: number
  method: string
  criteria: ComparisonCriterion[]
  rationale: string
  next_steps: string[]
}

export interface StateSnapshot {
  type: 'state_snapshot'
  task: TaskState
  agents: AgentState[]
  messages: BandMessage[]
  verdict: VerdictData | null
}

export interface AgentStatusChangedEvent {
  type: 'agent_status_changed'
  agent_id: string
  status: AgentStatus
  last_action: string
}

export interface BandMessageEvent {
  type: 'band_message'
  message: BandMessage
}

export interface VerdictReadyEvent {
  type: 'verdict_ready'
  verdict: VerdictData
}

export interface WsErrorEvent {
  type: 'error'
  message: string
  recoverable: boolean
}

export interface HumanInputRequiredEvent {
  type: 'human_input_required'
  message: string
}

export interface WorkflowStateEvent {
  type: 'workflow_cancelled' | 'workflow_retried'
  task: TaskState
}
