import json
import os
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent.parent

# ----- Season standings (local JSON) -----

SEASON_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "season_standings.json")


def _load_season_standings():
    try:
        with open(SEASON_STANDINGS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo en {SEASON_STANDINGS_PATH}")
        return {}


SEASON_STANDINGS = _load_season_standings()


def _fetch_ergast_driver_standing(year: str, number: str):
    """Fetch a single driver's standings from Ergast for the given year."""
    url = f"https://api.jolpi.ca/ergast/f1/{year}/driverStandings.json"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        standings_lists = data.get('MRData', {}).get('StandingsTable', {}).get('StandingsLists', [])
        if not standings_lists:
            return None

        for item in standings_lists[0].get('DriverStandings', []):
            driver = item.get('Driver', {})
            if driver.get('permanentNumber') == number:
                return {
                    "position": item.get('position', 'N/A'),
                    "points": float(item.get('points', 0)),
                    "year": year
                }
    except Exception as e:
        print(f"Error fetching Ergast standings for {year}/{number}: {e}")
    return None


def get_season_championship(year: str, number: str):
    # Try local JSON first
    year_data = SEASON_STANDINGS.get(year, {})
    driver_stats = year_data.get(number)

    if driver_stats:
        return {
            "position": driver_stats["pos"],
            "points": driver_stats["pts"],
            "year": year
        }
    
    # Fallback to Ergast API for years not in local JSON
    ergast_result = _fetch_ergast_driver_standing(year, number)
    if ergast_result:
        return ergast_result

    return {"position": "N/A", "points": 0}


# ----- Career standings (local JSON) -----

CAREER_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "career_standings.json")


def _load_career_standings():
    try:
        with open(CAREER_STANDINGS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get("f1_comprehensive_stats_2018_2025", data)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo en {CAREER_STANDINGS_PATH}")
        return {}


CAREER_STANDINGS = _load_career_standings()


def get_career_championship(name: str):
    driver_data = CAREER_STANDINGS.get(name)

    if not driver_data:
        return {
            "titles": 0,
            "wins": 0,
            "podiums": 0,
            "error": "Driver not found"
        }

    return {
        "titles": driver_data.get("titulos", 0),
        "wins": driver_data.get("victorias", 0),
        "podiums": driver_data.get("podios", 0)
    }


# ----- OpenF1 season standings (external API) -----

def get_openf1_season_standings(year: int, driver_number: int):
    url = f"https://api.openf1.org/v1/standings?driver_number={driver_number}&year={year}"
    
    try:
        response = requests.get(url)
        data = response.json()

        if not data:
            return {"position": "-", "points": 0}

        latest_entry = data[-1]

        return {
            "position": latest_entry.get('position', '-'),
            "total_points_season": latest_entry.get('points', 0),
            "last_update": latest_entry.get('date')
        }
    except Exception as e:
        print(f"Error OpenF1: {e}")
        return {"error": "No se pudieron obtener stats"}


# ----- Global current standings (Ergast/jolpi.ca) -----

def get_global_standings():
    from datetime import datetime
    year = datetime.now().year
    url = f"https://api.jolpi.ca/ergast/f1/{year}/driverStandings.json"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        standings_lists = data.get('MRData', {}).get('StandingsTable', {}).get('StandingsLists', [])
        if not standings_lists:
            return {"message": "La temporada aún no tiene datos de clasificación", "results": []}

        standings_list = standings_lists[0].get('DriverStandings', [])

        results = []
        for item in standings_list:
            driver = item.get('Driver', {})
            constructors = item.get('Constructors', [{}])
            results.append({
                "posicion": item.get('position', '?'),
                "puntos": item.get('points', '0'),
                "victorias": item.get('wins', '0'),
                "piloto": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                "constructor": constructors[0].get('name', '') if constructors else ''
            })
        return results

    except Exception as e:
        print(f"Error detallado: {type(e).__name__}: {e}")
        return None


# ----- Standings by round (Ergast/jolpi.ca) -----

def get_standings_by_round(year: int, round_num: int):
    """Get driver standings up to (and including) a specific round."""
    import time
    url = f"https://api.jolpi.ca/ergast/f1/{year}/{round_num}/driverStandings.json"

    for attempt in range(2):
        try:
            response = requests.get(url, timeout=10)

            if response.status_code == 429:
                time.sleep(1)
                continue

            response.raise_for_status()
            data = response.json()

            standings_lists = data.get('MRData', {}).get('StandingsTable', {}).get('StandingsLists', [])
            if not standings_lists:
                return []

            standings_list = standings_lists[0].get('DriverStandings', [])

            results = []
            for item in standings_list:
                driver = item.get('Driver', {})
                constructors = item.get('Constructors', [{}])
                results.append({
                    "posicion": item.get('position', '?'),
                    "puntos": item.get('points', '0'),
                    "victorias": item.get('wins', '0'),
                    "piloto": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "constructor": constructors[0].get('name', '') if constructors else ''
                })
            return results

        except Exception as e:
            print(f"Error standings by round (attempt {attempt+1}): {type(e).__name__}: {e}")
            if attempt == 0:
                time.sleep(0.5)

    return None
