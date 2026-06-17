"""FastAPI REST and WebSocket routes."""

from __future__ import annotations

import asyncio
import logging
from typing import Any
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from pydantic import ValidationError

from config import get_settings
from models.schemas import CreateRoomResponse, ErrorResponse, TaskInput, TaskState, RefineInput, TaskStatus, InterveneInput
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
    background_tasks.add_task(_execute_workflow, task)
    return CreateRoomResponse(room_id=task.room_id, task_id=task.task_id)


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
    
    # Clear the old verdict so the UI doesn't immediately redirect
    task_registry.set_verdict(task_id, None)
    
    background_tasks.add_task(_execute_workflow, task)
    return {"status": "refining", "task_id": task_id}


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

