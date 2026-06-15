"""Pydantic schemas for Aegis Agent backend."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class TaskStatus(str, Enum):
    CREATED = "created"
    PLANNING = "planning"
    ANALYZING = "analyzing"
    REVIEWING = "reviewing"
    FINALIZING = "finalizing"
    COMPLETE = "complete"
    ERROR = "error"


class AgentStatus(str, Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    AWAITING = "awaiting"
    COMPLETE = "complete"
    ERROR = "error"


class AnalysisDepth(str, Enum):
    SURFACE = "SURFACE"
    STANDARD = "STANDARD"
    DEEP = "DEEP"


class MessageStatus(str, Enum):
    COMPLETED = "completed"
    NEEDS_REVIEW = "needs-review"
    ERROR = "error"


class VerdictType(str, Enum):
    APPROVE = "approve"
    CAUTION = "caution"
    REJECT = "reject"


class BandMessageOutput(BaseModel):
    data: dict[str, Any]
    confidence: int = Field(ge=0, le=100)
    reasoning: str
    api_used: str


class NextHandoff(BaseModel):
    agent: str
    reason: str


class BandMessage(BaseModel):
    owner: str
    task: str
    context: str
    action: str
    output: BandMessageOutput
    status: str
    next_handoff: Optional[NextHandoff] = None
    metadata: dict[str, Any]

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {s.value for s in MessageStatus}
        if value not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return value


class AgentState(BaseModel):
    agent_id: str
    name: str
    role: str
    status: AgentStatus
    last_action: str = ""
    api_used: str = ""
    confidence: int = Field(default=0, ge=0, le=100)
    updated_at: datetime


class TaskInput(BaseModel):
    company_name: str = Field(min_length=2)
    deal_context: str = Field(min_length=10)
    risk_tolerance: int = Field(ge=0, le=100)
    analysis_depth: AnalysisDepth
    preferred_model: str = "gpt-4o"


class CreateRoomResponse(BaseModel):
    room_id: str
    task_id: str


class RefineInput(BaseModel):
    new_criteria: str = Field(min_length=2)


class InterveneInput(BaseModel):
    guidance: str = Field(min_length=2)


class Vulnerability(BaseModel):
    description: str
    severity: str
    details: str = ""


class ReasoningStep(BaseModel):
    agent: str
    api: str
    confidence: int = Field(ge=0, le=100)
    reasoning: Optional[str] = None


class VerdictData(BaseModel):
    risk_score: int
    verdict: VerdictType
    summary: str
    vulnerabilities: list[Vulnerability]
    reasoning_chain: list[ReasoningStep]
    historical_context: Optional[str] = None
    future_path: Optional[str] = None
    competitive_alternatives: Optional[list[str]] = None
    conditions: Optional[list[str]] = None

    @field_validator("risk_score")
    @classmethod
    def clamp_risk_score(cls, value: int) -> int:
        return max(0, min(100, value))


class TaskState(BaseModel):
    task_id: str
    room_id: str
    company_name: str
    deal_context: str
    risk_tolerance: int
    analysis_depth: str
    preferred_model: str = "gpt-4o"
    status: TaskStatus
    current_agent: Optional[str] = None
    cycle_count: int = Field(default=0, ge=0)
    messages: list[BandMessage] = Field(default_factory=list)
    agents: list[AgentState] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @field_validator("cycle_count")
    @classmethod
    def enforce_max_cycles(cls, value: int) -> int:
        return min(value, 2)


class EventLogEntry(BaseModel):
    timestamp: str
    agent_id: str
    action: str
    api_used: str
    details: dict[str, Any] = Field(default_factory=dict)
    duration_ms: int = 0


class ErrorResponse(BaseModel):
    error: str
    code: str
