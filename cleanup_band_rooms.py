"""Delete all Band chat rooms to free up the 100-room cap."""
import asyncio
import httpx

API_KEY = "band_a_1781458621_OBTJfFUZOA8FTe0bHmU6EgXqnH_W-Ggz"
BASE_URL = "https://app.band.ai"
HEADERS = {"X-API-Key": API_KEY, "Accept": "application/json"}


async def fetch_all_room_ids(client: httpx.AsyncClient) -> list[str]:
    ids = []
    page = 1
    while True:
        r = await client.get(f"{BASE_URL}/api/v1/agent/chats?page={page}", headers=HEADERS)
        data = r.json()
        rooms = data.get("data", [])
        ids.extend(room["id"] for room in rooms)
        total_pages = data.get("metadata", {}).get("total_pages", 1)
        print(f"  Page {page}/{total_pages} — fetched {len(rooms)} rooms")
        if page >= total_pages:
            break
        page += 1
    return ids


async def delete_room(client: httpx.AsyncClient, room_id: str) -> None:
    r = await client.delete(f"{BASE_URL}/api/v1/agent/chats/{room_id}", headers=HEADERS)
    status = "OK" if r.status_code < 400 else f"FAILED ({r.status_code})"
    print(f"  DELETE {room_id} - {status}")


async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Fetching all rooms...")
        room_ids = await fetch_all_room_ids(client)
        print(f"\nFound {len(room_ids)} rooms. Deleting...\n")
        for room_id in room_ids:
            await delete_room(client, room_id)
        print(f"\nDone. Deleted {len(room_ids)} rooms.")


asyncio.run(main())
