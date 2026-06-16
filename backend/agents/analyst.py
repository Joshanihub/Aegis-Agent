"""Analyst agent wrapper — delegates to ai/ or uses stub."""

from __future__ import annotations

from typing import Any

from agents._ai_loader import try_import_ai_agent
from agents.base_agent import BaseAgent
from models.schemas import BandMessage

_AnalystAgent = try_import_ai_agent("ai.prompts.analyst_prompt", "AnalystAgent")


class AnalystAgentWrapper(BaseAgent):
    agent_id = "analyst"
    name = "THE MARKET ANALYST"
    role = "analyst"

    def __init__(self) -> None:
        self._brain = _AnalystAgent() if _AnalystAgent else None

    async def run(self, input_data: dict[str, Any]) -> BandMessage:
        if self._brain:
            result = await self._brain.run(input_data)
            if isinstance(result, dict):
                return BandMessage.model_validate(result)
            return result

        import asyncio
        await asyncio.sleep(3.0)

        cycle = input_data.get("cycle", 1)
        feedback = input_data.get("reviewer_feedback", "")
        context_note = f" Cycle {cycle}." if cycle > 1 else ""
        if feedback:
            context_note += f" Reviewer feedback incorporated: {feedback[:80]}"

        return self.build_message(
            task="Analyze investment subtasks and produce findings",
            context=context_note,
            action="Forensic analysis complete",
            output_data={
                "findings": [
                    {
                        "subtask_id": "1",
                        "finding": "Strong revenue growth with 45% YoY increase",
                        "supporting_evidence": "Public filings and market data",
                        "confidence_score": 82,
                        "risk_flag": False,
                        "risk_severity": "LOW",
                    },
                    {
                        "subtask_id": "2",
                        "finding": "Competitive pressure in EU markets increasing",
                        "supporting_evidence": "Market share analysis",
                        "confidence_score": 71,
                        "risk_flag": True,
                        "risk_severity": "MEDIUM",
                    },
                    {
                        "subtask_id": "3",
                        "finding": "Regulatory compliance gaps in data privacy",
                        "supporting_evidence": "GDPR audit findings",
                        "confidence_score": 68,
                        "risk_flag": True,
                        "risk_severity": "HIGH",
                    },
                ],
                "overall_confidence": 74,
                "data_gaps": ["Detailed EU market sizing"] if cycle == 1 else [],
                "recommendation_to_reviewer": "Proceed with caution on regulatory exposure",
            },
            status="completed",
            next_agent="@reviewer",
            api_used="Featherless AI",
            confidence=74,
            reasoning="Completed forensic analysis across all subtasks.",
            task_id=input_data.get("task_id", ""),
            room_id=input_data.get("room_id", ""),
            cycle=cycle,
            handoff_reason="Findings ready for adversarial review",
        )
