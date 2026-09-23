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

    def get_all(
        self,
        race_id: int | None = None,
        sort_by: str = "likes",
        limit: int = 20,
        since: datetime | None = None,
        current_profile_id: str | None = None,
    ) -> list[dict]:
        query = self._db.table("ratings").select("*")
        if race_id is not None:
            query = query.eq("race_id", race_id)
        if since is not None:
            query = query.gte("created_at", since.isoformat())
        if sort_by == "newest":
            query = query.order("created_at", desc=True)
        else:
            query = query.order("likes", desc=True).order("created_at", desc=True)
        response = query.limit(limit).execute()
        return self._enrich(response.data or [], current_profile_id)

    def get_by_profile(
        self,
        profile_id: str,
        race_id: int | None = None,
        current_profile_id: str | None = None,
    ) -> list[dict]:
        query = (
            self._db.table("ratings")
            .select("*")
            .eq("profile_id", profile_id)
            .order("created_at", desc=True)
        )
        if race_id is not None:
            query = query.eq("race_id", race_id)
        response = query.execute()
        return self._enrich(response.data or [], current_profile_id)

    def get_most_liked_comments(
        self,
        limit: int = 10,
        since: datetime | None = None,
        race_id: int | None = None,
        current_profile_id: str | None = None,
    ) -> list[dict]:
        since = since or datetime.now(timezone.utc) - timedelta(weeks=1)
        return self.get_all(
            race_id=race_id,
            sort_by="likes",
            limit=limit,
            since=since,
            current_profile_id=current_profile_id,
        )

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

    def has_liked(self, profile_id: str, rating_id: UUID | str) -> bool:
        response = (
            self._db.table("rating_likes")
            .select("*", count="exact")
            .eq("profile_id", profile_id)
            .eq("rating_id", str(rating_id))
            .execute()
        )
        return (response.count or 0) > 0

    def add_like(self, profile_id: str, rating_id: UUID | str) -> dict | None:
        existing = self.get_by_id(rating_id)
        if not existing:
            return None
        if self.has_liked(profile_id, rating_id):
            return self._enrich([existing], profile_id)[0]
        try:
            self._db.table("rating_likes").insert({
                "profile_id": profile_id,
                "rating_id": str(rating_id),
            }).execute()
        except Exception as e:
            print(f"Error inserting like: {e}")
            return self._enrich([self.get_by_id(rating_id)], profile_id)[0]

        current = self.get_by_id(rating_id)
        if current:
            new_likes = (current.get("likes") or 0) + 1
            updated = self.update(rating_id, {"likes": new_likes})
            return self._enrich([updated], profile_id)[0] if updated else None
        return None

    def remove_like(self, profile_id: str, rating_id: UUID | str) -> dict | None:
        response = (
            self._db.table("rating_likes")
            .delete()
            .eq("profile_id", profile_id)
            .eq("rating_id", str(rating_id))
            .execute()
        )
        existing = self.get_by_id(rating_id)
        if not existing:
            return None
        if not response.data:
            return self._enrich([existing], profile_id)[0]

        current = self.get_by_id(rating_id)
        if current:
            new_likes = max((current.get("likes") or 0) - 1, 0)
            updated = self.update(rating_id, {"likes": new_likes})
            return self._enrich([updated], profile_id)[0] if updated else None
        return None

    # ──────────────────────────────────────────────
    # Enrichment helpers
    # ──────────────────────────────────────────────

    def _enrich(self, rows: list[dict], current_profile_id: str | None) -> list[dict]:
        if not rows:
            return []

        profile_ids = {row["profile_id"] for row in rows}
        race_ids = {row["race_id"] for row in rows}
        rating_ids = {row["id"] for row in rows}

        profiles = self._get_profiles_by_ids(profile_ids)
        races = self._get_races_by_ids(race_ids)
        liked_by_me = set()
        if current_profile_id:
            liked_by_me = self._get_liked_by_me(rating_ids, current_profile_id)

        for row in rows:
            row["profile"] = profiles.get(row["profile_id"])
            row["race"] = races.get(row["race_id"])
            row["likes"] = row.get("likes", 0) or 0
            row["liked_by_me"] = row["id"] in liked_by_me
        return rows

    def _get_profiles_by_ids(self, profile_ids: set) -> dict:
        if not profile_ids:
            return {}
        response = (
            self._db.table("profiles")
            .select("id, username, full_name, avatar_url")
            .in_("id", list(profile_ids))
            .execute()
        )
        return {p["id"]: p for p in response.data or []}

    def _get_races_by_ids(self, race_ids: set) -> dict:
        if not race_ids:
            return {}
        response = (
            self._db.table("races")
            .select("id, season_year, round, race_date, circuit_id")
            .in_("id", list(race_ids))
            .execute()
        )
        rows = response.data or []
        circuit_ids = {row.get("circuit_id") for row in rows if row.get("circuit_id")}
        circuit_names = {}
        if circuit_ids:
            circuits_response = (
                self._db.table("circuits")
                .select("id, name")
                .in_("id", list(circuit_ids))
                .execute()
            )
            circuit_names = {c["id"]: c.get("name") for c in circuits_response.data or []}
        return {
            row["id"]: {
                "id": row["id"],
                "season_year": row.get("season_year"),
                "round": row.get("round"),
                "race_date": row.get("race_date"),
                "circuit_name": circuit_names.get(row.get("circuit_id")),
            }
            for row in rows
        }

    def _get_liked_by_me(self, rating_ids: set, profile_id: str) -> set:
        response = (
            self._db.table("rating_likes")
            .select("rating_id")
            .eq("profile_id", profile_id)
            .in_("rating_id", list(rating_ids))
            .execute()
        )
        return {row["rating_id"] for row in response.data or []}


# Module-level singleton
ratings_repo = RatingsRepository()
