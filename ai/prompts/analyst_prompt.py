import json
import logging
from typing import Any
from ai.clients.featherless_client import FeatherlessClient
from ai.evaluation.output_validator import validate_analyst_output, extract_json_from_response

import re
from ai.clients.router import get_client_for_model

logger = logging.getLogger(__name__)

class AnalystAgent:
    def __init__(self):
        pass

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        subtasks = input_data.get("subtasks", [])
        company_name = input_data.get("company_name", "Unknown target")
        deal_context = input_data.get("deal_context", "")
        analysis_approach = input_data.get("analysis_approach", "")
        key_concerns = input_data.get("key_concerns", [])
        reviewer_feedback = input_data.get("reviewer_feedback", "")
        task_id = input_data.get("task_id", "")
        room_id = input_data.get("room_id", "")
        cycle = input_data.get("cycle", 1)
        preferred_featherless_model = input_data.get("preferred_featherless_model", "meta-llama/Llama-3.3-70B-Instruct")

        client, api_used, actual_model = get_client_for_model(preferred_featherless_model, "meta-llama/Llama-3.3-70B-Instruct")

        prompt = (
            f"You are a forensic financial analyst specializing in enterprise due diligence. "
            f"Analyze the investment target against the Planner's subtasks. Be precise, critical, and evidence-based.\n\n"
            f"Company: {company_name}\n"
            f"Deal context:\n{deal_context}\n\n"
            f"Planner analysis approach: {analysis_approach}\n"
            f"Planner key concerns:\n{json.dumps(key_concerns, indent=2)}\n\n"
            f"Subtasks to analyze:\n{json.dumps(subtasks, indent=2)}\n\n"
            f"Reviewer feedback to address in this cycle:\n{reviewer_feedback or 'None - first analysis pass.'}\n\n"
            f"Do not invent a different plan. Work through the Planner's subtasks in priority order, and when reviewer feedback is present, explicitly resolve it in the relevant finding or data_gaps entry.\n\n"
            f"Produce decision-grade findings with compact evidence and confidence. "
            f"Provide an 'internal_audit_log' as a highly detailed, comprehensive reasoning log exploring every angle, assumption, risk vector, and strategic context (at least 12-15 sentences). Do not hold back on context; provide a rich, exhaustive stream-of-consciousness detailing your strategic rationale and anomalies found.\n\n"
            f"Example output:\n"
            f'{{\n'
            f'  "internal_audit_log": "[SYSTEM LOG] Fetching SEC filings and live market data... [DONE]\\n\\n> Initiating deep-dive correlation matrix across Q3 revenue and industry benchmarks. Instantly detecting a divergence in margin expansion versus peer median.\\n\\n> Scraping regulatory dockets for litigation risk... [WARNING] Match found regarding pending intellectual property disputes in the EMEA region. This could severely impact forward-looking EV multiples.\\n\\n> Synthesizing these granular findings into a coherent risk profile. The evidence strongly suggests hidden liabilities. Packaging raw telemetry for Reviewer override...",\n'
            f'  "findings": [\n'
            f'    {{\n'
            f'      "subtask_id": "1",\n'
            f'      "finding": "Strong revenue growth",\n'
            f'      "supporting_evidence": ["Public filings"],\n'
            f'      "confidence_score": 85,\n'
            f'      "risk_flag": false,\n'
            f'      "risk_severity": "NONE"\n'
            f'    }}\n'
            f'  ],\n'
            f'  "overall_confidence": 80,\n'
            f'  "data_gaps": ["EU market size"],\n'
            f'  "recommendation_to_reviewer": "Proceed to risk review"\n'
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
                    if validate_analyst_output(data):
                        reasoning_log = data.get("internal_audit_log", "Completed forensic analysis across all subtasks.")
                        return {
                            "owner": "analyst",
                            "task": "Synthesize findings for each subtask",
                            "context": f"Processing subtasks. Cycle {cycle}.",
                            "action": "Forensic analysis complete",
                            "output": {
                                "data": data,
                                "confidence": data.get("overall_confidence", 80),
                                "reasoning": reasoning_log,
                                "api_used": api_used
                            },
                            "status": "completed",
                            "next_handoff": {
                                "agent": "@reviewer",
                                "reason": "Findings ready for adversarial review"
                            },
                            "metadata": {
                                "task_id": task_id,
                                "room_id": room_id,
                                "cycle": cycle
                            }
                        }
                    else:
                        logger.warning("Analyst attempt %d: validation failed", attempt + 1)
                except json.JSONDecodeError as exc:
                    logger.warning("Analyst attempt %d: JSON parse error: %s", attempt + 1, exc)
                    
            logger.error("Analyst failed all 3 attempts. Raw:\n%s", response)
            return {
                "owner": "analyst",
                "task": "Synthesize findings for each subtask",
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
                "owner": "analyst",
                "task": "Synthesize findings",
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
