import os
import json
import httpx
import logging
import asyncio
from ai.clients.ai_ml_client import AIMLClient

logger = logging.getLogger(__name__)

class FeatherlessClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("FEATHERLESS_API_BASE_URL", "https://api.featherless.ai/v1")
        self.api_key = os.getenv("FEATHERLESS_API_KEY")
        self.default_model = "mistralai/Mistral-7B-Instruct-v0.2"
        self.fallback_client = AIMLClient()

    async def call_completion(self, prompt: str, model: str = None) -> str:
        if not self.api_key:
            logger.warning("FEATHERLESS_API_KEY not found. Using fallback mock.")
            return self._get_mock_response(prompt)

        model = model or self.default_model
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 1500
        }
        
        async with httpx.AsyncClient() as client:
            for attempt in range(3):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                except Exception as e:
                    logger.error(f"Featherless call failed on attempt {attempt+1}: {e}")
                    if attempt == 2:
                        logger.warning("Featherless failed 3 times. Falling back to AI/ML API.")
                        return await self.fallback_client.call_completion(prompt)
                    await asyncio.sleep(2 ** attempt)
                    
        return "{}"

    def _get_mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "reviewer" in prompt_lower or "adversarial" in prompt_lower or "risk-focused" in prompt_lower:
            return json.dumps({
                "risk_score": 58,
                "approved": True,
                "critical_issues": [
                    {
                        "issue": "Regulatory compliance gaps",
                        "severity": "HIGH",
                        "affects_subtask": "1"
                    }
                ],
                "feedback_to_analyst": "",
                "justification": "Remaining risks are within acceptable tolerance in mock review."
            })
        else:
            # Analyst mock
            return json.dumps({
                "findings": [
                    {
                        "subtask_id": "1",
                        "finding": "Strong revenue growth indicated in mock data",
                        "supporting_evidence": ["Mock financial statements"],
                        "confidence_score": 82,
                        "risk_flag": False,
                        "risk_severity": "NONE"
                    }
                ],
                "overall_confidence": 74,
                "data_gaps": [],
                "recommendation_to_reviewer": "Proceed with caution on market conditions"
            })
