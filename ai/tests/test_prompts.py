import pytest
from ai.prompts.planner_prompt import PlannerAgent
from ai.prompts.analyst_prompt import AnalystAgent
from ai.prompts.reviewer_prompt import ReviewerAgent
from ai.prompts.finalizer_prompt import FinalizerAgent

@pytest.mark.asyncio
async def test_planner_agent():
    agent = PlannerAgent()
    res = await agent.run({"company_name": "Stripe", "deal_context": "VC test"})
    assert res["status"] in ["completed", "error"]
    assert "output" in res

@pytest.mark.asyncio
async def test_analyst_agent():
    agent = AnalystAgent()
    res = await agent.run({"subtasks": [{"id": "1"}]})
    assert res["status"] in ["completed", "error"]
    assert "output" in res

@pytest.mark.asyncio
async def test_reviewer_agent():
    agent = ReviewerAgent()
    res = await agent.run({"findings": [{"subtask_id": "1"}], "overall_confidence": 80})
    assert res["status"] in ["completed", "needs-review", "error"]
    assert "output" in res

@pytest.mark.asyncio
async def test_finalizer_agent():
    agent = FinalizerAgent()
    res = await agent.run({"reviewer_output": {"risk_score": 50, "approved": True}})
    assert res["status"] in ["completed", "error"]
    assert "output" in res
