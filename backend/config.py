"""Environment and agent configuration loading."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path

import yaml
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent

load_dotenv(_BACKEND_DIR / ".env")
load_dotenv(_PROJECT_ROOT / ".env")


@dataclass(frozen=True)
class AgentCredentials:
    agent_id: str
    api_key: str


@dataclass(frozen=True)
class Settings:
    port: int
    band_rest_url: str
    band_ws_url: str
    band_mock_mode: bool
    agent_config_path: Path
    logs_dir: Path


def _require_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def get_settings() -> Settings:
    return Settings(
        port=int(os.getenv("PORT", "8000")),
        band_rest_url=os.getenv("BAND_REST_URL", "https://app.band.ai").rstrip("/"),
        band_ws_url=os.getenv(
            "BAND_WS_URL", "wss://app.band.ai/api/v1/socket/websocket"
        ),
        band_mock_mode=os.getenv("BAND_MOCK_MODE", "true").lower() == "true",
        agent_config_path=Path(
            os.getenv("AGENT_CONFIG_PATH", str(_BACKEND_DIR / "agent_config.yaml"))
        ),
        logs_dir=Path(os.getenv("LOGS_DIR", str(_BACKEND_DIR / "logs"))),
    )


def load_agent_credentials() -> dict[str, AgentCredentials]:
    settings = get_settings()
    config_path = settings.agent_config_path

    if not config_path.exists():
        if settings.band_mock_mode:
            logger.warning("agent_config.yaml not found — using mock agent IDs")
            return _mock_credentials()
        raise RuntimeError(
            f"agent_config.yaml not found at {config_path}. "
            "Copy agent_config.example.yaml and fill in Band credentials."
        )

    with config_path.open(encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}

    credentials: dict[str, AgentCredentials] = {}
    for role in ("planner", "analyst", "reviewer", "finalizer"):
        entry = raw.get(role, {})
        agent_id = entry.get("agent_id", "")
        api_key = entry.get("api_key", "")
        if not agent_id or not api_key:
            if settings.band_mock_mode:
                credentials[role] = AgentCredentials(
                    agent_id=f"mock-{role}-id", api_key=f"mock-{role}-key"
                )
            else:
                raise RuntimeError(f"Missing credentials for agent role: {role}")
        else:
            credentials[role] = AgentCredentials(agent_id=agent_id, api_key=api_key)

    return credentials


def _mock_credentials() -> dict[str, AgentCredentials]:
    return {
        role: AgentCredentials(agent_id=f"mock-{role}-id", api_key=f"mock-{role}-key")
        for role in ("planner", "analyst", "reviewer", "finalizer")
    }
