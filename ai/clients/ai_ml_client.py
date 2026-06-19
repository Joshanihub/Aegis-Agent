import os
import json
import httpx
import logging
import asyncio

logger = logging.getLogger(__name__)

class AIMLClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("AI_ML_API_BASE_URL", "https://api.aimlapi.com/v1")
        self.api_key = os.getenv("AI_ML_API_KEY")
        self.default_model = "gpt-4o-mini"
        self.max_tokens = int(os.getenv("AI_COMPLETION_MAX_TOKENS", "1400"))
        self.timeout_seconds = float(os.getenv("AI_COMPLETION_TIMEOUT_SECONDS", "24"))

    async def call_completion(self, prompt: str, model: str = None) -> str:
        if not self.api_key:
            logger.warning("AI_ML_API_KEY not found. Using fallback mock.")
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
            "max_tokens": self.max_tokens
        }
        
        async with httpx.AsyncClient() as client:
            for attempt in range(3):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=self.timeout_seconds
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429 or e.response.status_code >= 500:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2 ** attempt)
                    else:
                        raise
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 ** attempt)
                    
        return "{}"

    def _get_mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "finalizer" in prompt_lower or "executive" in prompt_lower:
            return json.dumps({
                "risk_score": 60,
                "verdict": "caution",
                "executive_summary": "Investment committee recommends CAUTION based on mock analysis.",
                "key_vulnerabilities": [
                    {
                        "description": "Mock regulatory risk identified.",
                        "severity": "MEDIUM"
                    }
                ],
                "strategic_recommendation": "Proceed with enhanced due diligence.",
                "reasoning_chain": [
                    {
                        "agent": "planner",
                        "contribution": "Decomposed thesis",
                        "api_used": "AI/ML API",
                        "confidence": 85
                    }
                ]
            })
        else:
            # Planner mock
            return json.dumps({
                "subtasks": [
                    {
                        "id": "1",
                        "title": "Financial audit",
                        "description": "Review financial statements",
                        "priority": "high",
                        "focus_area": "financial"
                    }
                ],
                "analysis_approach": "Standard DCF and comparable analysis",
                "key_concerns": ["Market volatility"],
                "confidence": 85
            })
