"""Concrete Strategy — OpenF1 API as standings source."""

import requests
from typing import Optional


class OpenF1Source:
    """Fetches standings from the OpenF1 REST API."""

    def fetch_season(self, year: str, driver_number: str, code: str = None) -> Optional[dict]:
        url = f"https://api.openf1.org/v1/standings?driver_number={driver_number}&year={year}"
        try:
            response = requests.get(url, timeout=10)
            data = response.json()
            if not data:
                return None

            latest = data[-1]
            return {
                "position": latest.get("position", "-"),
                "total_points_season": latest.get("points", 0),
                "last_update": latest.get("date"),
            }
        except Exception as e:
            print(f"OpenF1 fetch_season error: {e}")
            return None

    def fetch_global(self, year: int) -> Optional[list[dict]]:
        return None  # OpenF1 does not provide full-grid standings

    def fetch_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        return None  # OpenF1 does not provide per-round standings
