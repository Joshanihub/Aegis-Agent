"""FastAPI REST and WebSocket routes."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from pydantic import ValidationError

from config import get_settings
from ai.clients.router import get_client_for_model
from ai.evaluation.output_validator import extract_json_from_response
from models.schemas import (
    CompareInput,
    ComparisonCriterion,
    ComparisonData,
    CreateRoomResponse,
    ErrorResponse,
    TaskInput,
    TaskState,
    RefineInput,
    TaskStatus,
    InterveneInput,
    SessionSummary,
)
from models import state as task_registry
from services.band_service import BandService
from services.event_logger import event_logger
from services.orchestrator import run_workflow
from services.room_service import broadcast_to_task, create_task

logger = logging.getLogger(__name__)

router = APIRouter()


async def _ws_broadcast_factory(task_id: str):
    async def broadcast(event: dict[str, Any]) -> None:
        await broadcast_to_task(task_id, event)

    return broadcast


async def _execute_workflow(task: TaskState) -> None:
    broadcast = await _ws_broadcast_factory(task.task_id)
    try:
        await run_workflow(task, broadcast)
    except Exception as exc:
        logger.exception("Workflow failed for task %s: %s", task.task_id, exc)


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...)) -> dict[str, str]:
    file_id = str(uuid.uuid4())
    upload_dir = Path("data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / f"{file_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"file_id": file_id, "filename": file.filename or "unknown"}


@router.post("/api/rooms/create", response_model=CreateRoomResponse)
async def create_room(
    body: TaskInput, background_tasks: BackgroundTasks
) -> CreateRoomResponse:
    task = create_task(body)
    task_registry.clear_cancel(task.task_id)
    background_tasks.add_task(_execute_workflow, task)
    return CreateRoomResponse(room_id=task.room_id, task_id=task.task_id)


@router.get("/api/sessions", response_model=list[SessionSummary])
async def list_sessions() -> list[SessionSummary]:
    return task_registry.list_sessions()


@router.post("/api/rooms/{task_id}/refine")
async def refine_analysis(
    task_id: str, body: RefineInput, background_tasks: BackgroundTasks
) -> dict[str, str]:
    task = task_registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Store the refinement criteria
    # We will pass this to the orchestrator to compress context and run again
    # We can just run the workflow again with an extra flag or field in task
    # Let's add a dynamic attribute or just update the deal_context for now to trigger the workflow.
    # A cleaner way is passing the refinement criteria explicitly.
    # For now, append to deal_context but prefix with [REFINEMENT].
    task.deal_context = f"{task.deal_context}\n\n[REFINEMENT CRITERIA]: {body.new_criteria}"
    task.status = TaskStatus.PLANNING
    task.current_agent = "compressor"
    task.cycle_count = 0  # Reset review cycles for the new refinement pass
    task_registry.update_task(task)
    task_registry.clear_cancel(task_id)
    
    # Clear the old verdict so the UI doesn't immediately redirect
    task_registry.set_verdict(task_id, None)
    
    background_tasks.add_task(_execute_workflow, task)
    return {"status": "refining", "task_id": task_id}


@router.post("/api/rooms/{task_id}/cancel")
async def cancel_analysis(task_id: str) -> dict[str, str]:
    task = task_registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status in {TaskStatus.COMPLETE, TaskStatus.ERROR, TaskStatus.CANCELLED}:
        return {"status": task.status.value, "task_id": task_id}

    task_registry.request_cancel(task_id)
    task.status = TaskStatus.CANCELLED
    task.current_agent = None
    task_registry.update_task(task)
    await broadcast_to_task(task_id, {
        "type": "workflow_cancelled",
        "task": task.model_dump(mode="json"),
    })
    task_registry.get_intervention_event(task_id).set()
    return {"status": "cancelled", "task_id": task_id}


@router.post("/api/rooms/{task_id}/retry")
async def retry_analysis(task_id: str, background_tasks: BackgroundTasks) -> dict[str, str]:
    task = task_registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status not in {TaskStatus.ERROR, TaskStatus.CANCELLED}:
        raise HTTPException(status_code=409, detail="Only failed or cancelled analyses can be retried")

    task.status = TaskStatus.PLANNING
    task.current_agent = "planner"
    task.cycle_count = 0
    task_registry.set_verdict(task_id, None)
    task_registry.clear_cancel(task_id)
    task_registry.update_task(task)
    await broadcast_to_task(task_id, {
        "type": "workflow_retried",
        "task": task.model_dump(mode="json"),
    })
    background_tasks.add_task(_execute_workflow, task)
    return {"status": "retrying", "task_id": task_id}


@router.post("/api/rooms/{task_id}/intervene")
async def intervene(task_id: str, body: InterveneInput) -> dict[str, str]:
    task = task_registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task.deal_context = f"{task.deal_context}\n\n[USER INTERVENTION]: {body.guidance}"
    task_registry.update_task(task)
    
    await broadcast_to_task(task_id, {
        "type": "user_intervention",
        "guidance": body.guidance
    })
    
    event = task_registry.get_intervention_event(task_id)
    event.set()
    
    return {"status": "ok"}


@router.get("/api/rooms/{task_id}/status", response_model=TaskState)
async def get_task_status(task_id: str) -> TaskState:
    task = task_registry.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error="Task not found", code="TASK_NOT_FOUND"
            ).model_dump(),
        )
    return task


@router.get("/api/rooms/{task_id}/verdict")
async def get_verdict(task_id: str) -> dict[str, Any]:
    verdict = task_registry.get_verdict(task_id)
    if not verdict:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error="Verdict not ready", code="VERDICT_NOT_READY"
            ).model_dump(),
        )
    return verdict.model_dump()


def _fallback_comparison(task: TaskState, alternative: str) -> ComparisonData:
    verdict = task_registry.get_verdict(task.task_id)
    primary_risk = verdict.risk_score if verdict else 50
    issues = verdict.vulnerabilities if verdict else []
    issue_summary = "; ".join(v.description for v in issues[:3]) or "No completed vulnerability list available."

    return ComparisonData(
        primary_company=task.company_name,
        alternative_company=alternative,
        primary_risk_score=primary_risk,
        alternative_risk_score=None,
        recommendation="Run a dedicated analysis for the alternative before making an investment decision.",
        confidence=45,
        method="fallback_pending_alternative_analysis",
        criteria=[
            ComparisonCriterion(
                criterion="Completed evidence",
                primary="Full Aegis dossier and agent trail available.",
                alternative="No dedicated Aegis run has been completed yet.",
            ),
            ComparisonCriterion(
                criterion="Known risk profile",
                primary=f"Risk score {primary_risk}. Key issues: {issue_summary}",
                alternative="Risk profile requires a separate agent workflow.",
            ),
            ComparisonCriterion(
                criterion="Decision readiness",
                primary="Ready for committee review.",
                alternative="Candidate for follow-up diligence, not yet decision-ready.",
            ),
        ],
        rationale=(
            "The system could not complete an AI-backed comparison, so it is showing only "
            "the audited primary dossier against the alternative's pending analysis state."
        ),
        next_steps=[
            f"Start a full Aegis analysis for {alternative}.",
            "Compare both completed dossiers in the archive once the alternative run finishes.",
        ],
    )


def _find_completed_competitor(alternative: str, task_id: str | None = None) -> tuple[TaskState, Any] | None:
    if task_id:
        task = task_registry.get_task(task_id)
        verdict = task_registry.get_verdict(task_id)
        if task and verdict and task.status == TaskStatus.COMPLETE:
            return task, verdict
        return None

    normalized = alternative.strip().lower()
    for session in task_registry.list_sessions():
        if session.status != TaskStatus.COMPLETE:
            continue
        if session.company_name.strip().lower() != normalized:
            continue
        task = task_registry.get_task(session.task_id)
        verdict = task_registry.get_verdict(session.task_id)
        if task and verdict:
            return task, verdict
    return None


def _completed_dossier_comparison(
    primary_task: TaskState,
    primary_verdict: Any,
    competitor_task: TaskState,
    competitor_verdict: Any,
) -> ComparisonData:
    primary_vulns = primary_verdict.vulnerabilities[:3]
    competitor_vulns = competitor_verdict.vulnerabilities[:3]
    primary_conditions = primary_verdict.conditions or []
    competitor_conditions = competitor_verdict.conditions or []

    if competitor_verdict.risk_score < primary_verdict.risk_score:
        recommendation = (
            f"{competitor_task.company_name} currently screens as the lower-risk option "
            "based on completed Aegis dossiers."
        )
    elif competitor_verdict.risk_score > primary_verdict.risk_score:
        recommendation = (
            f"{primary_task.company_name} currently screens as the lower-risk option "
            "based on completed Aegis dossiers."
        )
    else:
        recommendation = "Both completed dossiers carry the same risk score; compare conditions and vulnerabilities before deciding."

    return ComparisonData(
        primary_company=primary_task.company_name,
        alternative_company=competitor_task.company_name,
        primary_risk_score=primary_verdict.risk_score,
        alternative_risk_score=competitor_verdict.risk_score,
        recommendation=recommendation,
        confidence=min(95, max(60, int((len(primary_task.messages) + len(competitor_task.messages)) * 8))),
        method="completed_dossier_comparison",
        criteria=[
            ComparisonCriterion(
                criterion="Verdict",
                primary=primary_verdict.verdict.value,
                alternative=competitor_verdict.verdict.value,
            ),
            ComparisonCriterion(
                criterion="Risk score",
                primary=str(primary_verdict.risk_score),
                alternative=str(competitor_verdict.risk_score),
            ),
            ComparisonCriterion(
                criterion="Key vulnerabilities",
                primary="; ".join(v.description for v in primary_vulns) or "No vulnerabilities listed.",
                alternative="; ".join(v.description for v in competitor_vulns) or "No vulnerabilities listed.",
            ),
            ComparisonCriterion(
                criterion="Approval conditions",
                primary="; ".join(primary_conditions[:3]) or "No explicit conditions.",
                alternative="; ".join(competitor_conditions[:3]) or "No explicit conditions.",
            ),
            ComparisonCriterion(
                criterion="Evidence depth",
                primary=f"{len(primary_task.messages)} agent messages; {len(primary_verdict.citations)} citations.",
                alternative=f"{len(competitor_task.messages)} agent messages; {len(competitor_verdict.citations)} citations.",
            ),
        ],
        rationale=(
            "This comparison uses two completed Aegis dossiers. Scores are the actual final risk "
            "scores from each analysis, not generated estimates."
        ),
        next_steps=[
            "Review both reasoning chains and citation confidence before committee approval.",
            "Use refinement on either dossier if the comparison exposes missing evidence.",
        ],
    )


@router.post("/api/rooms/{task_id}/compare", response_model=ComparisonData)
async def compare_alternative(task_id: str, body: CompareInput) -> ComparisonData:
    task = task_registry.get_task(task_id)
    verdict = task_registry.get_verdict(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not verdict:
        raise HTTPException(status_code=409, detail="Comparison requires a completed verdict")

    competitor = _find_completed_competitor(body.alternative, body.alternative_task_id)
    if competitor:
        competitor_task, competitor_verdict = competitor
        return _completed_dossier_comparison(task, verdict, competitor_task, competitor_verdict)

    prompt = (
        "You are an investment committee comparison analyst. Compare the completed target "
        "against the proposed alternative using only the supplied Aegis dossier and agent trail. "
        "Do not invent external facts. Estimate the alternative_risk_score based on your knowledge "
        "of the competitor and the context provided.\n\n"
        f"Primary company: {task.company_name}\n"
        f"Alternative company: {body.alternative}\n"
        f"Primary verdict:\n{json.dumps(verdict.model_dump(mode='json'), indent=2)}\n\n"
        f"Agent trail:\n{json.dumps([m.model_dump(mode='json') for m in task.messages], indent=2)[:12000]}\n\n"
        "Return ONLY valid JSON with this exact shape:\n"
        "{\n"
        '  "primary_company": "string",\n'
        '  "alternative_company": "string",\n'
        '  "primary_risk_score": 60,\n'
        '  "alternative_risk_score": null,\n'
        '  "recommendation": "string",\n'
        '  "confidence": 70,\n'
        '  "method": "ai_dossier_comparison",\n'
        '  "criteria": [\n'
        '    {"criterion": "Risk profile", "primary": "string", "alternative": "string"}\n'
        "  ],\n"
        '  "rationale": "string",\n'
        '  "next_steps": ["string"]\n'
        "}"
    )

    try:
        client, _api_used, model = get_client_for_model(
            getattr(task, "preferred_aiml_model", "gpt-4o"), "gpt-4o-mini"
        )
        response = await client.call_completion(prompt, model=model)
        data = json.loads(extract_json_from_response(response))
        data["method"] = data.get("method") or "estimated_competitor_dossier"
        return ComparisonData.model_validate(data)
    except Exception as exc:
        logger.warning("Comparison generation failed for %s: %s", task_id, exc)
        return _fallback_comparison(task, body.alternative)


@router.get("/api/rooms/{task_id}/events")
async def get_events(task_id: str) -> dict[str, Any]:
    task = task_registry.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error="Task not found", code="TASK_NOT_FOUND"
            ).model_dump(),
        )
    events = event_logger.get_events(task_id)
    return {
        "task_id": task_id,
        "events": [e.model_dump() for e in events],
    }


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str) -> None:
    await websocket.accept()
    task = task_registry.get_task(task_id)
    if not task:
        await websocket.send_json(
            {
                "type": "error",
                "message": "Task not found",
                "recoverable": False,
            }
        )
        await websocket.close()
        return

    task_registry.add_ws_connection(task_id, websocket)

    try:
        snapshot = {
            "type": "state_snapshot",
            "task": task.model_dump(mode="json"),
            "agents": [a.model_dump(mode="json") for a in task.agents],
            "messages": [m.model_dump(mode="json") for m in task.messages],
            "verdict": (
                task_registry.get_verdict(task_id).model_dump(mode="json")
                if task_registry.get_verdict(task_id)
                else None
            ),
        }
        await websocket.send_json(snapshot)

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("WebSocket send failed for task %s (client likely disconnected)", task_id)
    finally:
        task_registry.remove_ws_connection(task_id, websocket)
        logger.info("WebSocket disconnected for task %s", task_id)

