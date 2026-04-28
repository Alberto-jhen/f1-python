"""Concrete Strategy — Ergast (jolpi.ca mirror) as standings source."""

import time
import requests
from typing import Optional

ERGAST_BASE = "https://api.jolpi.ca/ergast/f1"


def _parse_standings_list(raw: list[dict]) -> list[dict]:
    """Convert raw Ergast DriverStandings into normalised dicts (English keys)."""
    results = []
    for item in raw:
        driver = item.get("Driver", {})
        constructors = item.get("Constructors", [{}])
        results.append({
            "position": item.get("position", "?"),
            "points": item.get("points", "0"),
            "wins": item.get("wins", "0"),
            "driver": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
            "constructor": constructors[0].get("name", "") if constructors else "",
        })
    return results


class ErgastSource:
    """Fetches standings from the Ergast / jolpi.ca REST API."""

    def fetch_season(self, year: str, driver_number: str, code: str = None) -> Optional[dict]:
        url = f"{ERGAST_BASE}/{year}/driverStandings.json"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
            if not standings_lists:
                return None

            standings = standings_lists[0].get("DriverStandings", [])

            def _make(item):
                return {
                    "position": item.get("position", "N/A"),
                    "points": float(item.get("points", 0)),
                    "year": year,
                }

            for item in standings:
                if item.get("Driver", {}).get("permanentNumber") == driver_number:
                    return _make(item)

            if code:
                code_upper = code.upper()
                for item in standings:
                    if item.get("Driver", {}).get("code") == code_upper:
                        return _make(item)

        except Exception as e:
            print(f"Ergast fetch_season error ({year}/{driver_number}): {e}")
        return None

    def fetch_global(self, year: int) -> Optional[list[dict]]:
        url = f"{ERGAST_BASE}/{year}/driverStandings.json"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
            if not standings_lists:
                return None

            return _parse_standings_list(standings_lists[0].get("DriverStandings", []))
        except Exception as e:
            print(f"Ergast fetch_global error: {e}")
            return None

    def fetch_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        url = f"{ERGAST_BASE}/{year}/{round_num}/driverStandings.json"
        for attempt in range(2):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 429:
                    time.sleep(1)
                    continue
                response.raise_for_status()
                data = response.json()

                standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
                if not standings_lists:
                    return []

                return _parse_standings_list(standings_lists[0].get("DriverStandings", []))
            except Exception as e:
                print(f"Ergast fetch_by_round error (attempt {attempt+1}): {e}")
                if attempt == 0:
                    time.sleep(0.5)
        return None
