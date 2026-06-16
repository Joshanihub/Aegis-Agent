"""Abstract base class for agent wrappers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

from models.schemas import BandMessage, BandMessageOutput, NextHandoff


class BaseAgent(ABC):
    agent_id: str
    name: str
    role: str

    @abstractmethod
    async def run(self, input_data: dict[str, Any]) -> BandMessage:
        """Execute agent logic and return a structured BandMessage."""

    def build_message(
        self,
        task: str,
        context: str,
        action: str,
        output_data: dict[str, Any],
        status: str,
        next_agent: str | None,
        api_used: str,
        confidence: int,
        reasoning: str,
        task_id: str = "",
        room_id: str = "",
        cycle: int = 1,
        handoff_reason: str = "",
    ) -> BandMessage:
        next_handoff = None
        if next_agent:
            next_handoff = NextHandoff(agent=next_agent, reason=handoff_reason)

        return BandMessage(
            owner=self.role,
            task=task,
            context=context,
            action=action,
            output=BandMessageOutput(
                data=output_data,
                confidence=max(0, min(100, confidence)),
                reasoning=reasoning,
                api_used=api_used,
            ),
            status=status,
            next_handoff=next_handoff,
            metadata={
                "task_id": task_id,
                "room_id": room_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "cycle": cycle,
            },
        )
