"""Business logic for circuits information stored in database."""

from repositories.circuits_repository import circuits_repo
from core.schemas import CircuitInfo
import os

class CircuitsService:
    def __init__(self):
        self._repo = circuits_repo
        project_url = os.getenv("SUPABASE_URL", "")
        self._base_bucket_url = f"{project_url}/storage/v1/object/public/circuit-posters/"

    def get_circuit_details(self, season_year: int, round_num: int) -> CircuitInfo:
        db_data = self._repo.find_by_year_and_round(season_year, round_num)
        
        if not db_data:
            return None
            
        poster_filename = db_data.get("poster_url")
        full_poster_url = f"{self._base_bucket_url}{poster_filename}" if poster_filename else None
        
        return CircuitInfo(
            season_year=db_data["season_year"],
            name=db_data["name"],
            round=db_data["round"],
            race_date=db_data["race_date"],
            description=db_data["description"],
            length_km=db_data["length_km"],
            lap_record=db_data["lap_record"],
            total_laps=db_data["total_laps"],
            poster_url=full_poster_url
        )

circuits_service = CircuitsService()