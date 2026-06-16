"""BandService tests with mocked HTTP."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from models.schemas import BandMessage, BandMessageOutput
from services.band_service import (
    BandConnectionError,
    BandRoomError,
    BandService,
)


@pytest.fixture
def mock_credentials():
    from config import AgentCredentials

    return {
        role: AgentCredentials(agent_id=f"{role}-uuid", api_key=f"{role}-key")
        for role in ("planner", "analyst", "reviewer", "finalizer")
    }


@pytest.fixture
def band_service(mock_credentials):
    return BandService(credentials=mock_credentials, mock_mode=True)


@pytest.fixture
def sample_message():
    return BandMessage(
        owner="planner",
        task="Test task",
        context="Test context",
        action="Test action",
        output=BandMessageOutput(
            data={"key": "value"},
            confidence=80,
            reasoning="Test reasoning",
            api_used="AI/ML API",
        ),
        status="completed",
        next_handoff=None,
        metadata={
            "task_id": "task-001",
            "room_id": "room-001",
            "timestamp": "2026-06-14T10:00:00Z",
            "cycle": 1,
        },
    )


class TestBandServiceMock:
    @pytest.mark.asyncio
    async def test_create_room_returns_room_id(self, band_service):
        room_id = await band_service.create_room("task-001")
        assert room_id.startswith("room-")

    @pytest.mark.asyncio
    async def test_add_participants(self, band_service):
        room_id = await band_service.create_room("task-001")
        agent_ids = ["a1", "a2", "a3", "a4"]
        await band_service.add_participants(room_id, agent_ids)
        participants = await band_service.get_participants(room_id)
        assert len(participants) == 4

    @pytest.mark.asyncio
    async def test_send_message(self, band_service, sample_message):
        room_id = await band_service.create_room("task-001")
        await band_service.send_message(room_id, "planner-uuid", sample_message)
        messages = []
        async for msg in band_service.listen_for_messages(room_id):
            messages.append(msg)
        assert len(messages) == 1
        assert messages[0].owner == "planner"

    @pytest.mark.asyncio
    async def test_close_room(self, band_service):
        room_id = await band_service.create_room("task-001")
        await band_service.close_room(room_id)


class TestBandServiceRetry:
    @pytest.mark.asyncio
    async def test_retry_on_transient_failure(self, mock_credentials):
        service = BandService(credentials=mock_credentials, mock_mode=False)
        call_count = 0

        async def flaky(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise httpx.ConnectError("transient")
            mock_response = MagicMock()
            mock_response.json.return_value = {"data": {"id": "room-real-001"}}
            mock_response.raise_for_status = MagicMock()
            return mock_response

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post = flaky
            mock_client_cls.return_value = mock_client

            with patch("asyncio.sleep", new_callable=AsyncMock):
                room_id = await service.create_room("task-retry")
                assert room_id == "room-real-001"
                assert call_count == 3

    @pytest.mark.asyncio
    async def test_raises_band_connection_error_on_auth_failure(
        self, mock_credentials
    ):
        service = BandService(credentials=mock_credentials, mock_mode=False)

        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Unauthorized",
            request=MagicMock(),
            response=mock_response,
        )

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post.return_value = mock_response
            mock_client_cls.return_value = mock_client

            with pytest.raises(BandConnectionError):
                await service.create_room("task-auth-fail")
