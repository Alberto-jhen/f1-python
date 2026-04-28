"""Repository Pattern — Data access for race replay telemetry (Supabase)."""

from typing import Optional
from database.database import get_supabase


class ReplayRepository:
    """Encapsulates all Supabase queries for the race_replays table."""

    def __init__(self):
        self._db = get_supabase()

    def find_by_session_and_driver(
        self, session_id: str, driver_id: str
    ) -> list[dict]:
        response = (
            self._db.table("race_replays")
            .select("*")
            .eq("session_id", session_id)
            .eq("driver", driver_id)
            .order("timestamp", desc=False)
            .execute()
        )
        return response.data or []

    def session_exists(self, session_id: str) -> bool:
        response = (
            self._db.table("race_replays")
            .select("session_id")
            .eq("session_id", session_id)
            .limit(1)
            .execute()
        )
        return bool(response.data)

    def insert_batch(self, records: list[dict]) -> None:
        self._db.table("race_replays").insert(records).execute()


# Module-level singleton
replay_repo = ReplayRepository()
