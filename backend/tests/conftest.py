"""Shared pytest fixtures."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Ensure `backend/` is on the import path so tests can import `models`, `services`, etc.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from models import state as task_registry
from services.event_logger import EventLogger, event_logger


@pytest.fixture(autouse=True)
def reset_state():
    task_registry.clear_all()
    event_logger.clear()
    from agents import reviewer as reviewer_module

    reviewer_module._review_cycle_counts.clear()
    yield
    task_registry.clear_all()
    event_logger.clear()
    reviewer_module._review_cycle_counts.clear()


@pytest.fixture
def valid_band_message_dict():
    return {
        "owner": "planner",
        "task": "Decompose investment analysis into subtasks",
        "context": "New deal: Stripe, Series B, $200M",
        "action": "Subtask decomposition complete",
        "output": {
            "data": {
                "subtasks": [
                    {"id": "1", "title": "Financial audit", "priority": "HIGH"},
                ],
                "analysis_framework": "DCF + Comparable",
                "priority_order": ["1"],
                "estimated_complexity": "HIGH",
            },
            "confidence": 85,
            "reasoning": "Deal involves complex regulatory environment.",
            "api_used": "AI/ML API",
        },
        "status": "completed",
        "next_handoff": {"agent": "@analyst", "reason": "Subtasks ready"},
        "metadata": {
            "task_id": "task-001",
            "room_id": "room-abc",
            "timestamp": "2026-06-14T10:00:00Z",
            "cycle": 1,
        },
    }


@pytest.fixture
def valid_verdict_dict():
    return {
        "risk_score": 72,
        "verdict": "reject",
        "summary": "High regulatory and market risk identified.",
        "vulnerabilities": [
            {"description": "EU regulatory exposure", "severity": "HIGH"},
        ],
        "reasoning_chain": [
            {"agent": "planner", "api": "AI/ML API", "confidence": 88},
        ],
    }


@pytest.fixture
def valid_task_input():
    return {
        "company_name": "Stripe",
        "deal_context": "Series B, $200M valuation, VC investment",
        "risk_tolerance": 60,
        "analysis_depth": "STANDARD",
    }
