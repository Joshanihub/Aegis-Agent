"""Band SDK wrapper — room lifecycle and messaging.

Payload shapes confirmed against the Band Agent API (/api/v1/agent):
  - create_room   → POST /agent/chats        body: {"chat": {"title": "..."}}
  - add_participant → POST /agent/chats/{id}/participants  body: {"participant": {"participant_id": "..."}}
  - send_message  → POST /agent/chats/{id}/messages  body: {"message": {"content": "...", "mentions": [{"participant_id": "..."}]}}
  - close_room    → DELETE /agent/chats/{id}  (no body required)
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from collections import defaultdict
from typing import AsyncIterator

import httpx

from config import AgentCredentials, get_settings, load_agent_credentials
from models.schemas import BandMessage
from services.event_logger import event_logger

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BACKOFF_BASE_SECONDS = 1.0


class BandConnectionError(Exception):
    """Raised when Band authentication fails."""


class BandRoomError(Exception):
    """Raised when Band room operations fail."""


class BandService:
    """Wraps Band REST API with retry logic and event logging.

    Payload contracts (verified against live Band API 2026-06):
    ──────────────────────────────────────────────────────────
    POST /api/v1/agent/chats
        Body:    {"chat": {"title": "<string>"}}
        Returns: {"data": {"id": "<uuid>", "title": "...", ...}}

    POST /api/v1/agent/chats/{room_id}/participants
        Body:    {"participant": {"participant_id": "<agent-uuid>"}}
        Returns: 200/201 on success

    POST /api/v1/agent/chats/{room_id}/messages
        Body:    {"message": {"content": "<string>", "mentions": [{"participant_id": "<uuid>"}]}}
                 mentions must have at least 1 entry (minItems: 1)
        Returns: 200/201 on success

    DELETE /api/v1/agent/chats/{room_id}
        Body:    (none)
        Returns: 200/204 on success, 404 if already gone (both treated as OK)
    """

    def __init__(
        self,
        credentials: dict[str, AgentCredentials] | None = None,
        mock_mode: bool | None = None,
    ) -> None:
        settings = get_settings()
        self._rest_url = settings.band_rest_url
        self._mock_mode = (
            settings.band_mock_mode if mock_mode is None else mock_mode
        )
        self._credentials = credentials or load_agent_credentials()
        self._planner = self._credentials["planner"]
        self._rooms: dict[str, dict] = {}
        self._participants: dict[str, list[str]] = defaultdict(list)
        self._message_queues: dict[str, list[BandMessage]] = defaultdict(list)

    # ──────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────

    def _auth_headers(self, role: str = "planner") -> dict[str, str]:
        creds = self._credentials.get(role, self._planner)
        return {
            "X-API-Key": creds.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _retry(self, operation: str, coro_factory) -> object:
        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            start = time.perf_counter()
            try:
                result = await coro_factory()
                duration_ms = int((time.perf_counter() - start) * 1000)
                event_logger.log(
                    task_id="band",
                    agent_id="band_service",
                    action="api_call",
                    api_used="Band",
                    details={"operation": operation, "attempt": attempt + 1},
                    duration_ms=duration_ms,
                )
                return result
            except httpx.HTTPStatusError as exc:
                last_error = exc
                status = exc.response.status_code
                body = exc.response.text[:300]
                logger.warning(
                    "Band %s attempt %d: HTTP %s — %s",
                    operation, attempt + 1, status, body,
                )
                if status in (401, 403):
                    raise BandConnectionError(
                        f"Band auth failed for {operation}: {status}"
                    ) from exc
                if status >= 500 and attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(BACKOFF_BASE_SECONDS * (2 ** attempt))
                    continue
                raise BandRoomError(
                    f"Band {operation} failed (HTTP {status}): {body}"
                ) from exc
            except (httpx.RequestError, ConnectionError) as exc:
                last_error = exc
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(BACKOFF_BASE_SECONDS * (2 ** attempt))
                    continue
                raise BandRoomError(
                    f"Band {operation} failed (network): {exc}"
                ) from exc

        raise BandRoomError(
            f"Band {operation} failed after {MAX_RETRIES} retries: {last_error}"
        )

    # ──────────────────────────────────────────────
    # Room lifecycle
    # ──────────────────────────────────────────────

    async def create_room(self, task_id: str) -> str:
        """Create a Band chat room and return its room_id."""
        if self._mock_mode:
            room_id = f"room-{uuid.uuid4().hex[:12]}"
            self._rooms[room_id] = {"task_id": task_id, "status": "active"}
            logger.info("Mock room created: %s for task %s", room_id, task_id)
            return room_id

        async def _create() -> str:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self._rest_url}/api/v1/agent/chats",
                    headers=self._auth_headers("planner"),
                    # Correct Band API payload: wrap inside "chat" key
                    json={"chat": {"title": f"Aegis Analysis — {task_id}"}},
                )
                response.raise_for_status()
                data = response.json()
                # Band returns: {"data": {"id": "<uuid>", ...}}
                room_id = (data.get("data") or {}).get("id")
                if not room_id:
                    raise BandRoomError(
                        f"Band create_room returned no room ID. Response: {data}"
                    )
                return str(room_id)

        try:
            return await self._retry("create_room", _create)
        except BandConnectionError:
            raise
        except BandRoomError as exc:
            raise BandRoomError(
                f"Failed to create room for task {task_id}"
            ) from exc

    async def add_participants(self, room_id: str, agent_ids: list[str]) -> None:
        """Add agents as participants in a Band chat room."""
        if self._mock_mode:
            self._participants[room_id] = list(agent_ids)
            logger.info(
                "Mock added %d participants to %s", len(agent_ids), room_id
            )
            return

        async def _add_all() -> None:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for agent_id in agent_ids:
                    response = await client.post(
                        f"{self._rest_url}/api/v1/agent/chats/{room_id}/participants",
                        headers=self._auth_headers("planner"),
                        # Correct Band API payload: wrap inside "participant" key
                        json={"participant": {"participant_id": agent_id}},
                    )
                    # 409 Conflict means already a participant — treat as OK
                    if response.status_code not in (200, 201, 409):
                        response.raise_for_status()
            self._participants[room_id] = list(agent_ids)

        await self._retry("add_participants", _add_all)

    async def send_message(
        self, room_id: str, sender_id: str, message: BandMessage
    ) -> None:
        """Send a BandMessage into a room, mentioning the next-handoff agent."""
        payload = message.model_dump()
        self._message_queues[room_id].append(message)

        if self._mock_mode:
            logger.info(
                "Mock message sent to %s from %s", room_id, sender_id
            )
            return

        # Build mention list: mention the next recipient if defined,
        # otherwise fall back to all room participants excluding the sender.
        # next_handoff is a Pydantic NextHandoff model (fields: agent, reason)
        next_agent_role = (
            message.next_handoff.agent.lstrip("@")
            if message.next_handoff
            else None
        )
        mention_ids: list[str] = []
        if next_agent_role and next_agent_role in self._credentials:
            mention_ids = [self._credentials[next_agent_role].agent_id]
        else:
            # Mention all participants except the sender (cannot_mention_self)
            mention_ids = [
                pid
                for pid in self._participants.get(room_id, [])
                if pid != sender_id
            ]

        # Band requires at least 1 mention and cannot_mention_self.
        # If empty (e.g. finalizer has no next agent), skip the Band message —
        # the verdict is already captured locally and broadcast via WebSocket.
        if not mention_ids:
            logger.info(
                "No mentionable peers for agent '%s' in room %s — skipping Band post",
                message.owner, room_id,
            )
            return

        # Band API requires mentions with "id" key
        mentions = [{"id": pid} for pid in mention_ids]
        content = json.dumps(payload)

        async def _send() -> None:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self._rest_url}/api/v1/agent/chats/{room_id}/messages",
                    headers=self._auth_headers(message.owner),
                    # Correct Band API payload: wrap in "message", supply "mentions"
                    json={"message": {"content": content, "mentions": mentions}},
                )
                response.raise_for_status()

        await self._retry("send_message", _send)
        event_logger.log(
            task_id=message.metadata.get("task_id", "unknown"),
            agent_id=message.owner,
            action="message_sent",
            api_used="Band",
            details={"room_id": room_id, "action": message.action},
        )

    async def listen_for_messages(
        self, room_id: str
    ) -> AsyncIterator[BandMessage]:
        """Yield queued messages for this room (used in mock mode)."""
        queue = self._message_queues.get(room_id, [])
        for message in queue:
            yield message

    async def get_participants(self, room_id: str) -> list[str]:
        """Return the list of participant IDs currently in a room."""
        if self._mock_mode:
            return list(self._participants.get(room_id, []))

        async def _get() -> list[str]:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self._rest_url}/api/v1/agent/chats/{room_id}/participants",
                    headers=self._auth_headers("planner"),
                )
                response.raise_for_status()
                data = response.json()
                # Band returns {"data": [{"participant_id": "..."}, ...]}
                items = (data.get("data") or data) if isinstance(data, dict) else data
                if isinstance(items, list):
                    return [
                        str(
                            p.get("participant_id")
                            or p.get("id")
                            or p
                        )
                        for p in items
                    ]
                return []

        return await self._retry("get_participants", _get)

    async def close_room(self, room_id: str) -> None:
        """Archive / close a Band chat room."""
        if self._mock_mode:
            if room_id in self._rooms:
                self._rooms[room_id]["status"] = "closed"
            logger.info("Mock room closed: %s", room_id)
            return

        async def _close() -> None:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Best-effort: Band's archive endpoint may not be available yet.
                # Treat any 4xx as "already done / not supported" — non-fatal.
                try:
                    response = await client.delete(
                        f"{self._rest_url}/api/v1/agent/chats/{room_id}",
                        headers=self._auth_headers("planner"),
                    )
                    if response.status_code < 400:
                        logger.info("Band room %s closed (HTTP %s)", room_id, response.status_code)
                    else:
                        logger.debug(
                            "Band close_room returned %s for %s — treating as non-fatal",
                            response.status_code, room_id,
                        )
                except httpx.RequestError as exc:
                    logger.warning("Band close_room network error (non-fatal): %s", exc)

        await self._retry("close_room", _close)
        event_logger.log(
            task_id="band",
            agent_id="band_service",
            action="room_closed",
            api_used="Band",
            details={"room_id": room_id},
        )

    # ──────────────────────────────────────────────
    # Utility
    # ──────────────────────────────────────────────

    def get_agent_ids(self) -> dict[str, str]:
        """Return a mapping of role → Band agent UUID."""
        return {
            role: creds.agent_id
            for role, creds in self._credentials.items()
        }
