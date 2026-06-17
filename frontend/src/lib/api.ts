import type {
  AnalysisDepth,
  CreateRoomRequest,
  CreateRoomResponse,
  TaskState,
  VerdictData,
} from '@/lib/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/health`, { method: 'GET' })
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return (await res.json()) as { status: string }
}

function throwApiError(payload: unknown): never {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    'code' in payload
  ) {
    const p = payload as { error: string; code: string }
    throw new Error(`${p.code}: ${p.error}`)
  }
  throw new Error('Request failed')
}

export async function createRoom(
  body: CreateRoomRequest
): Promise<CreateRoomResponse> {
  const res = await fetch(`${BASE_URL}/api/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throwApiError(payload)
  return payload as CreateRoomResponse
}

export async function getTaskStatus(taskId: string): Promise<TaskState> {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(taskId)}/status`)
  const payload: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throwApiError(payload)
  return payload as TaskState
}

export async function getVerdict(taskId: string): Promise<VerdictData> {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(taskId)}/verdict`)
  const payload: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throwApiError(payload)
  return payload as VerdictData
}

export async function refineAnalysis(taskId: string, newCriteria: string): Promise<{ status: string, task_id: string }> {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(taskId)}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_criteria: newCriteria }),
  })
  const payload: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throwApiError(payload)
  return payload as { status: string, task_id: string }
}

export async function uploadFile(file: File): Promise<{ file_id: string; filename: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  const payload: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throwApiError(payload)
  return payload as { file_id: string; filename: string }
}

export type { AnalysisDepth }
