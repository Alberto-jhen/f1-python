import fastf1
import json
import os
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
SEASON_STANDINGS_PATH = os.path.join(BASE_DIR, "data", "season_standings.json")


def _load_season_standings():
    try:
        with open(SEASON_STANDINGS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


SEASON_STANDINGS = _load_season_standings()


def get_h2h_data(year: int, driver1: str, driver2: str):
    """
    Returns per-event qualifying and race positions for two drivers in a season.
    driver1 and driver2 are abbreviations (e.g. 'VER', 'PER').
    """
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        now = datetime.now()
        results = []

        for _, event in schedule.iterrows():
            event_name = event['EventName']
            round_number = int(event['RoundNumber'])

            # Skip future events
            race_date = event.get('Session5DateUtc') or event.get('Session4DateUtc')
            if race_date is not None and race_date.replace(tzinfo=None) > now:
                continue
            if round_number == 0:
                continue

            entry = {
                "event": event_name,
                "round": round_number,
                "driver1_qual": None,
                "driver2_qual": None,
                "driver1_race": None,
                "driver2_race": None,
            }

            # Qualifying results
            try:
                quali = fastf1.get_session(year, event_name, 'Q')
                quali.load(telemetry=False, weather=False, messages=False)
                q_results = quali.results

                d1_q = q_results[q_results['Abbreviation'] == driver1]
                d2_q = q_results[q_results['Abbreviation'] == driver2]

                if not d1_q.empty:
                    entry["driver1_qual"] = int(d1_q.iloc[0]['Position'])
                if not d2_q.empty:
                    entry["driver2_qual"] = int(d2_q.iloc[0]['Position'])
            except Exception:
                pass

            # Race results
            try:
                race = fastf1.get_session(year, event_name, 'R')
                race.load(telemetry=False, weather=False, messages=False)
                r_results = race.results

                d1_r = r_results[r_results['Abbreviation'] == driver1]
                d2_r = r_results[r_results['Abbreviation'] == driver2]

                if not d1_r.empty:
                    row = d1_r.iloc[0]
                    status = str(row.get('Status', ''))
                    pos = row['Position']
                    entry["driver1_race"] = int(pos) if _is_classified(status, pos) else "DNF"

                if not d2_r.empty:
                    row = d2_r.iloc[0]
                    status = str(row.get('Status', ''))
                    pos = row['Position']
                    entry["driver2_race"] = int(pos) if _is_classified(status, pos) else "DNF"
            except Exception:
                pass

            # Only include events where at least one driver participated
            if any(v is not None for k, v in entry.items() if k.startswith('driver')):
                results.append(entry)

        # Season points: try local JSON first, fallback to FastF1 cumulative
        year_data = SEASON_STANDINGS.get(str(year), {})
        d1_num = None
        d2_num = None
        d1_points_fastf1 = 0.0
        d2_points_fastf1 = 0.0

        # Accumulate per-race points from FastF1 across all events
        for ev_entry in results:
            try:
                race_session = fastf1.get_session(year, ev_entry["event"], 'R')
                race_session.load(telemetry=False, weather=False, messages=False)
                for _, row in race_session.results.iterrows():
                    abbr = row['Abbreviation']
                    pts = float(row.get('Points', 0) or 0)
                    if abbr == driver1:
                        d1_points_fastf1 += pts
                        if d1_num is None:
                            d1_num = str(int(row['DriverNumber']))
                    elif abbr == driver2:
                        d2_points_fastf1 += pts
                        if d2_num is None:
                            d2_num = str(int(row['DriverNumber']))
            except Exception:
                pass

        d1_json_pts = year_data.get(d1_num, {}).get("pts", 0) if d1_num else 0
        d2_json_pts = year_data.get(d2_num, {}).get("pts", 0) if d2_num else 0

        return {
            "year": year,
            "driver1": driver1,
            "driver2": driver2,
            "driver1_season_points": d1_json_pts if d1_json_pts > 0 else d1_points_fastf1,
            "driver2_season_points": d2_json_pts if d2_json_pts > 0 else d2_points_fastf1,
            "events": results,
        }

    except Exception as e:
        print(f"Error en h2h_service: {e}")
        return {"error": str(e)}


def _is_classified(status: str, position) -> bool:
    """Check if a driver finished the race (not DNF/DSQ/DNS)."""
    if position is None or str(position).strip() == '':
        return False
    dnf_keywords = ['retired', 'accident', 'collision', 'dnf', 'dns', 'dsq',
                     'disqualified', 'withdrew', 'not classified', 'excluded']
    status_lower = status.lower()
    for keyword in dnf_keywords:
        if keyword in status_lower:
            return False
    return True
