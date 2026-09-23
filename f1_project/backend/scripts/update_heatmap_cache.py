#!/usr/bin/env python3
"""
Heatmap points cache updater.

Builds the season points matrix (drivers x races) from Ergast/Jolpica,
updates the Supabase `heatmap_points` table, and saves a local JSON fallback.

Usage:
  python scripts/update_heatmap_cache.py              # current year
  python scripts/update_heatmap_cache.py --year 2025  # specific year
  python scripts/update_heatmap_cache.py --dry-run    # preview without saving

Can be automated with cron or GitHub Actions.
"""

import argparse
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from fastf1.ergast import Ergast

# Add backend to path when running the script directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from repositories.heatmap_repository import save_heatmap_data


def _ergast_call_with_retry(callable, max_retries=5, base_delay=1.0):
    """
    Retry an Ergast accessor when Jolpica returns 429 Too Many Requests.
    Uses exponential backoff.
    """
    last_exception = None
    for attempt in range(max_retries):
        try:
            return callable()
        except Exception as e:
            last_exception = e
            msg = str(e).lower()
            if "too many requests" in msg or "429" in msg:
                delay = base_delay * (2 ** attempt)
                print(f"    Rate limited (429), retrying in {delay:.1f}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
                continue
            raise
    raise last_exception


def build_heatmap_matrix(year: int) -> dict:
    """
    Fetch race + sprint results for every round and return a matrix:
      {
        "drivers": ["NOR", "VER", ...],
        "races": ["Bahrain", ...],
        "points": [[25, ...], ...]
      }
    """
    print(f"\n🏎️  Building heatmap cache for {year}...")

    ergast = Ergast()
    races = _ergast_call_with_retry(lambda: ergast.get_race_schedule(year))
    results = []

    for rnd, race_name in races["raceName"].items():
        round_num = rnd + 1
        print(f"  Round {round_num}: {race_name}")

        # Race results
        temp = _ergast_call_with_retry(lambda r=round_num: ergast.get_race_results(season=year, round=r))
        temp = temp.content[0]

        # Sprint results (if any)
        sprint = _ergast_call_with_retry(lambda r=round_num: ergast.get_sprint_results(season=year, round=r))
        if sprint.content and sprint.description["round"][0] == round_num:
            temp = pd.merge(temp, sprint.content[0], on="driverCode", how="left")
            temp["points"] = temp["points_x"] + temp["points_y"]
            temp.drop(columns=["points_x", "points_y"], inplace=True)

        temp["round"] = round_num
        temp["race"] = race_name.removesuffix(" Grand Prix")
        temp = temp[["round", "race", "driverCode", "points"]]
        results.append(temp)

        # Respect Jolpica rate limit between rounds
        time.sleep(0.25)

    if not results:
        raise ValueError(f"No race data found for {year}")

    results = pd.concat(results)
    races_list = results["race"].drop_duplicates().tolist()

    # Pivot to wide table: drivers as rows, rounds as columns
    pivot = results.pivot(index="driverCode", columns="round", values="points")

    # Sort by total points descending
    pivot["total_points"] = pivot.sum(axis=1)
    pivot = pivot.sort_values(by="total_points", ascending=False)
    pivot.drop(columns="total_points", inplace=True)

    # Use race names as column names
    pivot.columns = races_list

    drivers = pivot.index.tolist()

    # Replace NaN with None so the matrix is valid JSON (null instead of NaN).
    # NaN appears when a driver did not participate in a particular round.
    points = [
        [None if pd.isna(value) else value for value in row]
        for row in pivot.values.tolist()
    ]

    print(f"  ✓ Matrix built: {len(drivers)} drivers × {len(races_list)} races")

    return {
        "drivers": drivers,
        "races": races_list,
        "points": points,
    }


def main():
    parser = argparse.ArgumentParser(description="Update F1 points heatmap cache")
    parser.add_argument(
        "--year",
        type=int,
        default=datetime.now(timezone.utc).year,
        help="Season year to update (default: current year)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build matrix but do not save to DB or JSON",
    )
    args = parser.parse_args()

    print(f"Heatmap cache updater — {args.year}")
    print("=" * 40)

    try:
        matrix = build_heatmap_matrix(args.year)
    except Exception as e:
        print(f"\n❌ Failed to build heatmap matrix: {e}")
        return 1

    if args.dry_run:
        print("\n(dry run, not saving)")
        print(f"Drivers: {matrix['drivers'][:5]}...")
        print(f"Races: {matrix['races'][:5]}...")
        return 0

    save_heatmap_data(args.year, matrix)
    print("\n✅ Done!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
