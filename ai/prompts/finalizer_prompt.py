import json
import logging
import re
from typing import Any
from ai.clients.router import get_client_for_model
from ai.clients.ai_ml_client import AIMLClient
from ai.evaluation.output_validator import validate_finalizer_output, extract_json_from_response

logger = logging.getLogger(__name__)

class FinalizerAgent:
    def __init__(self):
        pass

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        company_name = input_data.get("company_name", "Unknown")
        reviewer_output = input_data.get("reviewer_output", {})
        task_id = input_data.get("task_id", "")
        room_id = input_data.get("room_id", "")
        preferred_model = input_data.get("preferred_model", "gpt-4o")

        client, api_used, actual_model = get_client_for_model(preferred_model, "gpt-4o")

        prompt = (
            f"You are the chairman of an investment committee. Synthesize the team's analysis into a final, authoritative recommendation for the board. Be decisive. Use clear language. No hedging.\n\n"
            f"Target Company: {company_name}\n"
            f"Reviewer Output:\n{json.dumps(reviewer_output, indent=2)}\n\n"
            f"Think through each step carefully before producing your final output. "
            f"Provide a highly detailed, extremely verbose, stream-of-consciousness 'internal_audit_log' documenting your forensic thought process in real-time as if typing into a secure terminal. This log MUST be at least 3-4 paragraphs long, synthesizing the big picture.\n\n"
            f"CRITICAL REQUIREMENTS FOR `executive_summary`:\n"
            f"The `executive_summary` must be a FULL REPORT written in human-readable language, as if you are presenting to the board of directors. It must be highly detailed and extremely comprehensive.\n"
            f"Structure it exactly as follows, using these exact bold markdown headings:\n"
            f"**Overview**\nWrite a rich 4-5 sentence summary of the entire analysis, the strategic intent, and the decisive final verdict.\n\n"
            f"**Financial Assessment**\nWrite a deep paragraph detailing revenue trends, margins, burn rate, cash runway, and valuation justification.\n\n"
            f"**Risk Analysis**\nWrite a deep paragraph detailing the critical risks, regulatory threats, and their potential severity/probability.\n\n"
            f"**Strategic Position**\nWrite a deep paragraph on the company's competitive moat, tech stack, and long-term market trajectory.\n\n"
            f"**Recommendation**\nWrite a decisive final recommendation with explicit, actionable next steps.\n\n"
            f"Write each section as a full, detailed paragraph. Do NOT use bullet points in the summary text. Write in flowing, professional prose as a senior investment architect would.\n\n"
            f"If the verdict is 'caution', you MUST include a 'conditions' array listing specific prerequisites the target must meet.\n"
            f"If the verdict is 'caution' or 'reject', include 2-3 specific 'competitive_alternatives'.\n\n"

            f"Example output:\n"
            f'{{\n'
            f'  "internal_audit_log": "[SYSTEM LOG] Aggregating all agent outputs... [DONE]\\n\\n> Reviewer flagged HIGH regulatory risk on Subtask 1. Analyst confidence rests at 85% with notable data gaps in the EU market. The confluence of these vectors indicates a systemic issue.\\n\\n> Weighting financial upside against compliance risks. The cash burn is acceptable, but the moat is vulnerable. Formulating a Caution verdict with strict contingencies.\\n\\n> Writing executive presentation...",\n'
            f'  "historical_context": "Company was founded in 2015, shifted to capped-profit in 2019.",\n'
            f'  "future_path": "Requires massive capital expenditure for compute; path to profitability unclear.",\n'
            f'  "risk_score": 60,\n'
            f'  "verdict": "caution",\n'
            f'  "executive_summary": "After a comprehensive forensic audit, the committee recommends proceeding with caution. While the target demonstrates robust initial traction, there are severe, underestimated regulatory impacts in the EU market and looming financial liabilities regarding their compute expenditure. These dual risk vectors present a material threat to their projected 24-month runway. The company must aggressively address these compliance gaps and restructure their debt profile to ensure sustainable, long-term growth.",\n'
            f'  "conditions": [\n'
            f'    "Provide documented proof of SEC compliance for the new token.",\n'
            f'    "Demonstrate a 15% reduction in CAC in the EU market."\n'
            f'  ],\n'
            f'  "competitive_alternatives": ["Stripe", "Adyen"],\n'
            f'  "key_vulnerabilities": [\n'
            f'    {{\n'
            f'      "description": "Regulatory gap",\n'
            f'      "severity": "HIGH",\n'
            f'      "details": "The target operates in the EU market without the required MiCA (Markets in Crypto-Assets) license, exposing them to massive fines and operational shutdowns."\n'
            f'    }}\n'
            f'  ],\n'
            f'  "strategic_recommendation": "Enhanced due diligence",\n'
            f'  "reasoning_chain": [\n'
            f'    {{\n'
            f'      "agent": "planner",\n'
            f'      "contribution": "Decomposed thesis",\n'
            f'      "api_used": "AI/ML API",\n'
            f'      "confidence": 85\n'
            f'    }}\n'
            f'  ]\n'
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
                    if validate_finalizer_output(data):
                        reasoning_log = data.get("internal_audit_log", "Executive synthesis complete.")
                        return {
                            "owner": "finalizer",
                            "task": f"Compile executive dossier for {company_name}",
                            "context": "Final investment committee verdict",
                            "action": "Executive dossier compiled",
                            "output": {
                                "data": data,
                                "confidence": 95,
                                "reasoning": reasoning_log,
                                "api_used": api_used
                            },
                            "status": "completed",
                            "next_handoff": None,
                            "metadata": {
                                "task_id": task_id,
                                "room_id": room_id,
                                "cycle": 1
                            }
                        }
                    else:
                        logger.warning(
                            "Finalizer attempt %d: validation failed — retrying", attempt + 1
                        )
                except json.JSONDecodeError as exc:
                    logger.warning(
                        "Finalizer attempt %d: JSON parse error (%s) — retrying", attempt + 1, exc
                    )

            logger.error("Finalizer failed all 3 attempts. Last raw response:\n%s", response)
            return {
                "owner": "finalizer",
                "task": f"Compile executive dossier for {company_name}",
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
                "metadata": {"task_id": task_id, "room_id": room_id, "cycle": 1}
            }
        except Exception as e:
            return {
                "owner": "finalizer",
                "task": "Compile executive dossier",
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
                "metadata": {"task_id": task_id, "room_id": room_id, "cycle": 1}
            }
