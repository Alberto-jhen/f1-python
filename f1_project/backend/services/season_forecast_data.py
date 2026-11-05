"""Jolpica data access and feature construction for season forecasts."""

from __future__ import annotations

import hashlib
import json
import re
import threading
import time
from collections import defaultdict, deque
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable, Optional, Sequence
from urllib.parse import urlencode

import pandas as pd
import requests


BASE_DIR = Path(__file__).resolve().parent.parent
FORECAST_CACHE_DIR = BASE_DIR / "cache_fastf1" / "season_forecast"
JOLPICA_CACHE_DIR = FORECAST_CACHE_DIR / "jolpica"
SNAPSHOT_CACHE_DIR = FORECAST_CACHE_DIR / "snapshots"
ERGAST_BASE = "https://api.jolpi.ca/ergast/f1"
USER_AGENT = "F1Insights/1.0 (season forecast)"

RACE_POINTS = (25, 18, 15, 12, 10, 8, 6, 4, 2, 1)
SPRINT_POINTS = (8, 7, 6, 5, 4, 3, 2, 1)

FEATURE_COLUMNS = [
    "driver_id",
    "constructor_id",
    "circuit_id",
    "driver_points",
    "driver_rank",
    "constructor_points",
    "constructor_rank",
    "driver_form_last3",
    "team_form_last3",
    "driver_dnf_rate_last5",
    "team_dnf_rate_last5",
    "round_progress",
    "is_sprint",
    "grid_position",
]
TARGET_COLUMN = "target_points"
TARGET_DNF_COLUMN = "target_dnf"
NUMERIC_FEATURES = [
    "driver_points",
    "driver_rank",
    "constructor_points",
    "constructor_rank",
    "driver_form_last3",
    "team_form_last3",
    "driver_dnf_rate_last5",
    "team_dnf_rate_last5",
    "round_progress",
    "is_sprint",
    "grid_position",
]
CATEGORICAL_FEATURES = ["driver_id", "constructor_id", "circuit_id"]


class JolpicaUnavailable(RuntimeError):
    """Raised when the Jolpica API cannot provide a requested payload."""


