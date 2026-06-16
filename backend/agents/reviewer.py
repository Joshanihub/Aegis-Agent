"""Reviewer agent wrapper — delegates to ai/ or uses stub."""

from __future__ import annotations

from typing import Any

from agents._ai_loader import try_import_ai_agent
from agents.base_agent import BaseAgent
from models.schemas import BandMessage

_ReviewerAgent = try_import_ai_agent("ai.prompts.reviewer_prompt", "ReviewerAgent")

_review_cycle_counts: dict[str, int] = {}


class ReviewerAgentWrapper(BaseAgent):
    agent_id = "reviewer"
    name = "THE RISK AUDITOR"
    role = "reviewer"

    def __init__(self) -> None:
        self._brain = _ReviewerAgent() if _ReviewerAgent else None

    async def run(self, input_data: dict[str, Any]) -> BandMessage:
        if self._brain:
            result = await self._brain.run(input_data)
            if isinstance(result, dict):
                return BandMessage.model_validate(result)
            return result

        import asyncio
        await asyncio.sleep(2.0)

        task_id = input_data.get("task_id", "default")
        count = _review_cycle_counts.get(task_id, 0) + 1
        _review_cycle_counts[task_id] = count

        if count == 1:
            return self.build_message(
                task="Adversarial review of analyst findings",
                context="First review pass",
                action="Review rejected — data gaps identified",
                output_data={
                    "risk_score": 65,
                    "approved": False,
                    "critical_issues": [
                        {
                            "issue": "Insufficient EU market data",
                            "severity": "HIGH",
                            "affects_subtask": "2",
                        }
                    ],
                    "feedback_to_analyst": "Reanalyze market sizing with EU data included.",
                    "justification": "Data gaps are too significant for approval.",
                },
                status="needs-review",
                next_agent="@analyst",
                api_used="Featherless AI",
                confidence=70,
                reasoning="Critical data gaps require second analyst pass.",
                task_id=task_id,
                room_id=input_data.get("room_id", ""),
                cycle=count,
                handoff_reason="Needs revision",
            )

        return self.build_message(
            task="Adversarial review of analyst findings",
            context="Second review pass",
            action="Review approved with conditions",
            output_data={
                "risk_score": 58,
                "approved": True,
                "critical_issues": [
                    {
                        "issue": "Regulatory compliance gaps in data privacy",
                        "severity": "HIGH",
                        "affects_subtask": "3",
                    }
                ],
                "feedback_to_analyst": "",
                "justification": "Remaining risks are within acceptable tolerance.",
            },
            status="completed",
            next_agent="@finalizer",
            api_used="Featherless AI",
            confidence=78,
            reasoning="Second pass resolved data gaps; residual regulatory risk noted.",
            task_id=task_id,
            room_id=input_data.get("room_id", ""),
            cycle=count,
            handoff_reason="Analysis approved for final verdict",
        )
