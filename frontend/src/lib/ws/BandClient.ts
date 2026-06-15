import type {
  AgentStatusChangedEvent,
  BandMessageEvent,
  StateSnapshot,
  WsErrorEvent,
  VerdictReadyEvent,
} from '@/lib/types'
import type { ConnectionStatus } from '@/lib/store'
interface Handlers {
  onSnapshot: (snapshot: StateSnapshot) => void
  onAgentStatusChanged: (event: AgentStatusChangedEvent) => void
  onBandMessage: (event: BandMessageEvent) => void
  onVerdictReady: (event: VerdictReadyEvent) => void
  onError: (event: WsErrorEvent) => void
  onConnectionStatusChange: (status: ConnectionStatus) => void
  onUserIntervention?: (guidance: string) => void
}

export class BandClient {
  private readonly taskId: string
  private readonly apiBaseUrl: string
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private connectionStatus: ConnectionStatus = 'disconnected'
  private readonly handlers: Handlers

  constructor(taskId: string, handlers: Handlers) {
    this.taskId = taskId
    this.handlers = handlers
    this.apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'
  }

  connect() {
    if (this.connectionStatus === 'connecting' || this.connectionStatus === 'connected') return
    this.setStatus('connecting')
    this.openWebSocket()
  }

  close() {
    this.setStatus('disconnected')
    this.reconnectAttempts = 0
    if (this.ws) this.ws.close()
    this.ws = null
  }

  private setStatus(status: ConnectionStatus) {
    this.connectionStatus = status
    this.handlers.onConnectionStatusChange(status)
  }

  private openWebSocket() {
    const wsBase = this.apiBaseUrl.replace(/^http/, 'ws')
    const url = `${wsBase}/ws/${encodeURIComponent(this.taskId)}`

    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      this.reconnectAttempts = 0
      this.setStatus('connected')
    }

    ws.onmessage = (e: MessageEvent<string>) => {
      const raw = e.data
      let payload: unknown
      try {
        payload = JSON.parse(raw)
      } catch {
        const err: WsErrorEvent = { type: 'error', message: 'Invalid JSON from server', recoverable: false }
        this.handlers.onError(err)
        return
      }

      if (!payload || typeof payload !== 'object' || !('type' in payload)) return
      const type = (payload as { type: string }).type

      if (type === 'state_snapshot') {
        this.handlers.onSnapshot(payload as StateSnapshot)
        return
      }
      if (type === 'agent_status_changed') {
        this.handlers.onAgentStatusChanged(payload as AgentStatusChangedEvent)
        return
      }
      if (type === 'band_message') {
        this.handlers.onBandMessage(payload as BandMessageEvent)
        return
      }
      if (type === 'verdict_ready') {
        this.handlers.onVerdictReady(payload as VerdictReadyEvent)
        return
      }
      if (type === 'error') {
        this.handlers.onError(payload as WsErrorEvent)
        return
      }
      if (type === 'user_intervention') {
        if (this.handlers.onUserIntervention) {
          this.handlers.onUserIntervention((payload as unknown as { guidance: string }).guidance)
        }
        return
      }
    }

    ws.onerror = () => {
      this.setStatus('error')
      const err: WsErrorEvent = { type: 'error', message: 'WebSocket error', recoverable: true }
      this.handlers.onError(err)
    }

    ws.onclose = () => {
      if (this.connectionStatus === 'disconnected') return
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.setStatus('error')
        return
      }
      this.setStatus('connecting')
      const attempt = this.reconnectAttempts
      this.reconnectAttempts += 1
      const delayMs = 1000 * Math.pow(2, attempt)
      window.setTimeout(() => {
        this.openWebSocket()
      }, delayMs)
    }
  }
}