class JolpicaClient:
    """Rate-limited Jolpica client with a persistent JSON response cache.

    Historical requests are served from disk once cached. Callers can force a
    refresh for live snapshots; if that refresh fails, the forecast service
    decides whether a dated snapshot is safe to use.
    """

    def __init__(
        self,
        cache_dir: Path = JOLPICA_CACHE_DIR,
        session: Optional[requests.Session] = None,
        min_request_interval: float = 0.3,
        retries: int = 3,
        timeout: tuple[float, float] = (3, 12),
        sleep: Callable[[float], None] = time.sleep,
        clock: Callable[[], float] = time.monotonic,
    ):
        self.cache_dir = Path(cache_dir)
        self._session = session or requests.Session()
        self._min_request_interval = max(0.0, min_request_interval)
        self._retries = max(1, retries)
        self._timeout = timeout
        self._sleep = sleep
        self._clock = clock
        self._last_request_at: Optional[float] = None
        self._request_lock = threading.Lock()
        self._session.headers.update({"User-Agent": USER_AGENT})

    def _cache_path(self, endpoint: str, params: Optional[dict[str, Any]]) -> Path:
        query = urlencode(sorted((params or {}).items()), doseq=True)
        cache_key = f"{endpoint}?{query}"
        digest = hashlib.sha256(cache_key.encode("utf-8")).hexdigest()[:16]
        safe_endpoint = re.sub(r"[^A-Za-z0-9_.-]+", "_", endpoint).strip("_")
        return self.cache_dir / f"{safe_endpoint}.{digest}.json"

    def _wait_for_rate_limit(self) -> None:
        with self._request_lock:
            now = self._clock()
            if self._last_request_at is not None:
                remaining = self._min_request_interval - (now - self._last_request_at)
                if remaining > 0:
                    self._sleep(remaining)
                    now = self._clock()
            self._last_request_at = now

    def get_json(
        self,
        endpoint: str,
        params: Optional[dict[str, Any]] = None,
        *,
        refresh: bool = False,
    ) -> dict[str, Any]:
        """Fetch a JSON response, using the disk cache unless ``refresh`` is true."""
        cache_path = self._cache_path(endpoint, params)
        if not refresh and cache_path.is_file():
            try:
                with cache_path.open("r", encoding="utf-8") as cache_file:
                    return json.load(cache_file)
            except (OSError, json.JSONDecodeError):
                # A partial/corrupt cache entry should not prevent a fresh fetch.
                pass

        url = f"{ERGAST_BASE}/{endpoint.lstrip('/')}"
        last_error: Optional[Exception] = None
        for attempt in range(self._retries):
            self._wait_for_rate_limit()
            try:
                response = self._session.get(
                    url,
                    params=params,
                    timeout=self._timeout,
                )
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    try:
                        delay = float(retry_after)
                    except (TypeError, ValueError):
                        delay = min(2 ** attempt, 8)
                    if attempt + 1 < self._retries:
                        self._sleep(delay)
                        continue
                response.raise_for_status()
                payload = response.json()
                self._write_cache(cache_path, payload)
                return payload
            except Exception as exc:
                last_error = exc
                if attempt + 1 < self._retries:
                    self._sleep(min(2 ** attempt, 8))

        raise JolpicaUnavailable(
            f"Jolpica request failed for {endpoint}: {last_error}"
        ) from last_error

    @staticmethod
    def _write_cache(cache_path: Path, payload: dict[str, Any]) -> None:
        try:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = cache_path.with_suffix(f"{cache_path.suffix}.tmp")
            with temporary_path.open("w", encoding="utf-8") as cache_file:
                json.dump(payload, cache_file, ensure_ascii=False)
            temporary_path.replace(cache_path)
        except OSError:
            # Forecasting remains available if a read-only filesystem prevents caching.
            return

    def fetch_schedule(self, year: int, *, refresh: bool = False) -> dict[str, Any]:
        return self.get_json(f"{year}.json", {"limit": 100}, refresh=refresh)

    def fetch_race_results(self, year: int, *, refresh: bool = False) -> dict[str, Any]:
        return self._fetch_all_results(
            f"{year}/results.json", result_key="Results", refresh=refresh
        )

    def fetch_sprint_results(self, year: int, *, refresh: bool = False) -> dict[str, Any]:
        return self._fetch_all_results(
            f"{year}/sprint.json", result_key="SprintResults", refresh=refresh
        )
    def _fetch_all_results(
        self,
        endpoint: str,
        *,
        result_key: str,
        refresh: bool,
    ) -> dict[str, Any]:
        page_size = 100
        first_page = self.get_json(
            endpoint,
            {"limit": page_size, "offset": 0},
            refresh=refresh,
        )
        pages = [first_page]
        mr_data = _mr_data(first_page)
        try:
            total = int(mr_data.get("total", 0))
            page_size = max(1, int(mr_data.get("limit", page_size)))
            offset = int(mr_data.get("offset", 0)) + page_size
        except (TypeError, ValueError):
            return first_page

        while offset < total:
            page = self.get_json(
                endpoint,
                {"limit": page_size, "offset": offset},
                refresh=refresh,
            )
            page_mr_data = _mr_data(page)
            pages.append(page)
            try:
                next_offset = int(page_mr_data.get("offset", offset)) + int(
                    page_mr_data.get("limit", page_size)
                )
            except (TypeError, ValueError):
                break
            if next_offset <= offset:
                break
            offset = next_offset
        return _merge_result_pages(pages, result_key)

    def fetch_driver_standings(
        self, year: int, round_num: int, *, refresh: bool = False
    ) -> dict[str, Any]:
        return self.get_json(
            f"{year}/{round_num}/driverStandings.json",
            {"limit": 100},
            refresh=refresh,
        )

    def fetch_constructor_standings(
        self, year: int, round_num: int, *, refresh: bool = False
    ) -> dict[str, Any]:
        return self.get_json(
            f"{year}/{round_num}/constructorStandings.json",
            {"limit": 100},
            refresh=refresh,
        )

    def fetch_qualifying(
        self,
        year: int,
        round_num: int,
        *,
        sprint: bool = False,
        refresh: bool = False,
    ) -> dict[str, Any]:
        if sprint:
            raise JolpicaUnavailable(
                "Sprint qualifying grids are not available in Jolpica's "
                "Ergast-compatible endpoint."
            )
        return self.get_json(
            f"{year}/{round_num}/qualifying.json",
            {"limit": 100},
            refresh=refresh,
        )

    def fetch_snapshot_inputs(self, year: int) -> dict[str, Any]:
        """Fetch live data used to build one dated forecast snapshot."""
        schedule = self.fetch_schedule(year, refresh=True)
        races = self.fetch_race_results(year, refresh=True)
        sprints = self.fetch_sprint_results(year, refresh=True)

        sessions = parse_result_sessions(year, races, sprints)
        if not sessions:
            raise JolpicaUnavailable(f"Jolpica has no completed results for {year}")
        as_of_round = max(session["round"] for session in sessions)

        driver_standings = self.fetch_driver_standings(
            year, as_of_round, refresh=True
        )
        constructor_standings = self.fetch_constructor_standings(
            year, as_of_round, refresh=True
        )

        schedule_events = parse_schedule(schedule)
        if not schedule_events:
            schedule_events = events_from_sessions(sessions)
        now = datetime.now(timezone.utc)
        qualifying_grids: dict[
            str, dict[str, dict[str, Optional[int]]]
        ] = {}
        for event in schedule_events:
            if event["round"] < as_of_round or event["round"] <= 0:
                continue
            # The Ergast-compatible Jolpica API exposes race qualifying only;
            # do not substitute the sprint qualifying grid for the race grid.
            qualifying_date = event.get("qualifying_date")
            sprint_date = event.get("sprint_date")
            if (
                event.get("sprint")
                and not event.get("sprint_qualifying_date")
                and sprint_date
                and qualifying_date
                and _scheduled_datetime(qualifying_date)
                <= _scheduled_datetime(sprint_date)
            ):
                # In the 2021–22 format, Friday qualifying set the sprint grid,
                # not the main race grid.
                continue
            if not _date_has_passed(qualifying_date, now):
                continue
            if any(
                session["round"] == event["round"] and session["type"] == "race"
                for session in sessions
            ):
                continue
            try:
                qualifying = self.fetch_qualifying(
                    year,
                    event["round"],
                    refresh=True,
                )
            except JolpicaUnavailable:
                # Qualifying is optional; never turn an unavailable grid into a guess.
                continue
            grid = parse_qualifying_grid(qualifying)
            if grid:
                qualifying_grids.setdefault(str(event["round"]), {})["race"] = grid

        return {
            "year": year,
            "schedule": schedule_events,
            "sessions": sessions,
            "driver_standings": driver_standings,
            "constructor_standings": constructor_standings,
            "qualifying_grids": qualifying_grids,
        }


