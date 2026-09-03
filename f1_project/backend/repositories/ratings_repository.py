"""Repository Pattern — Data access for ratings (Supabase)."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from database.database import get_supabase


class RatingsRepository:

    def __init__(self):
        self._db = get_supabase()

    def create(self, data: dict) -> dict:
        response = (
            self._db.table("ratings")
            .insert(data)
            .execute()
        )
        return response.data[0] if response.data else None

    def get_by_id(self, rating_id: UUID | str) -> dict | None:
        response = (
            self._db.table("ratings")
            .select("*")
            .eq("id", str(rating_id))
            .execute()
        )
        return response.data[0] if response.data else None

    def get_by_profile(self, profile_id: str) -> list[dict]:
        response = (
            self._db.table("ratings")
            .select("*")
            .eq("profile_id", profile_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data if response.data else []

    def get_most_liked_comments(self, limit: int = 10, since: datetime | None = None) -> list[dict]:
        since = since or datetime.now(timezone.utc) - timedelta(weeks=1)
        response = (
            self._db.table("ratings")
            .select("*")
            .gte("created_at", since.isoformat())
            .order("likes", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data if response.data else []

    def update(self, rating_id: UUID | str, data: dict) -> dict | None:
        response = (
            self._db.table("ratings")
            .update(data)
            .eq("id", str(rating_id))
            .execute()
        )
        return response.data[0] if response.data else None

    def delete(self, rating_id: UUID | str) -> dict | None:
        response = (
            self._db.table("ratings")
            .delete()
            .eq("id", str(rating_id))
            .execute()
        )
        return response.data[0] if response.data else None

    def increment_likes(self, rating_id: UUID | str) -> dict | None:
        current = self.get_by_id(rating_id)
        if not current:
            return None
        new_likes = (current.get("likes") or 0) + 1
        return self.update(rating_id, {"likes": new_likes})


# Module-level singleton
ratings_repo = RatingsRepository()
