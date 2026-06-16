"""Schema validation tests."""

import pytest
from pydantic import ValidationError

from models.schemas import (
    BandMessage,
    BandMessageOutput,
    TaskInput,
    TaskState,
    TaskStatus,
    VerdictData,
)


class TestBandMessageSchema:
    def test_valid_band_message_passes(self, valid_band_message_dict):
        msg = BandMessage(**valid_band_message_dict)
        assert msg.owner == "planner"
        assert msg.output.confidence == 85

    def test_missing_required_field_raises_error(self, valid_band_message_dict):
        incomplete = {
            k: v for k, v in valid_band_message_dict.items() if k != "owner"
        }
        with pytest.raises(ValidationError):
            BandMessage(**incomplete)

    def test_confidence_must_be_0_to_100(self):
        with pytest.raises(ValidationError):
            BandMessageOutput(
                data={}, confidence=150, reasoning="x", api_used="AI/ML API"
            )

    def test_next_handoff_can_be_none(self, valid_band_message_dict):
        no_handoff = valid_band_message_dict.copy()
        no_handoff["next_handoff"] = None
        msg = BandMessage(**no_handoff)
        assert msg.next_handoff is None


class TestVerdictDataSchema:
    def test_valid_verdict_passes(self, valid_verdict_dict):
        verdict = VerdictData(**valid_verdict_dict)
        assert verdict.risk_score == 72

    def test_risk_score_clamped(self):
        verdict = VerdictData(
            risk_score=105,
            verdict="reject",
            summary="test",
            vulnerabilities=[],
            reasoning_chain=[],
        )
        assert verdict.risk_score == 100

    def test_verdict_enum(self):
        for v in ("approve", "caution", "reject"):
            verdict = VerdictData(
                risk_score=50,
                verdict=v,
                summary="test",
                vulnerabilities=[],
                reasoning_chain=[],
            )
            assert verdict.verdict.value == v


class TestTaskState:
    def test_cycle_count_capped_at_2(self):
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        task = TaskState(
            task_id="t1",
            room_id="r1",
            company_name="Test",
            deal_context="Test deal context here",
            risk_tolerance=50,
            analysis_depth="STANDARD",
            status=TaskStatus.CREATED,
            cycle_count=5,
            created_at=now,
            updated_at=now,
        )
        assert task.cycle_count == 2


class TestTaskInput:
    def test_valid_task_input(self, valid_task_input):
        inp = TaskInput(**valid_task_input)
        assert inp.company_name == "Stripe"

    def test_company_name_min_length(self):
        with pytest.raises(ValidationError):
            TaskInput(
                company_name="A",
                deal_context="Valid deal context here",
                risk_tolerance=50,
                analysis_depth="STANDARD",
            )