def _mr_data(payload: dict[str, Any]) -> dict[str, Any]:
    return payload.get("MRData", {}) if isinstance(payload, dict) else {}


def _races(payload: dict[str, Any]) -> list[dict[str, Any]]:
    mr_data = _mr_data(payload)
    race_table = mr_data.get("RaceTable", {})
    races = race_table.get("Races", []) if isinstance(race_table, dict) else []
    if not races:
        sprint_table = mr_data.get("SprintTable", {})
        races = sprint_table.get("Races", []) if isinstance(sprint_table, dict) else []
    return races if isinstance(races, list) else []

def _merge_result_pages(
    pages: list[dict[str, Any]], result_key: str
) -> dict[str, Any]:
    merged = deepcopy(pages[0])
    merged_races: list[dict[str, Any]] = []
    races_by_round: dict[tuple[str, str], dict[str, Any]] = {}
    for page in pages:
        for race in _races(page):
            key = (str(race.get("season") or ""), str(race.get("round") or ""))
            target = races_by_round.get(key)
            if target is None:
                target = deepcopy(race)
                target[result_key] = list(target.get(result_key, []))
                races_by_round[key] = target
                merged_races.append(target)
                continue

            current_results = target.setdefault(result_key, [])
            known_results = {
                _result_identity(result) for result in current_results
            }
            for result in race.get(result_key, []):
                identity = _result_identity(result)
                if identity not in known_results:
                    current_results.append(deepcopy(result))
                    known_results.add(identity)
            for field, value in race.items():
                if field != result_key:
                    target.setdefault(field, deepcopy(value))

    mr_data = merged.setdefault("MRData", {})
    race_table = mr_data.setdefault("RaceTable", {})
    race_table["Races"] = merged_races
    return merged


