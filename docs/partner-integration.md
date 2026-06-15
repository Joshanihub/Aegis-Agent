# Partner Integration Guide

Welcome to the Aegis Agent partner integration documentation. This guide explains how external partners can integrate with our multi-agent workflow for automated investment analysis and risk assessment.

## Overview

Aegis Agent provides an asynchronous, WebSocket-based API that allows you to initialize analysis tasks and stream reasoning, messages, and verdicts back to your own systems in real time.

## 1. Authentication

Currently, all endpoints require a valid API key. Include this in the `Authorization` header:

```http
Authorization: Bearer YOUR_PARTNER_API_KEY
```

## 2. Initializing an Analysis Room

To begin a diligence process, you must create an analysis room (task).

**Endpoint**: `POST /api/rooms/create`
**Payload**:

```json
{
  "company_name": "Stark Industries",
  "deal_context": "Series C funding round diligence",
  "risk_tolerance": 50,
  "analysis_depth": "STANDARD"
}
```

**Response**:

```json
{
  "room_id": "room-uuid",
  "task_id": "task-uuid"
}
```

## 3. Streaming Events via WebSockets

Connect to our WebSocket endpoint to receive real-time events as the agents (Planner, Analyst, Reviewer, Finalizer) deliberate.

**URL**: `ws://<domain>/ws/{task_id}`

### Event Types
- `state_snapshot`: Initial state of the room.
- `band_message`: A new message from one of the agents.
- `agent_status_changed`: An agent transitions between processing, awaiting, or complete.
- `verdict_ready`: The finalizer has issued a verdict.

## 4. Retrieving the Final Verdict

If you prefer REST over WebSockets for the final output, you can poll for the verdict.

**Endpoint**: `GET /api/rooms/{task_id}/verdict`

Returns a `404` if the verdict is not yet ready. Once ready, it returns:

```json
{
  "risk_score": 45,
  "verdict": "approve",
  "summary": "...",
  "vulnerabilities": [...],
  "reasoning_chain": [...]
}
```

## Fallbacks & Rate Limits

If the primary AI models experience latency or downtime, the orchestrator automatically falls back to secondary models. Your WebSocket connection will receive an event notifying you of this switch, but no action is required on your end.

For custom volume limits or SLA guarantees, please refer to your partner agreement.
