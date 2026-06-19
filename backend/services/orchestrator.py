"""Workflow orchestrator — coordinates agents and Band room."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine
from pathlib import Path
import PyPDF2

from models.schemas import (
    AgentStatus,
    BandMessage,
    Citation,
    ReasoningStep,
    TaskState,
    TaskStatus,
    VerdictData,
    VerdictType,
    Vulnerability,
)
from models import state as task_registry
from services.band_service import BandService
from services.event_logger import event_logger
from services.room_service import AGENT_DEFINITIONS, broadcast_to_task

logger = logging.getLogger(__name__)

WsBroadcast = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]

MAX_REVIEW_CYCLES = 2
HUMAN_REVIEW_RISK_THRESHOLD = 80

AGENT_STATUS_MAP: dict[str, TaskStatus] = {
    "planner": TaskStatus.PLANNING,
    "analyst": TaskStatus.ANALYZING,
    "reviewer": TaskStatus.REVIEWING,
    "finalizer": TaskStatus.FINALIZING,
}


class AgentError(Exception):
    """Raised when an agent fails to produce valid output."""


class WorkflowCancelled(Exception):
    """Raised when a user cancels an active workflow."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _raise_if_cancelled(
    task: TaskState, ws_broadcast: WsBroadcast, band: BandService
) -> None:
    if not task_registry.is_cancelled(task.task_id):
        return

    task.status = TaskStatus.CANCELLED
    task.current_agent = None
    task.updated_at = _now()
    task_registry.update_task(task)
    await ws_broadcast(
        {
            "type": "workflow_cancelled",
            "task": task.model_dump(mode="json"),
        }
    )
    try:
        await band.close_room(task.room_id)
    finally:
        raise WorkflowCancelled()


def _extract_text_from_documents(document_ids: list[str]) -> str:
    if not document_ids:
        return ""

    extracted_texts = []
    upload_dir = Path("data/uploads")

    for file_id in document_ids:
        matched_files = list(upload_dir.glob(f"{file_id}_*"))
        if not matched_files:
            continue

        file_path = matched_files[0]
        text_content = ""

        try:
            if file_path.suffix.lower() == ".pdf":
                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_content += page_text + "\n"
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text_content = f.read()

            if text_content:
                extracted_texts.append(f"--- Document: {file_path.name} ---\n{text_content[:20000]}")
        except Exception as e:
            logger.warning("Failed to extract text from %s: %s", file_path, e)

    if not extracted_texts:
        return ""

    return "\n\n" + "\n\n".join(extracted_texts)


def _update_agent_status(
    task: TaskState, agent_id: str, status: AgentStatus, last_action: str = ""
) -> None:
    for agent in task.agents:
        if agent.agent_id == agent_id:
            agent.status = status
            agent.last_action = last_action or agent.last_action
            agent.updated_at = _now()
            break
    task.updated_at = _now()
    task_registry.update_task(task)


async def _emit_agent_status(
    task: TaskState,
    agent_id: str,
    status: AgentStatus,
    last_action: str,
    ws_broadcast: WsBroadcast,
) -> None:
    _update_agent_status(task, agent_id, status, last_action)
    await ws_broadcast(
        {
            "type": "agent_status_changed",
            "agent_id": agent_id,
            "status": status.value,
            "last_action": last_action,
        }
    )


async def _run_agent_with_retry(
    agent_wrapper: Any,
    input_data: dict[str, Any],
    agent_id: str,
    task_id: str,
    ws_broadcast: WsBroadcast,
) -> BandMessage:
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            result = await agent_wrapper.run(input_data)
            if isinstance(result, dict):
                return BandMessage.model_validate(result)
            return result
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Agent %s attempt %d failed: %s", agent_id, attempt + 1, exc
            )
            event_logger.log(
                task_id=task_id,
                agent_id=agent_id,
                action="retry" if attempt == 0 else "error",
                api_used="",
                details={"error": str(exc), "attempt": attempt + 1},
            )
            if attempt == 0:
                continue
            await ws_broadcast(
                {
                    "type": "error",
                    "message": f"Agent {agent_id} failed after retry: {exc}",
                    "recoverable": False,
                }
            )
            raise AgentError(str(exc)) from exc

    raise AgentError(str(last_error))


