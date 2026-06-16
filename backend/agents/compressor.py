import json
import logging
from typing import Any
from ai.clients.featherless_client import FeatherlessClient
from ai.evaluation.output_validator import extract_json_from_response
from agents.base_agent import BaseAgent
from models.schemas import BandMessage

logger = logging.getLogger(__name__)

class CompressorAgent(BaseAgent):
    agent_id = "compressor"
    name = "THE CONTEXT COMPRESSOR"
    role = "compressor"

    def __init__(self):
        self.client = FeatherlessClient()

    async def run(self, input_data: dict[str, Any]) -> BandMessage:
        task_id = input_data.get("task_id", "")
        room_id = input_data.get("room_id", "")
        past_messages = input_data.get("messages", [])
        new_criteria = input_data.get("new_criteria", "")

        prompt = (
            f"You are a Context Compression Agent for a multi-agent investment committee.\n"
            f"Your job is to read the previous session's logs and compress them into a highly dense summary. "
            f"You must capture the core findings, risk factors, and final verdict of the previous analysis.\n\n"
            f"Previous Messages:\n{json.dumps(past_messages, indent=2)}\n\n"
            f"New Refinement Criteria provided by user:\n{new_criteria}\n\n"
            f"Produce a compressed JSON context block that will be fed back into the Planner and Analyst for a new cycle.\n\n"
            f"Example output:\n"
            f'{{\n'
            f'  "compressed_context": "Previous run analyzed OpenAI. Rejected due to lack of financials. Risk score 41. New criteria requires focusing strictly on AI compute supply chain vulnerabilities.",\n'
            f'  "new_focus_areas": ["supply chain", "compute"]\n'
            f'}}\n\n'
            f"IMPORTANT: Respond ONLY with valid JSON. No prose. Raw JSON only."
        )

        try:
            for attempt in range(3):
                response = await self.client.call_completion(prompt)
                
                cleaned = extract_json_from_response(response)
                
                try:
                    data = json.loads(cleaned)
                    return self.build_message(
                        task="Compress historical context",
                        context="Applying new criteria for refinement",
                        action="Context Compressed",
                        output_data=data,
                        status="completed",
                        next_agent="@planner",
                        api_used="Featherless AI",
                        confidence=100,
                        reasoning=data.get("compressed_context", "Memory compressed."),
                        task_id=task_id,
                        room_id=room_id,
                        handoff_reason="Context compressed for Planner"
                    )
                except json.JSONDecodeError as exc:
                    logger.warning("Compressor attempt %d parse error: %s", attempt + 1, exc)
                    
            return self.build_message(
                task="Compress historical context",
                context="Applying new criteria for refinement",
                action="Failed to parse JSON",
                output_data={"raw": response},
                status="error",
                next_agent=None,
                api_used="Featherless AI",
                confidence=0,
                reasoning="Parse failed",
                task_id=task_id,
                room_id=room_id
            )
        except Exception as e:
            return self.build_message(
                task="Compress historical context",
                context="Applying new criteria for refinement",
                action="Execution failed",
                output_data={"error": str(e)},
                status="error",
                next_agent=None,
                api_used="Featherless AI",
                confidence=0,
                reasoning=str(e),
                task_id=task_id,
                room_id=room_id
            )
