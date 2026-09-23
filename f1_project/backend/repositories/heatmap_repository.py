"""Repository for cached points heatmap data.

Reads from Supabase first, falls back to a local JSON file.
Writes to both when the cache is refreshed.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from database.database import supabase

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
HEATMAP_TABLE = "heatmap_points"


def _heatmap_json_path(year: int) -> Path:
    return DATA_DIR / f"heatmap_points_{year}.json"


def _load_json(path: Path) -> Optional[dict]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        print(f"Warning: malformed heatmap JSON at {path}: {e}")
        return None


def load_heatmap_data(year: int) -> Optional[dict]:
    """
    Return the cached points matrix for a season.

    Priority:
      1. Supabase `heatmap_points` table.
      2. Local JSON fallback `data/heatmap_points_{year}.json`.

    The returned dict has the shape:
      {
        "year": int,
        "updated_at": str,
        "drivers": [str, ...],
        "races": [str, ...],
        "points": [[float, ...], ...]
      }
    """
    # 1. Try Supabase
    if supabase:
        try:
            response = supabase.table(HEATMAP_TABLE).select("data").eq("year", year).single().execute()
            data = response.data
            if data and data.get("data"):
                print(f"Loaded heatmap data for {year} from Supabase")
                return data["data"]
        except Exception as e:
            # A missing row is not an error; the JSON fallback will be used.
            msg = str(e)
            if "0 rows" in msg or "PGRST116" in msg:
                pass
            else:
                print(f"Supabase heatmap read failed for {year}: {e}")

    # 2. Fallback to local JSON
    path = _heatmap_json_path(year)
    data = _load_json(path)
    if data:
        print(f"Loaded heatmap data for {year} from {path}")
        return data

    return None


def save_heatmap_data(year: int, data: dict) -> None:
    """
    Persist the points matrix to Supabase and to a local JSON file.
    Local JSON always acts as a fallback even if Supabase is unavailable.
    """
    payload = {
        "year": year,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        **data,
    }

    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Save local JSON fallback
    path = _heatmap_json_path(year)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"Saved heatmap fallback for {year} to {path}")

    # 2. Upsert to Supabase (service role bypasses RLS)
    if supabase:
        try:
            supabase.table(HEATMAP_TABLE).upsert(
                {"year": year, "data": payload},
                on_conflict="year",
            ).execute()
            print(f"Upserted heatmap data for {year} to Supabase")
        except Exception as e:
            print(f"Supabase heatmap upsert failed for {year}: {e}")
