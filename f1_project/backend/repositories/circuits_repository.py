"""Repository Pattern — Data access for circuits and races (Supabase)."""

from database.database import get_supabase

class CircuitsRepository:

    def __init__(self):
        self._db = get_supabase()

    def find_race_by_year_and_round(self, season_year: int, round_num: int) -> dict | None:
        """Return a race joined with its circuit data."""
        response = (
            self._db.table("races")
            .select("*, circuits(*)")
            .eq("season_year", season_year)
            .eq("round", round_num)
            .execute()
        )
        return response.data[0] if response.data else None

    def find_circuit_by_id(self, circuit_id: str) -> dict | None:
        response = (
            self._db.table("circuits")
            .select("*")
            .eq("id", circuit_id)
            .execute()
        )
        return response.data[0] if response.data else None

    def list_races_by_season(self, season_year: int) -> list[dict]:
        response = (
            self._db.table("races")
            .select("*, circuits(*)")
            .eq("season_year", season_year)
            .order("round")
            .execute()
        )
        return response.data if response.data else []

# Module-level singleton
circuits_repo = CircuitsRepository()
