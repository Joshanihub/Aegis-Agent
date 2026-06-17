import json
import logging
from typing import Any
from ai.clients.ai_ml_client import AIMLClient
from ai.evaluation.output_validator import validate_planner_output, extract_json_from_response

import re
from ai.clients.router import get_client_for_model

logger = logging.getLogger(__name__)

class PlannerAgent:
    def __init__(self):
        pass

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        company_name = input_data.get("company_name", "Unknown")
        deal_context = input_data.get("deal_context", "")
        risk_tolerance = input_data.get("risk_tolerance", 50)
        analysis_depth = input_data.get("analysis_depth", "standard")
        preferred_model = input_data.get("preferred_model", "gpt-4o")
        task_id = input_data.get("task_id", "")
        room_id = input_data.get("room_id", "")

        prompt = (
            f"You are a senior investment committee chair with 20 years of M&A experience. "
            f"Your job is to decompose an investment analysis task into specific, actionable subtasks for your team of specialists.\n\n"
            f"Company: {company_name}\n"
            f"Context: {deal_context}\n"
            f"Risk Tolerance: {risk_tolerance}/100\n"
            f"Analysis Depth: {analysis_depth}\n\n"
            f"Think step by step before answering. Decompose the company/deal into 4-6 structured analysis subtasks. "
            f"Provide a highly detailed, extremely verbose, stream-of-consciousness 'internal_audit_log' documenting your forensic thought process in real-time as if typing into a secure terminal. This log MUST be at least 3-4 paragraphs long, detailing every assumption, risk vector, and strategic angle you considered.\n\n"
            f"Example output:\n"
            f'{{\n'
            f'  "internal_audit_log": "[SYSTEM LOG] Establishing encrypted connection... [100%]\\n\\n> Initiating deep strategic decomposition of target parameters. Initial scan reveals several multi-layered risk vectors spanning across financials, regulatory constraints, and emerging technological dependencies.\\n\\n> Drilling down into financial structures: Considering the requested analysis depth, it is imperative we audit revenue sustainability against macroeconomic headwinds. I am setting a priority flag on gross margin compression.\\n\\n> Constructing 4 discrete deployment subtasks for the intelligence committee. Prioritizing regulatory compliance first due to recent shifts in anti-trust laws, followed by quantitative health...",\n'
            f'  "subtasks": [\n'
            f'    {{\n'
            f'      "id": "1",\n'
            f'      "title": "Financial Audit",\n'
            f'      "description": "Review revenue growth and margins",\n'
            f'      "priority": "high",\n'
            f'      "focus_area": "financial"\n'
            f'    }}\n'
            f'  ],\n'
            f'  "analysis_approach": "DCF",\n'
            f'  "key_concerns": ["Market volatility"],\n'
            f'  "confidence": 85\n'
            f'}}\n\n'
            f"IMPORTANT: Respond ONLY with valid JSON. No prose. No markdown fences. "
            f"No explanation before or after the JSON object. Raw JSON only."
        )

        try:
            for attempt in range(3):
                # Auto-route logic for Planner (Defaults to GPT-4o for complex decomposition)
                client, api_used, actual_model = get_client_for_model(preferred_model, "gpt-4o")
                response = await client.call_completion(prompt, model=actual_model)
                
                cleaned = extract_json_from_response(response)
                
                try:
                    data = json.loads(cleaned)
                    if validate_planner_output(data):
                        reasoning_log = data.get("internal_audit_log", f"Structured {company_name} deal into subtasks.")
                        return {
                            "owner": "planner",
                            "task": f"Decompose investment analysis for {company_name}",
                            "context": f"Decomposing deal with {analysis_depth} depth.",
                            "action": "Subtask decomposition complete",
                            "output": {
                                "data": data,
                                "confidence": data.get("confidence", 85),
                                "reasoning": reasoning_log,
                                "api_used": api_used
                            },
                            "status": "completed",
                            "next_handoff": {
                                "agent": "@analyst",
                                "reason": "Subtasks ready for analysis"
                            },
                            "metadata": {
                                "task_id": task_id,
                                "room_id": room_id,
                                "cycle": 1
                            }
                        }
                    else:
                        logger.warning("Planner attempt %d: validation failed", attempt + 1)
                except json.JSONDecodeError as exc:
                    logger.warning("Planner attempt %d: JSON parse error: %s", attempt + 1, exc)
                    
            logger.error("Planner failed all 3 attempts. Raw:\n%s", response)
            return {
                "owner": "planner",
                "task": f"Decompose investment analysis for {company_name}",
                "context": "",
                "action": "Failed to parse JSON",
                "output": {
                    "data": {"raw": response},
                    "confidence": 0,
                    "reasoning": "Failed to parse AI response as JSON.",
                    "api_used": "Unknown"
                },
                "status": "error",
                "next_handoff": None,
                "metadata": {"task_id": task_id, "room_id": room_id, "cycle": 1}
            }
        except Exception as e:
            return {
                "owner": "planner",
                "task": f"Decompose investment analysis",
                "context": "",
                "action": "Agent execution failed",
                "output": {
                    "data": {"error": str(e)},
                    "confidence": 0,
                    "reasoning": f"Exception: {str(e)}",
                    "api_used": "Unknown"
                },
                "status": "error",
                "next_handoff": None,
                "metadata": {"task_id": task_id, "room_id": room_id, "cycle": 1}
            }
