"""Repository Pattern — Data access for seasonal circuits info (Supabase)."""

from database.database import get_supabase

class CircuitsRepository:
    
    def __init__(self):
        self._db = get_supabase()

    def find_by_year_and_round(self, season_year: int, round_num: int) -> dict:
        response = (
            self._db.table("season_circuits")
            .select("*")
            .eq("season_year", season_year)
            .eq("round", round_num)
            .execute()
        )
        return response.data[0] if response.data else None

# Module-level singleton
circuits_repo = CircuitsRepository()