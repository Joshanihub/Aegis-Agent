"""
Dynamic model router.

Maps user-facing model names to the correct API client + actual model identifier
that each provider accepts.
"""

from ai.clients.ai_ml_client import AIMLClient
from ai.clients.featherless_client import FeatherlessClient

# Maps frontend dropdown values → (provider, actual_model_id_for_api)
MODEL_REGISTRY: dict[str, tuple[str, str]] = {
    # --- AI/ML API (OpenAI / Anthropic / Google) ---
    "gpt-4o":                       ("aiml", "gpt-4o"),
    "gpt-4o-mini":                  ("aiml", "gpt-4o-mini"),
    "o1-preview":                   ("aiml", "o1-preview"),
    "o3-mini":                      ("aiml", "o3-mini"),
    "claude-3-5-sonnet-20241022":   ("aiml", "claude-3-5-sonnet-20241022"),
    "claude-3-opus-20240229":       ("aiml", "claude-3-opus-20240229"),
    "gemini-1.5-pro":               ("aiml", "gemini-1.5-pro"),

    # --- Featherless AI (open-source HuggingFace models) ---
    "meta-llama/Llama-3.3-70B-Instruct":  ("featherless", "meta-llama/Llama-3.3-70B-Instruct"),
    "meta-llama/Llama-3.1-405B-Instruct": ("featherless", "meta-llama/Llama-3.1-405B-Instruct"),
    "Qwen/Qwen2.5-72B-Instruct":          ("featherless", "Qwen/Qwen2.5-72B-Instruct"),
    "deepseek-ai/DeepSeek-V3":            ("featherless", "deepseek-ai/DeepSeek-V3"),
}

# Substrings that indicate a model belongs on AIML even if not in the registry
_AIML_HINTS = ("gpt", "claude", "gemini", "o1-", "o3-")


def get_client_for_model(model_name: str, default_model: str = "gpt-4o"):
    """
    Returns (client_instance, api_used_label, actual_model_id).

    Resolution order:
      1. Exact match in MODEL_REGISTRY
      2. Substring heuristic (_AIML_HINTS → AIMLClient, else FeatherlessClient)
      3. Fallback to default_model
    """
    actual_name = default_model if model_name == "auto" else model_name

    # 1. Exact registry lookup
    if actual_name in MODEL_REGISTRY:
        provider, model_id = MODEL_REGISTRY[actual_name]
        if provider == "aiml":
            return AIMLClient(), "AI/ML API", model_id
        return FeatherlessClient(), "Featherless AI", model_id

    # 2. Substring heuristic for models not yet in the registry
    lower = actual_name.lower()
    if any(hint in lower for hint in _AIML_HINTS):
        return AIMLClient(), "AI/ML API", actual_name

    # 3. Assume open-source → Featherless
    return FeatherlessClient(), "Featherless AI", actual_name
