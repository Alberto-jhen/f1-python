"""Repository Pattern — Data access for race replay telemetry (Supabase)."""

from typing import Optional
from database.database import get_supabase


class ReplayRepository:
    """Encapsulates all Supabase queries for the race_replays table."""

    def __init__(self):
        self._db = get_supabase()

    def find_by_session_and_driver(
        self, session_id: str, driver_id: str = None, start_time: float = None, end_time: float = None
    ) -> list[dict]:
        
        # Initialize query only with the session data.
        query = self._db.table("race_replays").select("*").eq("session_id", session_id)
        
        # Only filter by driver if theres actually 1 requested.
        if driver_id:
            query = query.eq("driver", driver_id)
            
        # Appy timeouts filter
        if start_time is not None:
            query = query.gte("timestamp", start_time)
        if end_time is not None:
            query = query.lte("timestamp", end_time)

        # --- INCREASE POSTGREST DATA TRANSFER LIMIT ---
        response = query.order("timestamp", desc=False).limit(20000).execute()

        return response.data or []

    def delete_by_session(self, session_id: str) -> None:
        self._db.table("race_replays").delete().eq("session_id", session_id).execute()

    def get_session_bounds(self, session_id: str) -> dict:
        # Fetch the min and max timestamp using order and limit
        min_res = (
            self._db.table("race_replays")
            .select("timestamp")
            .eq("session_id", session_id)
            .order("timestamp", desc=False)
            .limit(1)
            .execute()
        )
        max_res = (
            self._db.table("race_replays")
            .select("timestamp")
            .eq("session_id", session_id)
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )
        
        start_time = min_res.data[0]["timestamp"] if min_res.data else 0.0
        end_time = max_res.data[0]["timestamp"] if max_res.data else 0.0
        
        return {
            "start_time": start_time,
            "end_time": end_time
        }

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
