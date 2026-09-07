"""Concrete Strategy — OpenF1 API as standings source."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Optional


class OpenF1Source:
    """Fetches standings from the OpenF1 REST API."""

    def __init__(self):
        self._session = requests.Session()
        self._session.mount(
            "https://",
            HTTPAdapter(max_retries=Retry(total=0, connect=0, read=0, backoff_factor=0)),
        )
        self._timeout = (2, 5)

    def fetch_season(self, year: str, driver_number: str, code: str = None) -> Optional[dict]:
        url = f"https://api.openf1.org/v1/standings?driver_number={driver_number}&year={year}"
        try:
            response = self._session.get(url, timeout=self._timeout)
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
        return None  # OpenF1 does not provide full-grid season standings

    def fetch_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        return None  # OpenF1 does not provide per-round season standings
