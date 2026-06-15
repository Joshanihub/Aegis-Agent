# Aegis Agent — API Contract

Version: 1.0.0  
Base URL: `http://localhost:8000` (local)  
WebSocket URL: `ws://localhost:8000`

This document defines the REST and WebSocket interface between the Aegis backend and frontend.

---

## REST Endpoints

### Health Check

```
GET /health
```

**Response 200:**
```json
{ "status": "ok" }
```

---

### Create Room

```
POST /api/rooms/create
Content-Type: application/json
```

**Request body:**
```json
{
  "company_name": "Stripe",
  "deal_context": "Series B, $200M valuation, VC investment",
  "risk_tolerance": 60,
  "analysis_depth": "STANDARD"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `company_name` | string | yes | min 2 chars |
| `deal_context` | string | yes | min 10 chars |
| `risk_tolerance` | integer | yes | 0–100 |
| `analysis_depth` | string | yes | `SURFACE` \| `STANDARD` \| `DEEP` |

**Response 200:**
```json
{
  "room_id": "room-abc123",
  "task_id": "task-abc123"
}
```

**Response 422:** Validation error (see Error Format)

---

### Get Task Status

```
GET /api/rooms/{task_id}/status
```

**Response 200:** Full `TaskState` object (see TaskState schema)

**Response 404:**
```json
{ "error": "Task not found", "code": "TASK_NOT_FOUND" }
```

---

### Get Verdict

```
GET /api/rooms/{task_id}/verdict
```

**Response 200:** `VerdictData` object (see VerdictData schema)

**Response 404:**
```json
{ "error": "Verdict not ready", "code": "VERDICT_NOT_READY" }
```

---

### Get Event Log

```
GET /api/rooms/{task_id}/events
```

**Response 200:**
```json
{
  "task_id": "task-abc123",
  "events": [
    {
      "timestamp": "2026-06-14T10:00:00Z",
      "agent_id": "planner",
      "action": "api_call",
      "api_used": "AI/ML API",
      "details": { "model": "gpt-4o-mini" },
      "duration_ms": 1234
    }
  ]
}
```

---

## WebSocket

### Connect

```
WS /ws/{task_id}
```

**On connect:** Server sends a state snapshot:
```json
{
  "type": "state_snapshot",
  "task": { /* TaskState */ },
  "agents": [ /* AgentState[] */ ],
  "messages": [ /* BandMessage[] */ ],
  "verdict": null
}
```

### Event Types

All events include `"type"` as discriminant.

#### `agent_status_changed`

```json
{
  "type": "agent_status_changed",
  "agent_id": "planner",
  "status": "processing",
  "last_action": "Decomposing investment thesis"
}
```

#### `band_message`

```json
{
  "type": "band_message",
  "message": { /* BandMessage */ }
}
```

#### `verdict_ready`

```json
{
  "type": "verdict_ready",
  "verdict": { /* VerdictData */ }
}
```

#### `error`

```json
{
  "type": "error",
  "message": "Agent planner failed after retry",
  "recoverable": false
}
```

---

## Schemas

### TaskStatus (enum)

| Value | Description |
|-------|-------------|
| `created` | Task created, workflow not started |
| `planning` | Planner agent running |
| `analyzing` | Analyst agent running |
| `reviewing` | Reviewer agent running |
| `finalizing` | Finalizer agent running |
| `complete` | Workflow finished |
| `error` | Fatal error |

### AgentStatus (enum)

| Value | Description |
|-------|-------------|
| `idle` | Not yet active |
| `processing` | Currently running |
| `awaiting` | Waiting for handoff |
| `complete` | Finished its step |
| `error` | Failed |

### BandMessageOutput

```json
{
  "data": {},
  "confidence": 85,
  "reasoning": "Analysis complete based on available data.",
  "api_used": "AI/ML API"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `data` | object | Agent-specific output |
| `confidence` | integer | 0–100 |
| `reasoning` | string | |
| `api_used` | string | `"AI/ML API"` or `"Featherless AI"` |

### BandMessage

```json
{
  "owner": "planner",
  "task": "Decompose investment analysis",
  "context": "Stripe Series B deal",
  "action": "Subtask decomposition complete",
  "output": { /* BandMessageOutput */ },
  "status": "completed",
  "next_handoff": {
    "agent": "@analyst",
    "reason": "Subtasks ready for analysis"
  },
  "metadata": {
    "task_id": "task-abc123",
    "room_id": "room-abc123",
    "timestamp": "2026-06-14T10:00:00Z",
    "cycle": 1
  }
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `owner` | string | `planner` \| `analyst` \| `reviewer` \| `finalizer` |
| `task` | string | |
| `context` | string | |
| `action` | string | |
| `output` | BandMessageOutput | |
| `status` | string | `completed` \| `needs-review` \| `error` |
| `next_handoff` | object \| null | `{ "agent": string, "reason": string }` |
| `metadata` | object | Must include `task_id`, `room_id`, `timestamp`, `cycle` |

### AgentState

```json
{
  "agent_id": "planner",
  "name": "THE FORENSIC AUDITOR",
  "role": "planner",
  "status": "processing",
  "last_action": "Decomposing investment thesis",
  "api_used": "AI/ML API",
  "confidence": 0,
  "updated_at": "2026-06-14T10:00:00Z"
}
```

### TaskState

```json
{
  "task_id": "task-abc123",
  "room_id": "room-abc123",
  "company_name": "Stripe",
  "deal_context": "Series B investment",
  "risk_tolerance": 60,
  "analysis_depth": "STANDARD",
  "status": "planning",
  "current_agent": "planner",
  "cycle_count": 0,
  "messages": [],
  "agents": [],
  "created_at": "2026-06-14T10:00:00Z",
  "updated_at": "2026-06-14T10:00:00Z"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `cycle_count` | integer | Reviewer loop counter; max 2 |

### VerdictData

```json
{
  "risk_score": 72,
  "verdict": "reject",
  "summary": "High regulatory and market risk identified.",
  "vulnerabilities": [
    { "description": "EU regulatory exposure", "severity": "HIGH" }
  ],
  "reasoning_chain": [
    { "agent": "planner", "api": "AI/ML API", "confidence": 88 }
  ]
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `risk_score` | integer | 0–100 |
| `verdict` | string | `approve` \| `caution` \| `reject` |
| `summary` | string | Executive summary |
| `vulnerabilities` | array | `{ description, severity }` |
| `reasoning_chain` | array | `{ agent, api, confidence }` |

---

## Error Response Format

All error responses use:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| HTTP Status | Code | When |
|-------------|------|------|
| 404 | `TASK_NOT_FOUND` | Unknown task_id |
| 404 | `VERDICT_NOT_READY` | Workflow not complete |
| 422 | `VALIDATION_ERROR` | Invalid request body |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## CORS

During hackathon: `allow_origins=["*"]`  
Production TODO: restrict to frontend domain.
