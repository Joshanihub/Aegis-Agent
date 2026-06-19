import json
import logging
from typing import Any
from ai.clients.featherless_client import FeatherlessClient
from ai.evaluation.output_validator import validate_reviewer_output, extract_json_from_response
import re
from ai.scoring.risk_scorer import calculate_weighted_risk_index
from ai.clients.router import get_client_for_model

logger = logging.getLogger(__name__)

class ReviewerAgent:
    def __init__(self):
        pass

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        analyst_findings = input_data.get("findings", [])
        analyst_output = input_data.get("analyst_output", {})
        overall_confidence = input_data.get("overall_confidence", 80)
        data_gaps = input_data.get("data_gaps", [])
        recommendation = input_data.get("recommendation_to_reviewer", "")
        company_name = input_data.get("company_name", "Unknown target")
        deal_context = input_data.get("deal_context", "")
        risk_tolerance = input_data.get("risk_tolerance", 50)
        analysis_depth = input_data.get("analysis_depth", "STANDARD")
        task_id = input_data.get("task_id", "")
        room_id = input_data.get("room_id", "")
        cycle = input_data.get("cycle", 1)
        preferred_model = input_data.get("preferred_model", "gpt-4o")

        client, api_used, actual_model = get_client_for_model(preferred_model, "mistral-7b")

        prompt = (
            f"You are a risk-focused legal reviewer. Your job is to find flaws, gaps, and threats in the analyst's findings. "
            f"Do not be kind.\n\n"
            f"Company: {company_name}\n"
            f"Deal context:\n{deal_context}\n"
            f"Risk tolerance: {risk_tolerance}/100\n"
            f"Analysis depth: {analysis_depth}\n"
            f"Review cycle: {cycle}\n\n"
            f"Full Analyst Output:\n{json.dumps(analyst_output or input_data, indent=2)}\n\n"
            f"Analyst Findings:\n{json.dumps(analyst_findings, indent=2)}\n\n"
            f"Analyst confidence: {overall_confidence}/100\n"
            f"Analyst data gaps:\n{json.dumps(data_gaps, indent=2)}\n"
            f"Analyst recommendation:\n{recommendation}\n\n"
            f"Score this deal's risk from 0 to 100. 0 is perfectly safe. 100 is catastrophic. Be brutally honest.\n"
            f"Set approved=false only when the Analyst must perform another pass because material gaps or contradictions make the current findings unreliable. "
            f"Ordinary risks, cautionary issues, or tolerable data gaps should remain approved=true with critical_issues and a calibrated risk_score. "
            f"Human escalation is handled outside your JSON; do not reject merely to force human oversight.\n"
            f"Provide an 'internal_audit_log' as a concise 5-7 sentence audit summary describing the pressure tests applied, accepted risks, rejected assumptions, and any required rework. Do not reveal private chain-of-thought; write only decision-relevant rationale.\n\n"
            f"Example output:\n"
            f'{{\n'
            f'  "internal_audit_log": "[SYSTEM LOG] Initializing adversarial review protocol... [DONE]\\n\\n> Injecting synthetic market shock scenario into Analyst model. The baseline revenue projections provided by the analyst fail to account for a 20% contraction in consumer spending. I am flagging this as a critical oversight.\\n\\n> Probing deeper into the regulatory findings: The analyst noted compliance, but missed a pending legislative bill in the EU that directly impacts their core data harvesting model. This is unacceptable.\\n\\n> Forcing revision cycle on Subtask 1. The target must prove resilience against these twin vectors. Adjusting risk score to reflect the exposed vulnerabilities...",\n'
            f'  "risk_score": 58,\n'
            f'  "approved": true,\n'
            f'  "critical_issues": [\n'
            f'    {{\n'
            f'      "issue": "Regulatory gap",\n'
            f'      "severity": "HIGH",\n'
            f'      "affects_subtask": "1"\n'
            f'    }}\n'
            f'  ],\n'
            f'  "feedback_to_analyst": "",\n'
            f'  "justification": "Risks accepted"\n'
            f'}}\n\n'
            f"IMPORTANT: Respond ONLY with valid JSON. No prose. No markdown fences. "
            f"No explanation before or after the JSON object. Raw JSON only."
        )

        try:
            for attempt in range(3):
                response = await client.call_completion(prompt, model=actual_model)
                
                cleaned = extract_json_from_response(response)
                
                try:
                    data = json.loads(cleaned)
                    if validate_reviewer_output(data):
                        critical_issue_count = len(data.get("critical_issues", []))
                        data_gap_count = 0
                        final_risk = calculate_weighted_risk_index(
                            data["risk_score"], 
                            overall_confidence, 
                            critical_issue_count, 
                            data_gap_count
                        )
                        data["risk_score"] = final_risk
                        
                        approved = data.get("approved", True)
                        reasoning_log = data.get("internal_audit_log", data.get("justification", "Reviewed findings."))
                        
                        return {
                            "owner": "reviewer",
                            "task": "Adversarial review of analyst findings",
                            "context": f"Review cycle {cycle}",
                            "action": "Review approved with conditions" if approved else "Review rejected - data gaps identified",
                            "output": {
                                "data": data,
                                "confidence": 90,
                                "reasoning": reasoning_log,
                                "api_used": api_used
                            },
                            "status": "completed" if approved else "needs-review",
                            "next_handoff": {
                                "agent": "@finalizer" if approved else "@analyst",
                                "reason": "Analysis approved for final verdict" if approved else "Needs revision"
                            },
                            "metadata": {
                                "task_id": task_id,
                                "room_id": room_id,
                                "cycle": cycle
                            }
                        }
                    else:
                        logger.warning("Reviewer attempt %d: validation failed", attempt + 1)
                except json.JSONDecodeError as exc:
                    logger.warning("Reviewer attempt %d: JSON parse error: %s", attempt + 1, exc)
                    
            logger.error("Reviewer failed all 3 attempts. Raw:\n%s", response)
            return {
                "owner": "reviewer",
                "task": "Adversarial review of analyst findings",
                "context": "",
                "action": "Failed to parse JSON",
                "output": {
                    "data": {"raw": response},
                    "confidence": 0,
                    "reasoning": "Failed to parse AI response as JSON.",
                    "api_used": api_used
                },
                "status": "error",
                "next_handoff": None,
                "metadata": {"task_id": task_id, "room_id": room_id, "cycle": cycle}
            }
        except Exception as e:
            return {
                "owner": "reviewer",
                "task": "Adversarial review",
                "context": "",
                "action": "Agent execution failed",
                "output": {
                    "data": {"error": str(e)},
                    "confidence": 0,
                    "reasoning": f"Exception: {str(e)}",
                    "api_used": api_used
                },
                "status": "error",
                "next_handoff": None,
                "metadata": {"task_id": task_id, "room_id": room_id, "cycle": cycle}
            }
