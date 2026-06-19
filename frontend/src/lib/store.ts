import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentState, BandMessage, VerdictData, TaskState, TaskStatus } from '@/lib/types'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

type AegisIdentifiers = {
  roomId: string | null
  taskId: string | null
  recentSessions: { taskId: string; companyName: string; timestamp: string; status?: TaskStatus }[]
  preferredModel: string
}

type AegisSnapshot = {
  task: TaskState | null
  agents: AgentState[]
  messages: BandMessage[]
  verdict: VerdictData | null
}

type WsError = {
  message: string
  recoverable: boolean
} | null

type AegisStore = AegisIdentifiers & AegisSnapshot & {
  roomStatus: ConnectionStatus
  wsError: WsError
  humanInputRequired: string | null
  initializeFromSnapshot: (snapshot: Omit<AegisSnapshot, 'task'> & { task: TaskState }) => void
  applyBandMessage: (msg: BandMessage) => void
  applyAgentStatusChanged: (event: { agent_id: string; status: string; last_action?: string; api_used?: string }) => void
  setVerdict: (verdict: VerdictData | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setWsError: (err: { message: string; recoverable: boolean } | null) => void
  setHumanInputRequired: (msg: string | null) => void
  reset: () => void
  clearSessions: () => void
  setRoomIdentifiers: (roomId: string, taskId: string) => void
  setPreferredModel: (model: string) => void
}

const initialSnapshot: AegisSnapshot = {
  task: null,
  agents: [],
  messages: [],
  verdict: null,
}

export const useAegisStore = create<AegisStore>()(
  persist(
    (set) => ({
      roomId: null,
      taskId: null,
      recentSessions: [],
      preferredModel: 'auto',
      ...initialSnapshot,
      roomStatus: 'disconnected',
      wsError: null,
      humanInputRequired: null,

      setRoomIdentifiers: (roomId, taskId) =>
        set(() => ({
          roomId,
          taskId,
        })),

      initializeFromSnapshot: (snapshot) =>
        set((state) => {
          const taskName = snapshot.task?.company_name || 'Unknown Target'
          const taskId = snapshot.task?.task_id
          const taskStatus = snapshot.task?.status
          let newSessions = [...state.recentSessions]

          if (taskId) {
            const existing = newSessions.findIndex(s => s.taskId === taskId)
            const nextSession = {
              taskId,
              companyName: taskName,
              timestamp: new Date().toISOString(),
              status: taskStatus,
            }

            if (existing >= 0) {
              newSessions[existing] = {
                ...newSessions[existing],
                ...nextSession,
                timestamp: newSessions[existing].timestamp,
              }
            } else {
              newSessions.unshift(nextSession)
            }

            if (newSessions.length > 5) newSessions.pop()
          }

          return {
            ...snapshot,
            roomId: snapshot.task.room_id,
            taskId: snapshot.task.task_id,
            recentSessions: newSessions
          }
        }),

      applyBandMessage: (msg) =>
        set((state) => {
          // Deduplicate to fix strict mode duplicate renders
          const exists = state.messages.some(
            (m) => m.action === msg.action && m.metadata?.cycle === msg.metadata?.cycle && m.owner === msg.owner
          )
          if (exists) return state

          // Update agent confidence from band message
          const agents = state.agents.map((a) => {
            if (a.agent_id !== msg.owner) return a
            return {
              ...a,
              confidence: msg.output.confidence,
              api_used: msg.output.api_used || a.api_used,
            }
          })

          return {
            messages: [...state.messages, msg],
            agents,
          }
        }),

      applyAgentStatusChanged: (event) =>
        set((state) => {
          const agents = state.agents.map((a) => {
            if (a.agent_id !== event.agent_id) return a
            return {
              ...a,
              status: event.status as AgentState['status'],
              last_action: event.last_action ?? a.last_action,
              api_used: event.api_used ?? a.api_used,
              updated_at: a.updated_at,
            }
          })
          return { agents }
        }),

      setVerdict: (verdict) =>
        set((state) => ({
          verdict,
          task: state.task ? { ...state.task, status: verdict ? 'complete' : state.task.status } : state.task,
          recentSessions: state.task
            ? state.recentSessions.map((session) =>
                session.taskId === state.task?.task_id
                  ? { ...session, status: verdict ? 'complete' : session.status }
                  : session
              )
            : state.recentSessions,
        })),

      setConnectionStatus: (status) => set(() => ({ roomStatus: status })),
      setWsError: (err) => set(() => ({ wsError: err })),
      setHumanInputRequired: (msg) => set(() => ({ humanInputRequired: msg })),

      reset: () =>
        set((state) => ({
          roomId: null,
          taskId: null,
          ...initialSnapshot,
          roomStatus: 'disconnected',
          wsError: null,
          humanInputRequired: null,
        })),

      clearSessions: () =>
        set(() => ({ recentSessions: [] })),

      setPreferredModel: (model) =>
        set(() => ({ preferredModel: model })),
    }),
    {
      name: 'aegis-session-storage',
      partialize: (state) => ({
        roomId: state.roomId,
        taskId: state.taskId,
        recentSessions: state.recentSessions || [],
        preferredModel: state.preferredModel
      }),
    }
  )
)
