"""Concrete Strategy — Local JSON files as standings source."""

import json
import os
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SEASON_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "season_standings.json")
CAREER_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "career_standings.json")


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

    def fetch_global(self, year: int) -> Optional[list[dict]]:
        """Return full-grid standings from the local JSON fallback when remote APIs fail."""
        season_data = self._season.get(str(year), {})
        if not season_data:
            return None

        return [
            {
                "position": str(stats["pos"]),
                "points": str(stats["pts"]),
                "wins": "0",
                "driver": str(driver_number),
                "constructor": "N/A",
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
