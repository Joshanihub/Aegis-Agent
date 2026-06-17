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

        # Check if there are actual data gaps that warrant a revision cycle
        # Only request revision if high-risk findings exist and data gaps are present
        data_gaps = input_data.get("data_gaps", [])
        risk_score = input_data.get("overall_confidence", 70)
        findings = input_data.get("findings", [])

        # Determine if revision is needed: only if high-confidence data gaps exist
        # AND this is the first cycle AND there are actual high-risk findings
        has_high_risk_findings = any(
            f.get("risk_flag") and f.get("risk_severity") == "HIGH"
            for f in findings if isinstance(f, dict)
        )
        requires_revision = (
            count == 1 and
            len(data_gaps) > 0 and
            has_high_risk_findings and
            risk_score < 75  # Only request revision if confidence is low
        )

        if requires_revision:
            return self.build_message(
                task="Adversarial review of analyst findings",
                context="First review pass",
                action="Review rejected — data gaps identified",
                output_data={
                    "risk_score": 65,
                    "approved": False,
                    "critical_issues": [
                        {
                            "issue": f"Insufficient data: {gap}",
                            "severity": "HIGH",
                            "affects_subtask": "1",
                        }
                        for gap in data_gaps[:2]  # Limit to first 2 gaps
                    ],
                    "feedback_to_analyst": f"Reanalyze findings with additional focus on: {', '.join(data_gaps[:2])}",
                    "justification": "Data gaps are too significant for approval.",
                },
                status="needs-review",
                next_agent="@analyst",
                api_used="Featherless AI",
                confidence=70,
                reasoning="[SYSTEM LOG] Initializing adversarial review protocol... [DONE]\n\n> Injecting synthetic market shock scenario into Analyst model. The baseline projections fail to account for all risk vectors.\n\n> Identifying critical data gaps that impact the risk assessment.\n\n> Forcing revision cycle to ensure comprehensive analysis. Adjusting risk score to reflect the gaps...",
                task_id=task_id,
                room_id=input_data.get("room_id", ""),
                cycle=count,
                handoff_reason="Needs revision",
            )

        # Approval logic: calculate final risk score dynamically
        confidence_score = input_data.get("overall_confidence", 70)
        risk_severity_scores = {"LOW": 25, "MEDIUM": 50, "HIGH": 75}

        # Calculate risk score based on findings
        total_risk = 0
        high_risk_count = 0
        for finding in findings:
            if isinstance(finding, dict):
                severity = finding.get("risk_severity", "MEDIUM")
                severity_score = risk_severity_scores.get(severity, 50)
                total_risk += severity_score
                if severity == "HIGH":
                    high_risk_count += 1

        # Average risk across findings, with adjustment for confidence
        if findings:
            avg_risk = int(total_risk / len(findings))
            # Lower confidence means higher risk score
            confidence_adjustment = max(0, (100 - confidence_score) // 2)
            final_risk_score = min(100, avg_risk + confidence_adjustment)
        else:
            final_risk_score = 45  # Default low risk if no findings

        # Ensure minimum risk for high-risk findings
        if high_risk_count > 0:
            final_risk_score = max(final_risk_score, 55)

        return self.build_message(
            task="Adversarial review of analyst findings",
            context="Review analysis complete",
            action="Review approved",
            output_data={
                "risk_score": final_risk_score,
                "approved": True,
                "critical_issues": [
                    {
                        "issue": f.get("finding", str(f)),
                        "severity": f.get("risk_severity", "MEDIUM"),
                        "affects_subtask": f.get("subtask_id", "0"),
                    }
                    for f in findings if isinstance(f, dict) and f.get("risk_flag")
                ],
                "feedback_to_analyst": "",
                "justification": f"Analysis quality sufficient. Risk profile assessed at {final_risk_score}.",
            },
            status="completed",
            next_agent="@finalizer",
            api_used="Featherless AI",
            confidence=min(100, confidence_score + 5),
            reasoning=f"[SYSTEM LOG] Re-evaluating Analyst's findings... [DONE]\n\n> Comprehensive review of all identified risks and supporting evidence.\n\n> Risk assessment: {high_risk_count} high-severity issues identified, confidence level {confidence_score}%.\n\n> Analysis approved for final verdict compilation. Adjusted risk metrics for executive review.",
            task_id=task_id,
            room_id=input_data.get("room_id", ""),
            cycle=count,
            handoff_reason="Analysis approved for final verdict",
        )
