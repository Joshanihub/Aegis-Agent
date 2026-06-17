"""In-memory task and WebSocket connection registry."""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Callable, Coroutine

from models.schemas import TaskState, VerdictData

logger = logging.getLogger(__name__)

SESSION_FILE = Path("data/sessions.json")

WsBroadcast = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]

_tasks: dict[str, TaskState] = {}
_verdicts: dict[str, VerdictData] = {}
_ws_connections: dict[str, list[Any]] = {}
_intervention_events: dict[str, asyncio.Event] = {}

def get_intervention_event(task_id: str) -> asyncio.Event:
    if task_id not in _intervention_events:
        _intervention_events[task_id] = asyncio.Event()
    return _intervention_events[task_id]


def save_state() -> None:
    try:
        SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "tasks": {k: v.model_dump(mode="json") for k, v in _tasks.items()},
            "verdicts": {k: v.model_dump(mode="json") for k, v in _verdicts.items()}
        }
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception as e:
        logger.error(f"Failed to save state: {e}")


def load_state() -> None:
    if not SESSION_FILE.exists():
        return
    try:
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        for k, v in data.get("tasks", {}).items():
            _tasks[k] = TaskState.model_validate(v)
        for k, v in data.get("verdicts", {}).items():
            _verdicts[k] = VerdictData.model_validate(v)
        logger.info(f"Loaded {len(_tasks)} tasks from {SESSION_FILE}")
    except Exception as e:
        logger.error(f"Failed to load state: {e}")

# Load initial state
load_state()


def register_task(task: TaskState) -> None:
    _tasks[task.task_id] = task
    _ws_connections.setdefault(task.task_id, [])
    save_state()


def get_task(task_id: str) -> TaskState | None:
    return _tasks.get(task_id)


def update_task(task: TaskState) -> None:
    _tasks[task.task_id] = task
    save_state()


def set_verdict(task_id: str, verdict: VerdictData | None) -> None:
    if verdict is None:
        _verdicts.pop(task_id, None)
    else:
        _verdicts[task_id] = verdict
    save_state()

def get_verdict(task_id: str) -> VerdictData | None:
    return _verdicts.get(task_id)


def add_ws_connection(task_id: str, websocket: Any) -> None:
    _ws_connections.setdefault(task_id, []).append(websocket)


def remove_ws_connection(task_id: str, websocket: Any) -> None:
    connections = _ws_connections.get(task_id, [])
    if websocket in connections:
        connections.remove(websocket)


def get_ws_connections(task_id: str) -> list[Any]:
    return _ws_connections.get(task_id, [])


def clear_all() -> None:
    """Reset registry — used in tests."""
    _tasks.clear()
    _verdicts.clear()
    _ws_connections.clear()
