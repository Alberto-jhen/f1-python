"""Business logic for circuits and races stored in database."""

import os

from repositories.circuits_repository import circuits_repo
from core.schemas import CircuitInfo


class CircuitsService:
    def __init__(self):
        self._repo = circuits_repo
        project_url = os.getenv("SUPABASE_URL", "")
        self._base_bucket_url = f"{project_url}/storage/v1/object/public/circuit-posters/"

    def _build_poster_url(self, poster_filename: str | None) -> str | None:
        if not poster_filename:
            return None
        return f"{self._base_bucket_url}{poster_filename}"

    def _circuit_info_from_race(self, race_data: dict) -> CircuitInfo | None:
        if not race_data:
            return None

        circuit = race_data.get("circuits") or {}
        return CircuitInfo(
            season_year=race_data["season_year"],
            name=circuit.get("name"),
            round=race_data["round"],
            race_date=race_data["race_date"],
            description=circuit.get("description"),
            length_km=circuit.get("length_km"),
            lap_record=circuit.get("lap_record"),
            total_laps=circuit.get("total_laps"),
            poster_url=self._build_poster_url(circuit.get("poster_url")),
        )

    def get_circuit_details(self, season_year: int, round_num: int) -> CircuitInfo | None:
        race_data = self._repo.find_race_by_year_and_round(season_year, round_num)
        return self._circuit_info_from_race(race_data)

    def get_races_by_season(self, season_year: int) -> list[CircuitInfo]:
        races = self._repo.list_races_by_season(season_year)
        return [self._circuit_info_from_race(race) for race in races if self._circuit_info_from_race(race)]


circuits_service = CircuitsService()
