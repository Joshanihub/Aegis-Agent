"""Orchestrator workflow tests."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from models.schemas import (
    AgentState,
    AgentStatus,
    BandMessage,
    BandMessageOutput,
    TaskState,
    TaskStatus,
)
from models import state as task_registry
from services.band_service import BandService
from services.orchestrator import AgentError, run_workflow


def _now():
    return datetime.now(timezone.utc)


def _make_task() -> TaskState:
    now = _now()
    task = TaskState(
        task_id="task-orch-001",
        room_id="room-pending",
        company_name="Stripe",
        deal_context="Series B, $200M valuation, VC investment",
        risk_tolerance=60,
        analysis_depth="STANDARD",
        status=TaskStatus.CREATED,
        cycle_count=0,
        agents=[
            AgentState(
                agent_id=aid,
                name=name,
                role=aid,
                status=AgentStatus.IDLE,
                updated_at=now,
            )
            for aid, name in [
                ("planner", "THE FORENSIC AUDITOR"),
                ("analyst", "THE MARKET ANALYST"),
                ("reviewer", "THE RISK AUDITOR"),
                ("finalizer", "THE EXECUTIVE FINALIZER"),
            ]
        ],
        created_at=now,
        updated_at=now,
    )
    task_registry.register_task(task)
    return task


def _stub_message(owner: str, status: str = "completed", **data) -> BandMessage:
    return BandMessage(
        owner=owner,
        task=f"{owner} task",
        context="test",
        action=f"{owner} action",
        output=BandMessageOutput(
            data=data,
            confidence=80,
            reasoning="test",
            api_used="AI/ML API" if owner in ("planner", "finalizer") else "Featherless AI",
        ),
        status=status,
        next_handoff=None,
        metadata={
            "task_id": "task-orch-001",
            "room_id": "room-test",
            "timestamp": "2026-06-14T10:00:00Z",
            "cycle": 1,
        },
    )


class TestOrchestrator:
    @pytest.mark.asyncio
    async def test_full_workflow_happy_path(self):
        task = _make_task()
        events: list[str] = []

        async def broadcast(event: dict):
            events.append(event["type"])

        planner_msg = _stub_message(
            "planner",
            subtasks=[],
            analysis_framework="x",
            priority_order=[],
            estimated_complexity="medium",
        )
        analyst_msg = _stub_message(
            "analyst",
            findings=[],
            overall_confidence=74,
            data_gaps=[],
            recommendation_to_reviewer="ok",
        )
        reviewer_msg = _stub_message(
            "reviewer",
            risk_score=40,
            approved=True,
            critical_issues=[],
            feedback_to_analyst="",
            justification="ok",
        )
        finalizer_msg = _stub_message(
            "finalizer",
            risk_score=40,
            verdict="approve",
            executive_summary="Approved",
            key_vulnerabilities=[],
        )

        mock_agents = {
            "planner": AsyncMock(
                run=AsyncMock(return_value=planner_msg.model_dump())
            ),
            "analyst": AsyncMock(
                run=AsyncMock(return_value=analyst_msg.model_dump())
            ),
            "reviewer": AsyncMock(
                run=AsyncMock(return_value=reviewer_msg.model_dump())
            ),
            "finalizer": AsyncMock(
                run=AsyncMock(return_value=finalizer_msg.model_dump())
            ),
        }

        band = BandService(mock_mode=True)
        verdict = await run_workflow(task, broadcast, band, mock_agents)

        assert verdict.verdict.value == "approve"
        assert "verdict_ready" in events
        assert events.count("band_message") >= 4

    @pytest.mark.asyncio
    async def test_reviewer_loop_triggers_second_analyst_pass(self):
        task = _make_task()
        analyst_calls = 0
        reviewer_calls = 0

        async def broadcast(event: dict):
            pass

        async def analyst_run(input_data):
            nonlocal analyst_calls
            analyst_calls += 1
            return _stub_message(
                "analyst",
                findings=[],
                overall_confidence=74,
                data_gaps=[],
                recommendation_to_reviewer="ok",
            ).model_dump()

        async def reviewer_run(input_data):
            nonlocal reviewer_calls
            reviewer_calls += 1
            if reviewer_calls == 1:
                return _stub_message(
                    "reviewer",
                    status="needs-review",
                    risk_score=75,
                    approved=False,
                    critical_issues=[],
                    feedback_to_analyst="redo",
                    justification="gaps",
                ).model_dump()
            return _stub_message(
                "reviewer",
                risk_score=50,
                approved=True,
                critical_issues=[],
                feedback_to_analyst="",
                justification="ok",
            ).model_dump()

        mock_agents = {
            "planner": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "planner",
                        subtasks=[],
                        analysis_framework="x",
                        priority_order=[],
                        estimated_complexity="medium",
                    ).model_dump()
                )
            ),
            "analyst": AsyncMock(run=analyst_run),
            "reviewer": AsyncMock(run=reviewer_run),
            "finalizer": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "finalizer",
                        risk_score=50,
                        verdict="caution",
                        executive_summary="Caution",
                        key_vulnerabilities=[],
                    ).model_dump()
                )
            ),
        }

        band = BandService(mock_mode=True)
        await run_workflow(task, broadcast, band, mock_agents)

        assert analyst_calls == 2
        assert reviewer_calls == 2
        assert task.cycle_count == 1

    @pytest.mark.asyncio
    async def test_borderline_reviewer_risk_revises_without_human_pause(self):
        task = _make_task()
        analyst_calls = 0
        events: list[str] = []

        async def broadcast(event: dict):
            events.append(event["type"])

        async def analyst_run(input_data):
            nonlocal analyst_calls
            analyst_calls += 1
            return _stub_message(
                "analyst",
                findings=[],
                overall_confidence=74,
                data_gaps=[],
                recommendation_to_reviewer="ok",
            ).model_dump()

        reviewer_responses = [
            _stub_message(
                "reviewer",
                status="needs-review",
                risk_score=65,
                approved=False,
                critical_issues=[],
                feedback_to_analyst="redo",
                justification="needs another pass",
            ).model_dump(),
            _stub_message(
                "reviewer",
                risk_score=45,
                approved=True,
                critical_issues=[],
                feedback_to_analyst="",
                justification="ok",
            ).model_dump(),
        ]

        mock_agents = {
            "planner": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "planner",
                        subtasks=[],
                        analysis_framework="x",
                        priority_order=[],
                        estimated_complexity="medium",
                    ).model_dump()
                )
            ),
            "analyst": AsyncMock(run=analyst_run),
            "reviewer": AsyncMock(run=AsyncMock(side_effect=reviewer_responses)),
            "finalizer": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "finalizer",
                        risk_score=45,
                        verdict="caution",
                        executive_summary="Caution",
                        key_vulnerabilities=[],
                    ).model_dump()
                )
            ),
        }

        band = BandService(mock_mode=True)
        await run_workflow(task, broadcast, band, mock_agents)

        assert analyst_calls == 2
        assert "human_input_required" not in events

    @pytest.mark.asyncio
    async def test_agent_error_triggers_retry_then_fatal(self):
        task = _make_task()
        error_events: list[dict] = []

        async def broadcast(event: dict):
            if event.get("type") == "error":
                error_events.append(event)

        failing_agent = AsyncMock(
            run=AsyncMock(side_effect=RuntimeError("Model timeout"))
        )
        mock_agents = {
            "planner": failing_agent,
            "analyst": AsyncMock(),
            "reviewer": AsyncMock(),
            "finalizer": AsyncMock(),
        }

        band = BandService(mock_mode=True)
        with pytest.raises(AgentError):
            await run_workflow(task, broadcast, band, mock_agents)

        assert failing_agent.run.call_count == 2
        assert len(error_events) == 1
        assert error_events[0]["recoverable"] is False

    @pytest.mark.asyncio
    async def test_websocket_events_order(self):
        task = _make_task()
        emitted: list[tuple[str, str]] = []

        async def broadcast(event: dict):
            if event["type"] == "agent_status_changed":
                emitted.append((event["type"], event["agent_id"]))

        planner_msg = _stub_message(
            "planner",
            subtasks=[],
            analysis_framework="x",
            priority_order=[],
            estimated_complexity="medium",
        )
        mock_agents = {
            "planner": AsyncMock(
                run=AsyncMock(return_value=planner_msg.model_dump())
            ),
            "analyst": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "analyst",
                        findings=[],
                        overall_confidence=74,
                        data_gaps=[],
                        recommendation_to_reviewer="ok",
                    ).model_dump()
                )
            ),
            "reviewer": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "reviewer",
                        risk_score=40,
                        approved=True,
                        critical_issues=[],
                        feedback_to_analyst="",
                        justification="ok",
                    ).model_dump()
                )
            ),
            "finalizer": AsyncMock(
                run=AsyncMock(
                    return_value=_stub_message(
                        "finalizer",
                        risk_score=40,
                        verdict="approve",
                        executive_summary="Approved",
                        key_vulnerabilities=[],
                    ).model_dump()
                )
            ),
        }

        band = BandService(mock_mode=True)
        await run_workflow(task, broadcast, band, mock_agents)

        planner_status_events = [
            e for e in emitted if e[1] == "planner" and e[0] == "agent_status_changed"
        ]
        assert len(planner_status_events) >= 2