def _result_identity(result: dict[str, Any]) -> str:
    driver_id = result.get("Driver", {}).get("driverId")
    if driver_id:
        return str(driver_id)
    return json.dumps(result, sort_keys=True, ensure_ascii=False)


def _as_int(value: Any) -> Optional[int]:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _positive_int(value: Any) -> Optional[int]:
    parsed = _as_int(value)
    return parsed if parsed is not None and parsed > 0 else None


def _driver_name(driver: dict[str, Any]) -> str:
    return " ".join(
        part for part in (driver.get("givenName"), driver.get("familyName")) if part
    ).strip() or str(driver.get("driverId", "Unknown"))


def points_for_position(position: Optional[int], session_type: str) -> float:
    """Return points under the current official race or sprint scoring system."""
    if position is None or position < 1:
        return 0.0
    scoring = SPRINT_POINTS if session_type == "sprint" else RACE_POINTS
    if position > len(scoring):
        return 0.0
    return float(scoring[position - 1])

def _did_not_finish(status: str, position: Optional[int]) -> Optional[bool]:
    """Classify unclassified retirements without confusing them with DNS/DSQ."""
    normalized_status = status.strip().lower()
    if not normalized_status:
        return None
    if any(
        token in normalized_status
        for token in (
            "disqual",
            "exclud",
            "withdraw",
            "did not start",
            "not started",
            "dns",
            "did not qualify",
            "not qualify",
            "dnq",
            "prequalif",
        )
    ):
        return None
    if position is not None:
        # Some retirements are officially classified and retain a points result.
        return False
    if normalized_status in {"finished", "classified"} or re.fullmatch(
        r"\+\s*\d+\s+laps?", normalized_status
    ):
        return False
    return True


def _result_record(
    result: dict[str, Any], session_type: str
) -> Optional[dict[str, Any]]:
    driver = result.get("Driver", {})
    constructors = result.get("Constructor", result.get("Constructors", []))
    if isinstance(constructors, dict):
        constructors = [constructors]
    constructor = constructors[0] if constructors else {}
    driver_id = driver.get("driverId")
    if not driver_id:
        return None
    position = _positive_int(result.get("position"))
    position_text = str(result.get("positionText") or "").strip()
    status = str(result.get("status") or "")
    if position_text and not position_text.isdigit():
        position = None
    if any(token in status.lower() for token in ("disqual", "exclud")):
        position = None
    return {
        "driver_id": str(driver_id),
        "driver": _driver_name(driver),
        "constructor_id": str(constructor.get("constructorId") or "unknown"),
        "constructor": str(constructor.get("name") or "Unknown"),
        "position": position,
        "grid_position": _positive_int(result.get("grid")),
        "points": points_for_position(position, session_type),
        "status": status,
        "did_not_finish": _did_not_finish(status, position),
    }