def _extract_verdict(finalizer_msg: BandMessage, all_messages: list[BandMessage]) -> VerdictData:
    data = finalizer_msg.output.data
    reasoning_chain = [
        ReasoningStep(
            agent=msg.owner,
            api=msg.output.api_used,
            confidence=msg.output.confidence,
            reasoning=msg.output.reasoning,
        )
        for msg in all_messages
    ]

    vulnerabilities_raw = data.get("key_vulnerabilities") or data.get(
        "vulnerabilities", []
    )
    vulnerabilities = []
    for item in vulnerabilities_raw:
        if isinstance(item, dict):
            vulnerabilities.append(
                Vulnerability(
                    description=item.get("description", str(item)),
                    severity=item.get("severity", "MEDIUM"),
                    details=item.get("details", "")
                )
            )
        else:
            vulnerabilities.append(
                Vulnerability(description=str(item), severity="MEDIUM", details="")
            )

    citations = []
    for item in data.get("citations", []):
        if isinstance(item, dict):
            citations.append(
                Citation(
                    id=str(item.get("id", f"src-{len(citations) + 1}")),
                    source_document=str(item.get("source_document", "Agent evidence")),
                    snippet=str(item.get("snippet", "")),
                    relevance=str(item.get("relevance", "")),
                    confidence=int(item.get("confidence", 80)),
                )
            )

    risk_score = int(data.get("risk_score", 50))
    verdict_str = data.get("verdict", "caution")
    if verdict_str not in ("approve", "caution", "reject"):
        if risk_score <= 33:
            verdict_str = "approve"
        elif risk_score <= 66:
            verdict_str = "caution"
        else:
            verdict_str = "reject"

    return VerdictData(
        risk_score=max(0, min(100, risk_score)),
        verdict=VerdictType(verdict_str),
        summary=data.get("executive_summary") or data.get("summary", ""),
        vulnerabilities=vulnerabilities,
        reasoning_chain=reasoning_chain,
        citations=citations,
        historical_context=data.get("historical_context"),
        future_path=data.get("future_path"),
        competitive_alternatives=data.get("competitive_alternatives"),
        conditions=data.get("conditions"),
    )


