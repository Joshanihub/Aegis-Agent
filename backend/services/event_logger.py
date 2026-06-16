"""Append-only session event logger."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from models.schemas import EventLogEntry

logger = logging.getLogger(__name__)


class EventLogger:
    """In-memory append-only event log per task session."""

    def __init__(self, logs_dir: Path | None = None) -> None:
        self._logs: dict[str, list[EventLogEntry]] = {}
        self._logs_dir = logs_dir

    def log(
        self,
        task_id: str,
        agent_id: str,
        action: str,
        api_used: str,
        details: dict[str, Any] | None = None,
        duration_ms: int = 0,
    ) -> EventLogEntry:
        entry = EventLogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_id=agent_id,
            action=action,
            api_used=api_used,
            details=details or {},
            duration_ms=duration_ms,
        )
        self._logs.setdefault(task_id, []).append(entry)
        logger.info(
            "event task=%s agent=%s action=%s api=%s duration_ms=%d",
            task_id,
            agent_id,
            action,
            api_used,
            duration_ms,
        )
        return entry

    def get_events(self, task_id: str) -> list[EventLogEntry]:
        return list(self._logs.get(task_id, []))

    async def flush_to_file(self, task_id: str) -> None:
        if not self._logs_dir:
            return
        events = self._logs.get(task_id, [])
        if not events:
            return
        self._logs_dir.mkdir(parents=True, exist_ok=True)
        path = self._logs_dir / f"{task_id}.json"
        payload = [event.model_dump() for event in events]
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        logger.info("Flushed %d events to %s", len(events), path)

    def clear(self, task_id: str | None = None) -> None:
        if task_id:
            self._logs.pop(task_id, None)
        else:
            self._logs.clear()


event_logger = EventLogger()