def parse_result_sessions(
    year: int,
    race_payload: dict[str, Any],
    sprint_payload: Optional[dict[str, Any]] = None,
) -> list[dict[str, Any]]:
    """Normalize race and sprint result payloads into chronological sessions."""
    sessions: list[dict[str, Any]] = []
    for session_type, payload, result_key in (
        ("sprint", sprint_payload or {}, "SprintResults"),
        ("race", race_payload or {}, "Results"),
    ):
        for race in _races(payload):
            results = race.get(result_key, [])
            if not results:
                continue
            round_num = _positive_int(race.get("round"))
            if round_num is None:
                continue
            circuit = race.get("Circuit", {})
            normalized_results = [
                record
                for result in results
                if (record := _result_record(result, session_type)) is not None
            ]
            if not normalized_results:
                continue
            sessions.append(
                {
                    "year": year,
                    "round": round_num,
                    "event": str(race.get("raceName") or "Unknown"),
                    "circuit_id": str(
                        circuit.get("circuitId")
                        or circuit.get("circuitName")
                        or "unknown"
                    ),
                    "circuit": str(circuit.get("circuitName") or "Unknown"),
                    "date": str(race.get("date") or ""),
                    "type": session_type,
                    "is_sprint": session_type == "sprint",
                    "results": normalized_results,
                }
            )
    return sorted(
        sessions,
        key=lambda session: (
            session["round"],
            0 if session["type"] == "sprint" else 1,
        ),
    )


