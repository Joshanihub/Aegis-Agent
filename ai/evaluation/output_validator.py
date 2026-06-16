import logging
import re

logger = logging.getLogger(__name__)

VALID_VERDICTS = {"approve", "caution", "reject"}


def _as_number(value: object) -> bool:
    """Accept int, float, or a string that parses as a number."""
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        try:
            float(value)
            return True
        except ValueError:
            return False
    return False


def extract_json_from_response(text: str) -> str:
    """Robustly extract JSON from a markdown-wrapped or prose-padded AI response."""
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # fallback to first { and last }
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end+1]
    
    return text.strip()


def validate_planner_output(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "subtasks" not in data or not isinstance(data["subtasks"], list):
        logger.error("Planner output missing 'subtasks' list")
        return False
    if "confidence" not in data or not _as_number(data["confidence"]):
        logger.error("Planner output missing 'confidence' number (got %r)", data.get("confidence"))
        return False
    return True


def validate_analyst_output(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "findings" not in data or not isinstance(data["findings"], list):
        logger.error("Analyst output missing 'findings' list")
        return False
    if "overall_confidence" not in data or not _as_number(data["overall_confidence"]):
        logger.error("Analyst output missing 'overall_confidence' number (got %r)", data.get("overall_confidence"))
        return False
    return True


def validate_reviewer_output(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "risk_score" not in data or not _as_number(data["risk_score"]):
        logger.error("Reviewer output missing 'risk_score' number (got %r)", data.get("risk_score"))
        return False
    if "approved" not in data or not isinstance(data["approved"], bool):
        logger.error("Reviewer output missing 'approved' bool (got %r)", data.get("approved"))
        return False
    if "critical_issues" not in data or not isinstance(data["critical_issues"], list):
        logger.error("Reviewer output missing 'critical_issues' list")
        return False
    return True


def validate_finalizer_output(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "risk_score" not in data or not _as_number(data["risk_score"]):
        logger.error("Finalizer output missing 'risk_score' number (got %r)", data.get("risk_score"))
        return False
    raw_verdict = data.get("verdict", "")
    if str(raw_verdict).lower() not in VALID_VERDICTS:
        logger.error(
            "Finalizer output missing valid 'verdict' (got %r, expected one of %s)",
            raw_verdict, VALID_VERDICTS,
        )
        return False
    # Normalise verdict to lowercase so downstream code always gets a clean value
    data["verdict"] = str(raw_verdict).lower()
    if "executive_summary" not in data or not isinstance(data["executive_summary"], str):
        logger.error("Finalizer output missing 'executive_summary' string")
        return False
    if "key_vulnerabilities" not in data or not isinstance(data["key_vulnerabilities"], list):
        logger.error("Finalizer output missing 'key_vulnerabilities' list")
        return False
    return True
