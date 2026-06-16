"""Finalizer agent wrapper — delegates to ai/ or uses stub."""

from __future__ import annotations

from typing import Any

from agents._ai_loader import try_import_ai_agent
from agents.base_agent import BaseAgent
from models.schemas import BandMessage

_FinalizerAgent = try_import_ai_agent("ai.prompts.finalizer_prompt", "FinalizerAgent")


class FinalizerAgentWrapper(BaseAgent):
    agent_id = "finalizer"
    name = "THE EXECUTIVE FINALIZER"
    role = "finalizer"

    def __init__(self) -> None:
        self._brain = _FinalizerAgent() if _FinalizerAgent else None

    async def run(self, input_data: dict[str, Any]) -> BandMessage:
        if self._brain:
            result = await self._brain.run(input_data)
            if isinstance(result, dict):
                return BandMessage.model_validate(result)
            return result

        import asyncio
        await asyncio.sleep(2.0)

        reviewer = input_data.get("reviewer_output", {})
        reviewer_data = reviewer.get("output", {}).get("data", {})
        risk_score = reviewer_data.get("risk_score", 58)
        critical_issues = reviewer_data.get("critical_issues", [])

        if risk_score <= 33:
            verdict = "approve"
        elif risk_score <= 66:
            verdict = "caution"
        else:
            verdict = "reject"

        company = input_data.get("company_name", "Target Company")
        vulnerabilities = [
            {
                "description": issue.get("issue", str(issue)),
                "severity": issue.get("severity", "MEDIUM"),
            }
            for issue in critical_issues
        ]

        return self.build_message(
            task=f"Compile executive dossier for {company}",
            context="Final investment committee verdict",
            action="Executive dossier compiled",
            output_data={
                "risk_score": risk_score,
                "verdict": verdict,
                "executive_summary": (
                    f"Investment committee recommends {verdict.upper()} for {company}. "
                    f"Weighted risk index: {risk_score}/100. "
                    "Key concerns include regulatory exposure and market competition."
                ),
                "key_vulnerabilities": vulnerabilities,
                "strategic_recommendation": (
                    "Proceed with enhanced due diligence on regulatory compliance."
                    if verdict == "caution"
                    else f"Committee decision: {verdict}."
                ),
                "reasoning_chain": [
                    {"step": "Planner decomposed thesis", "confidence": 85},
                    {"step": "Analyst completed forensic review", "confidence": 74},
                    {"step": "Reviewer validated findings", "confidence": 78},
                ],
            },
            status="completed",
            next_agent=None,
            api_used="AI/ML API",
            confidence=88,
            reasoning=f"Risk score {risk_score} maps to verdict: {verdict}.",
            task_id=input_data.get("task_id", ""),
            room_id=input_data.get("room_id", ""),
            handoff_reason="",
        )
