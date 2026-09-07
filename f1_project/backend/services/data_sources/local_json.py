"""Concrete Strategy — Local JSON files as standings source."""

import json
import os
from pathlib import Path
from typing import Optional

import requests

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SEASON_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "season_standings.json")
CAREER_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "career_standings.json")
OPENF1_DRIVERS_URL = "https://api.openf1.org/v1/drivers?session_key=latest"


def _load_json(path: str) -> dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: JSON file not found at {path}")
        return {}


class LocalJsonSource:
    """Reads standings from pre-computed local JSON files."""

    def __init__(self):
        self._season = _load_json(SEASON_STANDINGS_PATH)
        raw_career = _load_json(CAREER_STANDINGS_PATH)
        self._career = raw_career.get("f1_comprehensive_stats_2018_2025", raw_career)

    # -- StandingsSource interface --

    def fetch_season(self, year: str, driver_number: str, code: str = None) -> Optional[dict]:
        driver_stats = self._season.get(year, {}).get(driver_number)
        if not driver_stats:
            return None
        return {
            "position": driver_stats["pos"],
            "points": driver_stats["pts"],
            "year": year,
        }

    def _fetch_driver_names(self) -> dict[str, dict]:
        """Fetch a map of driver_number -> {name, team} from OpenF1."""
        try:
            response = requests.get(OPENF1_DRIVERS_URL, timeout=(2, 5))
            response.raise_for_status()
            drivers = response.json()
            return {
                str(d.get("driver_number")): {
                    "name": d.get("full_name") or d.get("broadcast_name"),
                    "team": d.get("team_name", "N/A"),
                }
                for d in drivers
                if d.get("driver_number") is not None
            }
        except Exception as e:
            print(f"Local fallback driver name fetch failed: {e}")
            return {}

    def fetch_global(self, year: int) -> Optional[list[dict]]:
        """Return full-grid standings from the local JSON fallback when remote APIs fail."""
        season_data = self._season.get(str(year), {})
        if not season_data:
            return None

        driver_names = self._fetch_driver_names()

        return [
            {
                "position": str(stats["pos"]),
                "points": str(stats["pts"]),
                "wins": "0",
                "driver": driver_names.get(driver_number, {}).get("name") or str(driver_number),
                "constructor": driver_names.get(driver_number, {}).get("team") or "N/A",
            }
            for driver_number, stats in sorted(
                season_data.items(), key=lambda item: int(item[1].get("pos", 999))
            )
        ]

    def fetch_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        # Local JSON only stores end-of-season standings, so round filtering is not supported.
        return self.fetch_global(year)

    # -- Career (not part of the generic interface) --

    def fetch_career(self, driver_name: str) -> Optional[dict]:
        data = self._career.get(driver_name)
        if not data:
            return None
        return {
            "titles": data.get("titulos", 0),
            "wins": data.get("victorias", 0),
            "podiums": data.get("podios", 0),
        }