async def run_workflow(
    task: TaskState,
    ws_broadcast: WsBroadcast,
    band_service: BandService | None = None,
    agents: dict[str, Any] | None = None,
) -> VerdictData:
    """Execute the full Planner → Analyst → Reviewer → Finalizer pipeline."""
    from agents.planner import PlannerAgentWrapper
    from agents.analyst import AnalystAgentWrapper
    from agents.reviewer import ReviewerAgentWrapper
    from agents.finalizer import FinalizerAgentWrapper

    band = band_service or BandService()
    agent_map = agents or {
        "planner": PlannerAgentWrapper(),
        "analyst": AnalystAgentWrapper(),
        "reviewer": ReviewerAgentWrapper(),
        "finalizer": FinalizerAgentWrapper(),
    }

    task_id = task.task_id
    all_messages: list[BandMessage] = []

    try:
        task_registry.clear_cancel(task_id)
        room_id = await band.create_room(task_id)
        task.room_id = room_id
        agent_ids = list(band.get_agent_ids().values())
        await band.add_participants(room_id, agent_ids)

        for defn in AGENT_DEFINITIONS:
            await _emit_agent_status(
                task, defn["agent_id"], AgentStatus.IDLE, "Standing by", ws_broadcast
            )

        base_input = {
            "company_name": task.company_name,
            "deal_context": task.deal_context,
            "risk_tolerance": task.risk_tolerance,
            "analysis_depth": task.analysis_depth,
            "persona": getattr(task, "persona", "Standard Analyst"),
            "preferred_model": getattr(task, "preferred_model", "gpt-4o"),
            "task_id": task_id,
            "room_id": room_id,
        }

        doc_context = _extract_text_from_documents(getattr(task, "document_ids", []))
        if doc_context:
            base_input["deal_context"] += f"\n\n[UPLOADED DOCUMENTS EXTRACTED CONTEXT]:\n{doc_context}"

        # --- Context Compression (Only if refining an existing task) ---
        # Only run compressor if this is a refinement (indicated by [REFINEMENT CRITERIA] in deal_context)
        if "[REFINEMENT CRITERIA]:" in task.deal_context and len(task.messages) > 0:
            from agents.compressor import CompressorAgent
            compressor = CompressorAgent()

            await _emit_agent_status(
                task, "planner", AgentStatus.PROCESSING, "Compressing historical context...", ws_broadcast
            )

            compressor_input = {
                "task_id": task_id,
                "messages": [m.model_dump() for m in task.messages],
                "new_criteria": task.deal_context.split("[REFINEMENT CRITERIA]:")[-1].strip() if "[REFINEMENT CRITERIA]:" in task.deal_context else ""
            }

            compressor_msg = await _run_agent_with_retry(
                compressor, compressor_input, "compressor", task_id, ws_broadcast
            )

            if compressor_msg.status != "error":
                # Use the compressed context instead of the full deal context to save tokens
                compressed_ctx = compressor_msg.output.data.get("compressed_context", "")
                base_input["deal_context"] = f"COMPRESSED HISTORY: {compressed_ctx}\n\nNEW REFINEMENT: {compressor_input['new_criteria']}"
            else:
                # Fallback to appending criteria if compression fails
                base_input["deal_context"] = f"{task.deal_context}\n\n[REFINEMENT CRITERIA]: {compressor_input['new_criteria']}"

            all_messages.append(compressor_msg)
            task.messages.append(compressor_msg)
            await ws_broadcast({"type": "band_message", "message": compressor_msg.model_dump()})

        # --- Planner ---
        await _raise_if_cancelled(task, ws_broadcast, band)
        t = task_registry.get_task(task_id)
        if t: base_input["deal_context"] = t.deal_context

        task.status = TaskStatus.PLANNING
        task.current_agent = "planner"
        task_registry.update_task(task)
        await _emit_agent_status(
            task, "planner", AgentStatus.PROCESSING, "Decomposing investment thesis", ws_broadcast
        )
        planner_msg = await _run_agent_with_retry(
            agent_map["planner"], base_input, "planner", task_id, ws_broadcast
        )
        await band.send_message(room_id, band.get_agent_ids()["planner"], planner_msg)
        all_messages.append(planner_msg)
        task.messages.append(planner_msg)
        _update_agent_status(
            task, "planner", AgentStatus.COMPLETE, planner_msg.action
        )
        task.agents[0].api_used = planner_msg.output.api_used
        task.agents[0].confidence = planner_msg.output.confidence
        await ws_broadcast({"type": "band_message", "message": planner_msg.model_dump()})
        await _emit_agent_status(
            task, "planner", AgentStatus.COMPLETE, planner_msg.action, ws_broadcast
        )
        await _raise_if_cancelled(task, ws_broadcast, band)

        analyst_input = {**planner_msg.output.data, **base_input}

        # --- Reviewer loop (Analyst → Reviewer, max 2 cycles) ---
        reviewer_msg: BandMessage | None = None
        while task.cycle_count < MAX_REVIEW_CYCLES:
            await _raise_if_cancelled(task, ws_broadcast, band)
            t = task_registry.get_task(task_id)
            if t: base_input["deal_context"] = t.deal_context
            analyst_input["deal_context"] = base_input["deal_context"]

            # Analyst
            task.status = TaskStatus.ANALYZING
            task.current_agent = "analyst"
            task_registry.update_task(task)
            await _emit_agent_status(
                task,
                "analyst",
                AgentStatus.PROCESSING,
                f"Synthesizing data (cycle {task.cycle_count + 1})",
                ws_broadcast,
            )
            analyst_msg = await _run_agent_with_retry(
                agent_map["analyst"],
                {**analyst_input, "task_id": task_id, "room_id": room_id},
                "analyst",
                task_id,
                ws_broadcast,
            )
            await band.send_message(room_id, band.get_agent_ids()["analyst"], analyst_msg)
            all_messages.append(analyst_msg)
            task.messages.append(analyst_msg)
            for agent in task.agents:
                if agent.agent_id == "analyst":
                    agent.api_used = analyst_msg.output.api_used
                    agent.confidence = analyst_msg.output.confidence
            await ws_broadcast(
                {"type": "band_message", "message": analyst_msg.model_dump()}
            )
            await _emit_agent_status(
                task, "analyst", AgentStatus.COMPLETE, analyst_msg.action, ws_broadcast
            )
            await _raise_if_cancelled(task, ws_broadcast, band)

            # Reviewer
            t = task_registry.get_task(task_id)
            if t: base_input["deal_context"] = t.deal_context

            task.status = TaskStatus.REVIEWING
            task.current_agent = "reviewer"
            task_registry.update_task(task)
            await _emit_agent_status(
                task,
                "reviewer",
                AgentStatus.PROCESSING,
                "Validating findings",
                ws_broadcast,
            )
            reviewer_msg = await _run_agent_with_retry(
                agent_map["reviewer"],
                {
                    **base_input,
                    **analyst_msg.output.data,
                    "analyst_output": analyst_msg.output.data,
                    "cycle": task.cycle_count + 1,
                    "task_id": task_id,
                    "room_id": room_id,
                },
                "reviewer",
                task_id,
                ws_broadcast,
            )
            await band.send_message(
                room_id, band.get_agent_ids()["reviewer"], reviewer_msg
            )
            all_messages.append(reviewer_msg)
            task.messages.append(reviewer_msg)
            for agent in task.agents:
                if agent.agent_id == "reviewer":
                    agent.api_used = reviewer_msg.output.api_used
                    agent.confidence = reviewer_msg.output.confidence
            await ws_broadcast(
                {"type": "band_message", "message": reviewer_msg.model_dump()}
            )
            await _emit_agent_status(
                task, "reviewer", AgentStatus.COMPLETE, reviewer_msg.action, ws_broadcast
            )
            await _raise_if_cancelled(task, ws_broadcast, band)

            if reviewer_msg.status != "needs-review":
                break

            feedback = reviewer_msg.output.data.get("feedback_to_analyst", "Findings require human oversight.")
            risk_score = reviewer_msg.output.data.get("risk_score", 50)

            # Normal reviewer objections should loop back to the Analyst.
            # Pause for a human only when risk is truly severe.
            if risk_score >= HUMAN_REVIEW_RISK_THRESHOLD:
                # --- Human-in-the-Loop Pause ---
                await _emit_agent_status(
                    task, "reviewer", AgentStatus.AWAITING, "Awaiting human intervention", ws_broadcast
                )
                await ws_broadcast({
                    "type": "human_input_required",
                    "message": f"The Reviewer agent has flagged findings that require your oversight before proceeding.\n\nRISK SCORE: {risk_score}\nFLAGGED CONTEXT:\n{feedback}"
                })

                intervention_event = task_registry.get_intervention_event(task_id)
                intervention_event.clear()
                await intervention_event.wait()
                await _raise_if_cancelled(task, ws_broadcast, band)

                await _emit_agent_status(
                    task, "reviewer", AgentStatus.PROCESSING, "Resuming after intervention", ws_broadcast
                )
                # --------------------------------

            task.cycle_count += 1
            if task.cycle_count >= MAX_REVIEW_CYCLES:
                break

            analyst_input = {
                **analyst_input,
                "reviewer_feedback": feedback,
                "cycle": task.cycle_count + 1,
            }
            event_logger.log(
                task_id=task_id,
                agent_id="reviewer",
                action="handoff",
                api_used="Featherless AI",
                details={"cycle": task.cycle_count, "feedback": feedback},
            )

        if reviewer_msg is None:
            raise AgentError("Reviewer did not produce output")

        # --- Finalizer ---
        await _raise_if_cancelled(task, ws_broadcast, band)
        t = task_registry.get_task(task_id)
        if t: base_input["deal_context"] = t.deal_context

        task.status = TaskStatus.FINALIZING
        task.current_agent = "finalizer"
        task_registry.update_task(task)
        await _emit_agent_status(
            task,
            "finalizer",
            AgentStatus.PROCESSING,
            "Compiling executive dossier",
            ws_broadcast,
        )
        finalizer_input = {
            "reviewer_output": reviewer_msg.model_dump(),
            "all_messages": [m.model_dump() for m in all_messages],
            **base_input,
        }
        finalizer_msg = await _run_agent_with_retry(
            agent_map["finalizer"],
            finalizer_input,
            "finalizer",
            task_id,
            ws_broadcast,
        )
        await band.send_message(
            room_id, band.get_agent_ids()["finalizer"], finalizer_msg
        )
        all_messages.append(finalizer_msg)
        task.messages.append(finalizer_msg)
        for agent in task.agents:
            if agent.agent_id == "finalizer":
                agent.api_used = finalizer_msg.output.api_used
                agent.confidence = finalizer_msg.output.confidence
        await ws_broadcast(
            {"type": "band_message", "message": finalizer_msg.model_dump()}
        )
        await _emit_agent_status(
            task, "finalizer", AgentStatus.COMPLETE, finalizer_msg.action, ws_broadcast
        )
        await _raise_if_cancelled(task, ws_broadcast, band)

        verdict = _extract_verdict(finalizer_msg, all_messages)
        task.status = TaskStatus.COMPLETE
        task.current_agent = None
        task.updated_at = _now()
        task_registry.update_task(task)
        task_registry.set_verdict(task_id, verdict)

        await ws_broadcast({"type": "verdict_ready", "verdict": verdict.model_dump()})
        await band.close_room(room_id)
        await event_logger.flush_to_file(task_id)

        return verdict

    except WorkflowCancelled:
        return VerdictData(
            risk_score=0,
            verdict=VerdictType.CAUTION,
            summary="Workflow cancelled before a final verdict was produced.",
            vulnerabilities=[],
            reasoning_chain=[],
        )
    except AgentError:
        task.status = TaskStatus.ERROR
        task_registry.update_task(task)
        await band.close_room(task.room_id)
        raise
    except Exception as exc:
        task.status = TaskStatus.ERROR
        task_registry.update_task(task)
        await ws_broadcast(
            {
                "type": "error",
                "message": str(exc),
                "recoverable": False,
            }
        )
        try:
            await band.close_room(task.room_id)
        except Exception:
            logger.exception("Failed to close room after error")
        raise