def parse_schedule(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Normalize Jolpica season calendar rows, including sprint/qualifying dates."""
    events = []
    for race in _races(payload):
        round_num = _positive_int(race.get("round"))
        if round_num is None:
            continue
        circuit = race.get("Circuit", {})
        sprint = any(
            race.get(key) for key in ("Sprint", "SprintQualifying", "SprintShootout")
        )
        events.append(
            {
                "round": round_num,
                "event": str(race.get("raceName") or "Unknown"),
                "circuit_id": str(
                    circuit.get("circuitId")
                    or circuit.get("circuitName")
                    or "unknown"
                ),
                "circuit": str(circuit.get("circuitName") or "Unknown"),
                "date": str(race.get("date") or ""),
                "sprint_date": _session_datetime(race.get("Sprint")),
                "sprint": sprint,
                "sprint_qualifying_date": _session_date(
                    race.get("SprintQualifying") or race.get("SprintShootout")
                ),
                "qualifying_date": _session_datetime(race.get("Qualifying")),
            }
        )
    return sorted(events, key=lambda event: event["round"])


def _session_date(value: Any) -> Optional[str]:
    if isinstance(value, dict):
        return value.get("date")
    return None

def _session_datetime(value: Any) -> Optional[str]:
    if not isinstance(value, dict) or not value.get("date"):
        return None
    session_time = value.get("time")
    if session_time:
        return f"{value['date']}T{session_time}"
    return str(value["date"])


def _scheduled_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _date_has_passed(value: Optional[str], now: datetime) -> bool:
    if not value:
        return False
    try:
        parsed = _scheduled_datetime(value)
    except ValueError:
        return False
    return parsed <= now


def events_from_sessions(sessions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build a minimal schedule when the season calendar is unavailable."""
    event_by_round: dict[int, dict[str, Any]] = {}
    for session in sessions:
        event = event_by_round.setdefault(
            session["round"],
            {
                "round": session["round"],
                "event": session["event"],
                "circuit_id": session["circuit_id"],
                "circuit": session["circuit"],
                "date": session.get("date", ""),
                "sprint": False,
            },
        )
        if session["type"] == "sprint":
            event["sprint"] = True
    return [event_by_round[key] for key in sorted(event_by_round)]


def parse_qualifying_grid(
    payload: dict[str, Any], *, sprint: bool = False
) -> dict[str, Optional[int]]:
    """Read only published qualifying positions; missing entries remain absent."""
    qualifying_key = (
        "SprintQualifyingResults" if sprint else "QualifyingResults"
    )
    grid = {}
    for race in _races(payload):
        for result in race.get(qualifying_key, []):
            driver_id = result.get("Driver", {}).get("driverId")
            position = _positive_int(result.get("position"))
            if driver_id and position is not None:
                grid[str(driver_id)] = position
    return grid


def _standing_entries(payload: dict[str, Any], key: str) -> list[dict[str, Any]]:
    standings_lists = (
        _mr_data(payload)
        .get("StandingsTable", {})
        .get("StandingsLists", [])
    )
    if not standings_lists:
        return []
    latest = max(
        standings_lists,
        key=lambda item: _positive_int(item.get("round")) or 0,
    )
    return latest.get(key, [])


def parse_driver_standings(
    payload: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    """Normalize official Jolpica driver standings by stable driver ID."""
    standings = {}
    for item in _standing_entries(payload, "DriverStandings"):
        driver = item.get("Driver", {})
        driver_id = driver.get("driverId")
        if not driver_id:
            continue
        constructors = item.get("Constructors", [])
        constructor = constructors[-1] if constructors else {}
        standings[str(driver_id)] = {
            "driver_id": str(driver_id),
            "driver": _driver_name(driver),
            "constructor_id": str(constructor.get("constructorId") or "unknown"),
            "constructor": str(constructor.get("name") or "Unknown"),
            "position": _positive_int(item.get("position")),
            "points": _as_float(item.get("points")),
            "wins": _as_int(item.get("wins")) or 0,
        }
    return standings


def parse_constructor_standings(
    payload: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    """Normalize official Jolpica constructor standings by stable constructor ID."""
    standings = {}
    for item in _standing_entries(payload, "ConstructorStandings"):
        constructor = item.get("Constructor", {})
        constructor_id = constructor.get("constructorId")
        if not constructor_id:
            continue
        standings[str(constructor_id)] = {
            "constructor_id": str(constructor_id),
            "constructor": str(constructor.get("name") or "Unknown"),
            "position": _positive_int(item.get("position")),
            "points": _as_float(item.get("points")),
        }
    return standings


def _rank_map(points: dict[str, float], identities: Iterable[str]) -> dict[str, int]:
    ordered = sorted(
        identities,
        key=lambda identity: (-points.get(identity, 0.0), identity),
    )
    return {identity: rank for rank, identity in enumerate(ordered, start=1)}


def _form_mean(history: Sequence[float]) -> float:
    return sum(history) / len(history) if history else 0.0


def build_feature_row(
    *,
    driver_id: str,
    constructor_id: str,
    circuit_id: str,
    round_num: int,
    total_rounds: int,
    is_sprint: bool,
    grid_position: Optional[int],
    driver_points: dict[str, float],
    driver_ranks: dict[str, int],
    constructor_points: dict[str, float],
    constructor_ranks: dict[str, int],
    driver_form: dict[str, Sequence[float]],
    constructor_form: dict[str, Sequence[float]],
    driver_dnf_form: Optional[dict[str, Sequence[float]]] = None,
    constructor_dnf_form: Optional[dict[str, Sequence[float]]] = None,
) -> dict[str, Any]:
    return {
        "driver_id": driver_id,
        "constructor_id": constructor_id,
        "circuit_id": circuit_id,
        "driver_points": driver_points.get(driver_id, 0.0),
        "driver_rank": driver_ranks.get(driver_id, len(driver_ranks) + 1),
        "constructor_points": constructor_points.get(constructor_id, 0.0),
        "constructor_rank": constructor_ranks.get(
            constructor_id, len(constructor_ranks) + 1
        ),
        "driver_form_last3": _form_mean(driver_form.get(driver_id, deque())),
        "team_form_last3": _form_mean(
            constructor_form.get(constructor_id, deque())
        ),
        "driver_dnf_rate_last5": _form_mean(
            (driver_dnf_form or {}).get(driver_id, deque())
        ),
        "team_dnf_rate_last5": _form_mean(
            (constructor_dnf_form or {}).get(constructor_id, deque())
        ),
        "round_progress": round_num / total_rounds if total_rounds else 0.0,
        "is_sprint": int(is_sprint),
        "grid_position": grid_position,
    }


def build_training_dataset(
    client: JolpicaClient,
    years: Optional[Iterable[int]] = None,
    *,
    refresh_years: Iterable[int] = (),
    allow_empty_years: Iterable[int] = (),
) -> pd.DataFrame:
    """Build leak-free per-driver session rows in chronological order.

    Points and form are updated only after feature rows for the current session
    have been emitted. Historical targets use the current points system so the
    model predicts today's race/sprint awards rather than retired scoring rules.
    """
    if years is None:
        years = range(2010, datetime.now(timezone.utc).year + 1)
    refresh_year_set = {int(year) for year in refresh_years}
    allow_empty_year_set = {int(year) for year in allow_empty_years}
    rows: list[dict[str, Any]] = []
    for year in years:
        refresh = year in refresh_year_set
        if refresh:
            schedule_payload = client.fetch_schedule(year, refresh=True)
            race_payload = client.fetch_race_results(year, refresh=True)
            sprint_payload = client.fetch_sprint_results(year, refresh=True)
        else:
            schedule_payload = client.fetch_schedule(year)
            race_payload = client.fetch_race_results(year)
            sprint_payload = client.fetch_sprint_results(year)
        sessions = parse_result_sessions(year, race_payload, sprint_payload)
        if not sessions:
            if year in allow_empty_year_set:
                continue
            raise RuntimeError(f"No Jolpica race results found for training year {year}")

        schedule = parse_schedule(schedule_payload)
        total_rounds = max(
            [event["round"] for event in schedule]
            + [session["round"] for session in sessions]
        )
        driver_points: dict[str, float] = defaultdict(float)
        constructor_points: dict[str, float] = defaultdict(float)
        driver_form: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=3))
        constructor_form: dict[str, deque[float]] = defaultdict(
            lambda: deque(maxlen=3)
        )
        driver_dnf_form: dict[str, deque[float]] = defaultdict(
            lambda: deque(maxlen=5)
        )
        constructor_dnf_form: dict[str, deque[float]] = defaultdict(
            lambda: deque(maxlen=5)
        )
        known_drivers: set[str] = set()
        known_constructors: set[str] = set()

        for session in sessions:
            results = session["results"]
            known_drivers.update(result["driver_id"] for result in results)
            known_constructors.update(
                result["constructor_id"] for result in results
            )
            driver_ranks = _rank_map(driver_points, known_drivers)
            constructor_ranks = _rank_map(
                constructor_points, known_constructors
            )
            team_points_this_session: dict[str, float] = defaultdict(float)
            team_dnf_this_session: dict[str, list[float]] = defaultdict(list)
            for result in results:
                feature = build_feature_row(
                    driver_id=result["driver_id"],
                    constructor_id=result["constructor_id"],
                    circuit_id=session["circuit_id"],
                    round_num=session["round"],
                    total_rounds=total_rounds,
                    is_sprint=session["is_sprint"],
                    grid_position=result["grid_position"],
                    driver_points=driver_points,
                    driver_ranks=driver_ranks,
                    constructor_points=constructor_points,
                    constructor_ranks=constructor_ranks,
                    driver_form=driver_form,
                    constructor_form=constructor_form,
                    driver_dnf_form=driver_dnf_form,
                    constructor_dnf_form=constructor_dnf_form,
                )
                feature["year"] = year
                feature["round"] = session["round"]
                feature["session_type"] = session["type"]
                feature["session_date"] = session.get("date", "")
                feature[TARGET_COLUMN] = result["points"]
                feature[TARGET_DNF_COLUMN] = result.get("did_not_finish")
                rows.append(feature)
                team_points_this_session[result["constructor_id"]] += result[
                    "points"
                ]
                dnf_label = result.get("did_not_finish")
                if dnf_label is not None:
                    team_dnf_this_session[result["constructor_id"]].append(
                        float(bool(dnf_label))
                    )

            for result in results:
                driver_points[result["driver_id"]] += result["points"]
                driver_form[result["driver_id"]].append(result["points"])
                dnf_label = result.get("did_not_finish")
                if dnf_label is not None:
                    driver_dnf_form[result["driver_id"]].append(
                        float(bool(dnf_label))
                    )
            for constructor_id, points in team_points_this_session.items():
                constructor_points[constructor_id] += points
                constructor_form[constructor_id].append(points)
            for constructor_id, dnf_labels in team_dnf_this_session.items():
                if dnf_labels:
                    constructor_dnf_form[constructor_id].append(
                        sum(dnf_labels) / len(dnf_labels)
                    )

    return pd.DataFrame(rows)
