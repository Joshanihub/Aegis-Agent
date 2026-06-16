"""Import helpers for Sobia's ai/ agents with stub fallback."""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


def try_import_ai_agent(class_path: str, class_name: str) -> Any | None:
    try:
        module = __import__(class_path, fromlist=[class_name])
        return getattr(module, class_name)
    except (ImportError, AttributeError) as exc:
        logger.debug("AI agent not available (%s.%s): %s", class_path, class_name, exc)
        return None
