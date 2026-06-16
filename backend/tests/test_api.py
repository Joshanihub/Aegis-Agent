"""FastAPI endpoint integration tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from models import state as task_registry


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestAPIEndpoints:
    @pytest.mark.asyncio
    async def test_health(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_post_create_room(self, client, valid_task_input):
        response = await client.post("/api/rooms/create", json=valid_task_input)
        assert response.status_code == 200
        data = response.json()
        assert "room_id" in data
        assert "task_id" in data
        task = task_registry.get_task(data["task_id"])
        assert task is not None

    @pytest.mark.asyncio
    async def test_create_room_validates_fields(self, client):
        response = await client.post(
            "/api/rooms/create",
            json={
                "company_name": "A",
                "deal_context": "short",
                "risk_tolerance": 50,
                "analysis_depth": "STANDARD",
            },
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_status_not_found(self, client):
        response = await client.get("/api/rooms/nonexistent/status")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_verdict_not_ready(self, client, valid_task_input):
        create_resp = await client.post("/api/rooms/create", json=valid_task_input)
        task_id = create_resp.json()["task_id"]
        response = await client.get(f"/api/rooms/{task_id}/verdict")
        assert response.status_code in (404, 200)

    @pytest.mark.asyncio
    async def test_get_events(self, client, valid_task_input):
        create_resp = await client.post("/api/rooms/create", json=valid_task_input)
        task_id = create_resp.json()["task_id"]
        response = await client.get(f"/api/rooms/{task_id}/events")
        assert response.status_code == 200
        assert response.json()["task_id"] == task_id
