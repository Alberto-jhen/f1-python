#!/usr/bin/env python3
"""
Automated standings updater.

Run after each race weekend to refresh:
  - data/season_standings.json  (full current-year standings)
  - data/career_standings.json  (incremental wins/podiums from latest race)

Usage:
  python scripts/update_standings.py              # updates current year
  python scripts/update_standings.py --year 2025  # updates a specific year
  python scripts/update_standings.py --dry-run    # preview without writing

Can be automated with cron, GitHub Actions, etc.
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

ERGAST_BASE = "https://api.jolpi.ca/ergast/f1"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SEASON_PATH = DATA_DIR / "season_standings.json"
CAREER_PATH = DATA_DIR / "career_standings.json"


# ─── Helpers ───────────────────────────────────────────────

def ergast_get(url: str, retries: int = 2) -> dict | None:
    """GET with retry on 429 (rate limit)."""
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 429:
                print(f"  Rate limited, waiting 2s (attempt {attempt + 1})...")
                time.sleep(2)
                continue
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"  Request error: {e}")
            if attempt < retries - 1:
                time.sleep(1)
    return None


def load_json(path: Path) -> dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_json(path: Path, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ Saved {path.name}")


# ─── Season standings ─────────────────────────────────────

def fetch_season_standings(year: int) -> dict | None:
    """Fetch full driver standings for a year → {driver_number: {pos, pts}}."""
    url = f"{ERGAST_BASE}/{year}/driverStandings.json"
    data = ergast_get(url)
    if not data:
        return None

    standings_lists = (
        data.get("MRData", {})
        .get("StandingsTable", {})
        .get("StandingsLists", [])
    )
    if not standings_lists:
        print(f"  No standings data available for {year}")
        return None

    standings = standings_lists[0].get("DriverStandings", [])
    result = {}
    for entry in standings:
        driver = entry.get("Driver", {})
        number = driver.get("permanentNumber")
        if not number:
            continue
        result[number] = {
            "pos": int(entry.get("position", 0)),
            "pts": float(entry.get("points", 0)),
        }

    return result


def update_season(year: int, dry_run: bool = False) -> bool:
    """Update season_standings.json for the given year."""
    print(f"\n📊 Fetching season standings for {year}...")
    new_standings = fetch_season_standings(year)
    if not new_standings:
        print("  ❌ Failed to fetch season standings")
        return False

    print(f"  Found {len(new_standings)} drivers")

    if dry_run:
        for num, s in list(new_standings.items())[:5]:
            print(f"    #{num}: P{s['pos']} — {s['pts']} pts")
        print("  (dry run, not saving)")
        return True

    all_seasons = load_json(SEASON_PATH)
    all_seasons[str(year)] = new_standings
    save_json(SEASON_PATH, all_seasons)
    return True


# ─── Career standings ─────────────────────────────────────

def fetch_latest_race_results(year: int) -> list[dict] | None:
    """Fetch the results of the most recent completed race."""
    url = f"{ERGAST_BASE}/{year}/last/results.json"
    data = ergast_get(url)
    if not data:
        return None

    races = (
        data.get("MRData", {})
        .get("RaceTable", {})
        .get("Races", [])
    )
    if not races:
        return None

    race = races[0]
    race_name = race.get("raceName", "Unknown")
    round_num = race.get("round", "?")
    print(f"  Latest race: {race_name} (Round {round_num})")

    return race.get("Results", [])


def update_career(year: int, dry_run: bool = False) -> bool:
    """Incrementally update career_standings.json from latest race results."""
    print(f"\n🏆 Fetching latest race results for {year}...")
    results = fetch_latest_race_results(year)
    if not results:
        print("  ❌ No race results found")
        return False

    career_data = load_json(CAREER_PATH)
    stats = career_data.get("f1_comprehensive_stats_2018_2025", career_data)

    updates = []
    for entry in results:
        driver = entry.get("Driver", {})
        full_name = f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip()
        position = int(entry.get("position", 99))

        if full_name not in stats:
            stats[full_name] = {"titulos": 0, "victorias": 0, "podios": 0}

        if position == 1:
            stats[full_name]["victorias"] += 1
            stats[full_name]["podios"] += 1
            updates.append(f"    🥇 {full_name}: +1 win, +1 podium")
        elif position <= 3:
            stats[full_name]["podios"] += 1
            updates.append(f"    🏅 {full_name}: +1 podium (P{position})")

    if updates:
        print(f"  Changes detected ({len(updates)}):")
        for u in updates:
            print(u)
    else:
        print("  No podiums in this race to update")

    if dry_run:
        print("  (dry run, not saving)")
        return True

    career_data["f1_comprehensive_stats_2018_2025"] = stats
    save_json(CAREER_PATH, career_data)
    return True


# ─── World champion title update ──────────────────────────

def update_champion_title(year: int, dry_run: bool = False) -> bool:
    """Check if the championship has been decided and update titles.
    Only relevant at season end (typically after round 20+)."""
    standings = fetch_season_standings(year)
    if not standings:
        return False

    # Find driver in P1
    champion_number = None
    for num, s in standings.items():
        if s["pos"] == 1:
            champion_number = num
            break

    if not champion_number:
        return False

    # We need the driver's name — fetch from standings API
    url = f"{ERGAST_BASE}/{year}/driverStandings/1.json"
    data = ergast_get(url)
    if not data:
        return False

    try:
        driver = (
            data["MRData"]["StandingsTable"]["StandingsLists"][0]
            ["DriverStandings"][0]["Driver"]
        )
        name = f"{driver['givenName']} {driver['familyName']}"
    except (KeyError, IndexError):
        return False

    career_data = load_json(CAREER_PATH)
    stats = career_data.get("f1_comprehensive_stats_2018_2025", career_data)

    current_titles = stats.get(name, {}).get("titulos", 0)
    # Only log — manual confirmation recommended for title changes
    print(f"\n👑 {year} Championship leader: {name} (currently {current_titles} titles in DB)")
    print("   Title updates should be done manually at season end.")

    return True


# ─── Main ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Update F1 standings data")
    parser.add_argument("--year", type=int, default=datetime.now().year,
                        help="Season year to update (default: current year)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview changes without writing files")
    parser.add_argument("--season-only", action="store_true",
                        help="Only update season standings")
    parser.add_argument("--career-only", action="store_true",
                        help="Only update career standings")
    args = parser.parse_args()

    print(f"🏎️  F1 Standings Updater — {args.year}")
    print(f"{'(DRY RUN)' if args.dry_run else ''}")
    print("=" * 40)

    success = True

    if not args.career_only:
        if not update_season(args.year, args.dry_run):
            success = False

    if not args.season_only:
        if not update_career(args.year, args.dry_run):
            success = False

    update_champion_title(args.year, args.dry_run)

    print("\n" + "=" * 40)
    print("✅ Done!" if success else "⚠️  Some updates failed")
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
