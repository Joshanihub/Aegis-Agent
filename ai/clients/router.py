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
    "gpt-4-turbo":                  ("aiml", "gpt-4-turbo"),
    "gpt-4o-mini":                  ("aiml", "gpt-4o-mini"),
    "claude-3-5-sonnet-20240620":   ("aiml", "claude-3-5-sonnet-20240620"),
    "claude-3-opus-20240229":       ("aiml", "claude-3-opus-20240229"),
    "gemini-1.5-pro":               ("aiml", "gemini-1.5-pro"),
    "gemini-1.5-flash":             ("aiml", "gemini-1.5-flash"),

    # --- Featherless AI (open-source HuggingFace models) ---
    "mistral-7b":                               ("featherless", "mistralai/Mistral-7B-Instruct-v0.2"),
    "mistralai/Mistral-7B-Instruct-v0.2":       ("featherless", "mistralai/Mistral-7B-Instruct-v0.2"),
    "meta-llama/Meta-Llama-3-8B-Instruct":      ("featherless", "meta-llama/Meta-Llama-3-8B-Instruct"),
    "meta-llama/Meta-Llama-3-70B-Instruct":     ("featherless", "meta-llama/Meta-Llama-3-70B-Instruct"),
    "Qwen/Qwen2-72B-Instruct":                  ("featherless", "Qwen/Qwen2-72B-Instruct"),
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
