"""Task and WebSocket room management."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from models.schemas import (
    AgentState,
    AgentStatus,
    TaskInput,
    TaskState,
    TaskStatus,
)
from models import state as task_registry

logger = logging.getLogger(__name__)

AGENT_DEFINITIONS: list[dict[str, str]] = [
    {
        "agent_id": "planner",
        "name": "THE FORENSIC AUDITOR",
        "role": "planner",
    },
    {
        "agent_id": "analyst",
        "name": "THE MARKET ANALYST",
        "role": "analyst",
    },
    {
        "agent_id": "reviewer",
        "name": "THE RISK AUDITOR",
        "role": "reviewer",
    },
    {
        "agent_id": "finalizer",
        "name": "THE EXECUTIVE FINALIZER",
        "role": "finalizer",
    },
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _build_agent_states() -> list[AgentState]:
    now = _now()
    return [
        AgentState(
            agent_id=defn["agent_id"],
            name=defn["name"],
            role=defn["role"],
            status=AgentStatus.IDLE,
            updated_at=now,
        )
        for defn in AGENT_DEFINITIONS
    ]


def create_task(task_input: TaskInput, room_id: str | None = None) -> TaskState:
    task_id = f"task-{uuid.uuid4().hex[:12]}"
    assigned_room = room_id or f"room-{uuid.uuid4().hex[:12]}"
    now = _now()

    task = TaskState(
        task_id=task_id,
        room_id=assigned_room,
        company_name=task_input.company_name,
        deal_context=task_input.deal_context,
        risk_tolerance=task_input.risk_tolerance,
        analysis_depth=task_input.analysis_depth.value,
        preferred_model=task_input.preferred_model,
        status=TaskStatus.CREATED,
        cycle_count=0,
        messages=[],
        agents=_build_agent_states(),
        created_at=now,
        updated_at=now,
    )
    task_registry.register_task(task)
    logger.info("Created task %s with room %s", task_id, assigned_room)
    return task


async def broadcast_to_task(task_id: str, event: dict[str, Any]) -> None:
    connections = task_registry.get_ws_connections(task_id)
    dead: list[Any] = []
    for ws in connections:
        try:
            await ws.send_json(event)
        except Exception as exc:
            logger.warning("WebSocket send failed for task %s: %s", task_id, exc)
            dead.append(ws)
    for ws in dead:
        task_registry.remove_ws_connection(task_id, ws)
