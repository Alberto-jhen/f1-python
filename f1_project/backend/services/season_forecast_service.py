"""Live season forecast snapshots and Monte Carlo inference."""

from __future__ import annotations

import json
import logging
import math
import os
import pickle
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

import numpy as np
import pandas as pd

from services.season_forecast_data import (
    BASE_DIR,
    FEATURE_COLUMNS,
    SNAPSHOT_CACHE_DIR,
    JolpicaClient,
    events_from_sessions,
    parse_constructor_standings,
    parse_driver_standings,
    parse_schedule,
    points_for_position,
)
from services.season_forecast_model_storage import (
    fetch_latest_model_artifact,
    read_latest_model_manifest,
)


MODEL_PATH = BASE_DIR / "models" / "season_forecast_model.pkl"
DEFAULT_SIMULATIONS = 10_000
DEFAULT_RANDOM_SEED = 42
SNAPSHOT_SCHEMA_VERSION = 1
MODEL_REFRESH_INTERVAL_SECONDS = 300
logger = logging.getLogger(__name__)


class SeasonForecastUnavailable(RuntimeError):
    """Raised when no usable live or dated Jolpica forecast snapshot exists."""


class SeasonForecastService:
    """Build forecasts from current Jolpica data, with dated snapshot fallback."""

    def __init__(
        self,
        provider: Optional[JolpicaClient] = None,
        model_path: Path = MODEL_PATH,
        snapshot_dir: Path = SNAPSHOT_CACHE_DIR,
        simulations: int = DEFAULT_SIMULATIONS,
        model: Any = None,
        validation: Optional[dict[str, Any]] = None,
        now_factory: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
        random_seed: Optional[int] = DEFAULT_RANDOM_SEED,
        dnf_model: Any = None,
    ):
        self.provider = provider or JolpicaClient()
        self.model_path = Path(model_path)
        self.snapshot_dir = Path(snapshot_dir)
        self.simulations = max(1, int(simulations))
        self._model = model
        self._model_injected = model is not None
        self._dnf_model = dnf_model
        self._validation = validation or {}
        self._now_factory = now_factory
        self._random_seed = random_seed
        self._last_remote_model_check = 0.0
        self._remote_model_checksum: Optional[str] = None

    def get_forecast(self, year: int) -> dict[str, Any]:
        """Return one response-contract payload or raise an explicit unavailable error."""
        try:
            inputs = self.provider.fetch_snapshot_inputs(year)
            snapshot = self._build_snapshot(year, inputs)
            self._save_snapshot(year, snapshot)
            is_stale = False
        except Exception as exc:
            snapshot = self._load_snapshot(year)
            if snapshot is None:
                raise SeasonForecastUnavailable(
                    f"Season forecast unavailable for {year}: Jolpica is unavailable "
                    "and no dated Jolpica snapshot exists."
                ) from exc
            is_stale = True

        model, validation = self._load_model()
        return self._simulate(snapshot, model, validation, is_stale=is_stale)

    def _load_model(self) -> tuple[Any, dict[str, Any]]:
        if not self._model_injected:
            self._refresh_remote_model()
        if self._model is not None:
            return self._model, self._validation
        try:
            with self.model_path.open("rb") as model_file:
                artifact = pickle.load(model_file)
        except Exception as exc:
            raise SeasonForecastUnavailable(
                f"Season forecast model unavailable at {self.model_path}."
            ) from exc
        self._set_model_artifact(artifact)
        return self._model, self._validation
    def _refresh_remote_model(self) -> bool:
        if not (
            os.getenv("SUPABASE_URL")
            and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        ):
            return False
        now = time.monotonic()
        if now - self._last_remote_model_check < MODEL_REFRESH_INTERVAL_SECONDS:
            return False
        self._last_remote_model_check = now

        try:
            manifest = read_latest_model_manifest()
            if manifest is None:
                return False
            if manifest.get("sha256") == self._remote_model_checksum:
                return False
            remote_artifact = fetch_latest_model_artifact()
            if remote_artifact is None:
                return False
            artifact_bytes, manifest = remote_artifact
            artifact = pickle.loads(artifact_bytes)
            if not isinstance(artifact, dict) or "model" not in artifact:
                raise ValueError("Remote artifact does not contain a model pipeline.")
            self._set_model_artifact(artifact)
            self._remote_model_checksum = manifest.get("sha256")
            self._cache_model_bytes(artifact_bytes)
            return True
        except Exception:
            logger.warning(
                "Unable to refresh the remote season forecast model; "
                "continuing with the loaded or local artifact."
            )
            return False

    def _set_model_artifact(self, artifact: Any) -> None:

        if isinstance(artifact, dict) and "model" in artifact:
            self._model = artifact["model"]
            self._dnf_model = artifact.get("dnf_model")
            self._validation = artifact.get("validation") or {}
        else:
            self._model = artifact
            self._dnf_model = None
            self._validation = {}

    def _cache_model_bytes(self, artifact_bytes: bytes) -> None:
        try:
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = self.model_path.with_suffix(
                f"{self.model_path.suffix}.tmp"
            )
            temporary_path.write_bytes(artifact_bytes)
            temporary_path.replace(self.model_path)
        except OSError:
            # A read-only deployment filesystem should not prevent remote inference.
            logger.warning("Unable to cache the remote season forecast model locally.")

    def _snapshot_path(self, year: int) -> Path:
        return self.snapshot_dir / f"{year}.json"

    def _save_snapshot(self, year: int, snapshot: dict[str, Any]) -> None:
        path = self._snapshot_path(year)
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = path.with_suffix(".json.tmp")
            with temporary_path.open("w", encoding="utf-8") as snapshot_file:
                json.dump(snapshot, snapshot_file, ensure_ascii=False)
            temporary_path.replace(path)
        except OSError:
            # Keep serving fresh provider data when the cache filesystem is unavailable.
            return

    def _load_snapshot(self, year: int) -> Optional[dict[str, Any]]:
        path = self._snapshot_path(year)
        try:
            with path.open("r", encoding="utf-8") as snapshot_file:
                snapshot = json.load(snapshot_file)
        except (OSError, json.JSONDecodeError):
            return None
        if (
            not isinstance(snapshot, dict)
            or snapshot.get("year") != year
            or snapshot.get("standings_source") != "jolpica"
            or snapshot.get("schema_version") != SNAPSHOT_SCHEMA_VERSION
            or not _valid_timestamp(snapshot.get("fetched_at"))
            or not isinstance(snapshot.get("standings"), dict)
            or not snapshot["standings"]
            or not isinstance(snapshot.get("constructor_standings"), dict)
            or not isinstance(snapshot.get("sessions"), list)
            or not snapshot["sessions"]
        ):
            return None
        try:
            _assign_missing_positions(snapshot["standings"])
            _assign_missing_positions(snapshot.get("constructor_standings", {}))
        except (TypeError, ValueError):
            return None
        return snapshot

    def _build_snapshot(
        self, year: int, inputs: dict[str, Any]
    ) -> dict[str, Any]:
        if not isinstance(inputs, dict) or inputs.get("year", year) != year:
            raise ValueError("Jolpica returned an invalid season snapshot")
        sessions = inputs.get("sessions")
        if not isinstance(sessions, list) or not sessions:
            raise ValueError("Jolpica snapshot has no completed race or sprint results")
        sessions = sorted(
            sessions,
            key=lambda session: (
                int(session.get("round", 0)),
                0 if session.get("type") == "sprint" else 1,
            ),
        )
        as_of_round = max(int(session["round"]) for session in sessions)

        schedule = inputs.get("schedule")
        if isinstance(schedule, dict):
            schedule = parse_schedule(schedule)
        if not isinstance(schedule, list) or not schedule:
            schedule = events_from_sessions(sessions)
        schedule = sorted(schedule, key=lambda event: int(event.get("round", 0)))

        driver_standings = _normalized_driver_standings(
            inputs.get("driver_standings", {})
        )
        constructor_standings = _normalized_constructor_standings(
            inputs.get("constructor_standings", {})
        )
        official_constructor_ids = set(constructor_standings)
        last_result_by_driver: dict[str, dict[str, Any]] = {}
        accumulated_driver_points: dict[str, float] = defaultdict(float)
        accumulated_constructor_points: dict[str, float] = defaultdict(float)
        for session in sessions:
            for result in session.get("results", []):
                driver_id = str(result.get("driver_id") or "")
                constructor_id = str(result.get("constructor_id") or "unknown")
                if not driver_id:
                    continue
                points = _result_points(result, session.get("type", "race"))
                accumulated_driver_points[driver_id] += points
                accumulated_constructor_points[constructor_id] += points
                last_result_by_driver[driver_id] = result
                if constructor_id not in constructor_standings:
                    constructor_standings[constructor_id] = {
                        "constructor_id": constructor_id,
                        "constructor": str(result.get("constructor") or "Unknown"),
                        "position": None,
                        "points": accumulated_constructor_points[constructor_id],
                    }
        for constructor_id, constructor in constructor_standings.items():
            if constructor_id not in official_constructor_ids:
                constructor["points"] = accumulated_constructor_points[
                    constructor_id
                ]

        for driver_id, result in last_result_by_driver.items():
            official = driver_standings.get(driver_id)
            if official is None:
                official = {
                    "driver_id": driver_id,
                    "driver": str(result.get("driver") or driver_id),
                    "constructor_id": str(result.get("constructor_id") or "unknown"),
                    "constructor": str(result.get("constructor") or "Unknown"),
                    "position": None,
                    "points": accumulated_driver_points[driver_id],
                    "wins": 0,
                }
                driver_standings[driver_id] = official
            else:
                official["constructor_id"] = str(
                    result.get("constructor_id")
                    or official.get("constructor_id")
                    or "unknown"
                )
                official["constructor"] = str(
                    result.get("constructor")
                    or official.get("constructor")
                    or "Unknown"
                )

        _assign_missing_positions(driver_standings)
        _assign_missing_positions(constructor_standings)
        if not driver_standings:
            raise ValueError("Jolpica snapshot has no usable driver standings")

        latest_round_sessions = [
            session for session in sessions if int(session["round"]) == as_of_round
        ]
        latest_session = max(
            latest_round_sessions,
            key=lambda session: 1 if session.get("type") == "race" else 0,
        )
        active_driver_ids = {
            str(result["driver_id"])
            for result in latest_session.get("results", [])
            if result.get("driver_id")
        }
        active_driver_ids = sorted(
            active_driver_ids,
            key=lambda driver_id: (
                _position_sort_key(
                    driver_standings.get(driver_id, {}).get("position")
                ),
                driver_id,
            ),
        )
        if not active_driver_ids:
            raise ValueError("Jolpica snapshot has no active drivers")
        snapshot_time = self._now_factory()
        if snapshot_time.tzinfo is None:
            snapshot_time = snapshot_time.replace(tzinfo=timezone.utc)
        else:
            snapshot_time = snapshot_time.astimezone(timezone.utc)

        return {
            "schema_version": SNAPSHOT_SCHEMA_VERSION,
            "year": year,
            "as_of_round": as_of_round,
            "fetched_at": snapshot_time.isoformat(),
            "standings_source": "jolpica",
            "standings": driver_standings,
            "constructor_standings": constructor_standings,
            "active_driver_ids": active_driver_ids,
            "schedule": schedule,
            "sessions": sessions,
            "qualifying_grids": inputs.get("qualifying_grids", {}),
        }

    def _simulate(
        self,
        snapshot: dict[str, Any],
        model: Any,
        validation: dict[str, Any],
        *,
        is_stale: bool,
    ) -> dict[str, Any]:
        driver_standings = snapshot["standings"]
        drivers = sorted(
            driver_standings.values(),
            key=lambda entry: (
                _position_sort_key(entry.get("position")),
                -float(entry.get("points", 0.0)),
                str(entry.get("driver_id", "")),
            ),
        )
        driver_ids = [str(driver["driver_id"]) for driver in drivers]
        driver_index = {driver_id: index for index, driver_id in enumerate(driver_ids)}
        driver_to_constructor = {
            str(driver["driver_id"]): str(
                driver.get("constructor_id") or "unknown"
            )
            for driver in drivers
        }

        constructor_standings = snapshot.get("constructor_standings", {})
        constructor_ids = {
            str(constructor_id)
            for constructor_id in constructor_standings
        } | set(driver_to_constructor.values())
        constructors = sorted(
            constructor_ids,
            key=lambda constructor_id: (
                _position_sort_key(
                    constructor_standings.get(constructor_id, {}).get("position")
                ),
                -float(
                    constructor_standings.get(constructor_id, {}).get("points", 0.0)
                ),
                constructor_id,
            ),
        )
        constructor_index = {
            constructor_id: index
            for index, constructor_id in enumerate(constructors)
        }
        active_ids = [
            driver_id
            for driver_id in snapshot.get("active_driver_ids", [])
            if driver_id in driver_index
        ]
        if not active_ids:
            raise SeasonForecastUnavailable(
                "Season forecast unavailable: the latest completed event has no active drivers."
            )

        simulation_count = self.simulations
        driver_points = np.tile(
            np.array(
                [float(driver_standings[driver_id].get("points", 0.0)) for driver_id in driver_ids],
                dtype=float,
            ),
            (simulation_count, 1),
        )
        constructor_points = np.tile(
            np.array(
                [
                    float(
                        constructor_standings.get(constructor_id, {}).get("points", 0.0)
                    )
                    for constructor_id in constructors
                ],
                dtype=float,
            ),
            (simulation_count, 1),
        )

        driver_history = np.zeros((simulation_count, len(driver_ids), 3), dtype=float)
        driver_history_count = np.zeros(len(driver_ids), dtype=int)
        team_history = np.zeros((simulation_count, len(constructors), 3), dtype=float)
        team_history_count = np.zeros(len(constructors), dtype=int)
        driver_dnf_history = np.zeros(
            (simulation_count, len(driver_ids), 5), dtype=float
        )
        driver_dnf_history_count = np.zeros(len(driver_ids), dtype=int)
        team_dnf_history = np.zeros(
            (simulation_count, len(constructors), 5), dtype=float
        )
        team_dnf_history_count = np.zeros(len(constructors), dtype=int)
        for driver_id, form in _driver_form_history(snapshot["sessions"]).items():
            if driver_id not in driver_index:
                continue
            index = driver_index[driver_id]
            values = form[-3:]
            driver_history_count[index] = len(values)
            if values:
                driver_history[:, index, 3 - len(values) :] = np.asarray(values)
        for constructor_id, form in _constructor_form_history(
            snapshot["sessions"]
        ).items():
            if constructor_id not in constructor_index:
                continue
            index = constructor_index[constructor_id]
            values = form[-3:]
            team_history_count[index] = len(values)
            if values:
                team_history[:, index, 3 - len(values) :] = np.asarray(values)
        for driver_id, form in _driver_dnf_form_history(
            snapshot["sessions"]
        ).items():
            if driver_id not in driver_index:
                continue
            index = driver_index[driver_id]
            values = form[-5:]
            driver_dnf_history_count[index] = len(values)
            if values:
                driver_dnf_history[:, index, 5 - len(values) :] = np.asarray(values)
        for constructor_id, form in _constructor_dnf_form_history(
            snapshot["sessions"]
        ).items():
            if constructor_id not in constructor_index:
                continue
            index = constructor_index[constructor_id]
            values = form[-5:]
            team_dnf_history_count[index] = len(values)
            if values:
                team_dnf_history[:, index, 5 - len(values) :] = np.asarray(values)

        events = _remaining_events(snapshot)
        total_rounds = max(
            [int(event.get("round", 0)) for event in snapshot.get("schedule", [])]
            + [int(snapshot.get("as_of_round", 0))]
        )
        active_indices = np.array(
            [driver_index[driver_id] for driver_id in active_ids], dtype=int
        )
        active_constructor_indices = np.array(
            [
                constructor_index[driver_to_constructor[driver_id]]
                for driver_id in active_ids
            ],
            dtype=int,
        )
        rng = np.random.default_rng(self._random_seed)
        residual_std = _residual_std(validation)

        for event in events:
            round_num = int(event["round"])
            for session_type in event["remaining_sessions"]:
                grid = _grid_for_session(
                    snapshot.get("qualifying_grids", {}),
                    round_num,
                    session_type,
                )
                driver_ranks = _rank_rows(driver_points)
                constructor_ranks = _rank_rows(constructor_points)
                simulation_indices = np.repeat(
                    np.arange(simulation_count), len(active_ids)
                )
                active_slot_indices = np.tile(
                    np.arange(len(active_ids)), simulation_count
                )
                row_driver_indices = active_indices[active_slot_indices]
                row_constructor_indices = active_constructor_indices[
                    active_slot_indices
                ]
                features = pd.DataFrame(
                    {
                        "driver_id": [active_ids[index] for index in active_slot_indices],
                        "constructor_id": [
                            driver_to_constructor[active_ids[index]]
                            for index in active_slot_indices
                        ],
                        "circuit_id": [event.get("circuit_id") or "unknown"]
                        * len(simulation_indices),
                        "driver_points": driver_points[
                            simulation_indices, row_driver_indices
                        ],
                        "driver_rank": driver_ranks[
                            simulation_indices, row_driver_indices
                        ],
                        "constructor_points": constructor_points[
                            simulation_indices, row_constructor_indices
                        ],
                        "constructor_rank": constructor_ranks[
                            simulation_indices, row_constructor_indices
                        ],
                        "driver_form_last3": _form_values(
                            driver_history,
                            driver_history_count,
                            simulation_indices,
                            row_driver_indices,
                        ),
                        "team_form_last3": _form_values(
                            team_history,
                            team_history_count,
                            simulation_indices,
                            row_constructor_indices,
                        ),
                        "driver_dnf_rate_last5": _form_values(
                            driver_dnf_history,
                            driver_dnf_history_count,
                            simulation_indices,
                            row_driver_indices,
                        ),
                        "team_dnf_rate_last5": _form_values(
                            team_dnf_history,
                            team_dnf_history_count,
                            simulation_indices,
                            row_constructor_indices,
                        ),
                        "round_progress": np.full(
                            len(simulation_indices),
                            round_num / total_rounds if total_rounds else 0.0,
                        ),
                        "is_sprint": np.full(
                            len(simulation_indices), int(session_type == "sprint")
                        ),
                        "grid_position": np.asarray(
                            [
                                grid.get(active_ids[index])
                                for index in active_slot_indices
                            ],
                            dtype=float,
                        ),
                    },
                    columns=FEATURE_COLUMNS,
                )
                expected_points = np.asarray(model.predict(features), dtype=float)
                performance = expected_points.reshape(
                    simulation_count, len(active_ids)
                )
                if residual_std > 0:
                    performance += rng.normal(
                        0.0, residual_std, size=performance.shape
                    )
                dnf_probabilities = _dnf_probabilities(
                    self._dnf_model,
                    features,
                ).reshape(simulation_count, len(active_ids))
                dnf_outcomes = rng.random(performance.shape) < dnf_probabilities
                classified_performance = np.where(
                    dnf_outcomes,
                    -np.inf,
                    performance,
                )
                finish_order = np.argsort(
                    -classified_performance,
                    axis=1,
                    kind="stable",
                )
                finisher_count = np.sum(~dnf_outcomes, axis=1)
                awards_by_position = np.broadcast_to(
                    np.array(
                        [
                            points_for_position(position, session_type)
                            for position in range(1, len(active_ids) + 1)
                        ],
                        dtype=float,
                    ),
                    performance.shape,
                ).copy()
                awards_by_position[
                    np.arange(len(active_ids))[None, :]
                    >= finisher_count[:, None]
                ] = 0.0
                awarded_points = np.zeros_like(performance)
                np.put_along_axis(
                    awarded_points,
                    finish_order,
                    awards_by_position,
                    axis=1,
                )
                driver_points[:, active_indices] += awarded_points

                for constructor_id, constructor_idx in constructor_index.items():
                    constructor_slots = np.flatnonzero(
                        active_constructor_indices == constructor_idx
                    )
                    if not len(constructor_slots):
                        continue
                    session_team_points = awarded_points[:, constructor_slots].sum(axis=1)
                    constructor_points[:, constructor_idx] += session_team_points
                    _append_history(
                        team_history, team_history_count, constructor_idx, session_team_points
                    )
                    session_team_dnf_rate = dnf_outcomes[
                        :, constructor_slots
                    ].mean(axis=1)
                    _append_history(
                        team_dnf_history,
                        team_dnf_history_count,
                        constructor_idx,
                        session_team_dnf_rate,
                    )
                for active_slot, driver_idx in enumerate(active_indices):
                    _append_history(
                        driver_history,
                        driver_history_count,
                        driver_idx,
                        awarded_points[:, active_slot],
                    )
                    _append_history(
                        driver_dnf_history,
                        driver_dnf_history_count,
                        driver_idx,
                        dnf_outcomes[:, active_slot].astype(float),
                    )

        projected_points = driver_points.mean(axis=0)
        current_positions = {
            str(driver["driver_id"]): int(driver["position"])
            for driver in drivers
        }
        projected_order = sorted(
            range(len(driver_ids)),
            key=lambda index: (
                -projected_points[index],
                current_positions.get(driver_ids[index], len(driver_ids) + 1),
            ),
        )
        projected_positions = {
            driver_ids[index]: position
            for position, index in enumerate(projected_order, start=1)
        }
        final_ranks = _rank_rows(driver_points)
        championship_counts = np.sum(final_ranks == 1, axis=0)

        standings = []
        for index, driver in enumerate(drivers):
            driver_id = str(driver["driver_id"])
            standings.append(
                {
                    "driver_id": driver_id,
                    "driver": str(driver.get("driver") or driver_id),
                    "constructor": str(driver.get("constructor") or "Unknown"),
                    "position": projected_positions[driver_id],
                    "current_position": current_positions[driver_id],
                    "current_points": _round_number(
                        float(driver_standings[driver_id].get("points", 0.0))
                    ),
                    "expected_final_points": _round_number(
                        float(projected_points[index])
                    ),
                    "p10_final_points": _round_number(
                        float(np.percentile(driver_points[:, index], 10))
                    ),
                    "p90_final_points": _round_number(
                        float(np.percentile(driver_points[:, index], 90))
                    ),
                    "championship_probability": round(
                        float(championship_counts[index]) / simulation_count, 4
                    ),
                }
            )
        standings.sort(key=lambda entry: entry["position"])

        return {
            "year": int(snapshot["year"]),
            "as_of_round": int(snapshot["as_of_round"]),
            "fetched_at": snapshot["fetched_at"],
            "standings_source": (
                "jolpica_snapshot" if is_stale else snapshot["standings_source"]
            ),
            "is_stale": is_stale,
            "validation": validation,
            "simulations": simulation_count,
            "remaining_events": events,
            "standings": standings,
        }


def _valid_timestamp(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return True


def _normalized_driver_standings(
    payload: Any,
) -> dict[str, dict[str, Any]]:
    if isinstance(payload, dict) and payload and all(
        isinstance(value, dict) and "driver_id" in value
        for value in payload.values()
    ):
        return {str(key): dict(value) for key, value in payload.items()}
    return parse_driver_standings(payload if isinstance(payload, dict) else {})


def _normalized_constructor_standings(
    payload: Any,
) -> dict[str, dict[str, Any]]:
    if isinstance(payload, dict) and payload and all(
        isinstance(value, dict) and "constructor_id" in value
        for value in payload.values()
    ):
        return {str(key): dict(value) for key, value in payload.items()}
    return parse_constructor_standings(payload if isinstance(payload, dict) else {})


def _result_points(result: dict[str, Any], session_type: str) -> float:
    if "points" in result:
        try:
            return float(result["points"])
        except (TypeError, ValueError):
            pass
    return points_for_position(result.get("position"), session_type)


def _assign_missing_positions(standings: dict[str, dict[str, Any]]) -> None:
    ordered = sorted(
        standings.items(),
        key=lambda item: (
            _position_sort_key(item[1].get("position")),
            -float(item[1].get("points", 0.0)),
            str(item[1].get("driver") or item[1].get("constructor") or item[0]),
        ),
    )
    for rank, (identity, entry) in enumerate(ordered, start=1):
        entry.setdefault("position", rank)
        if entry.get("position") is None:
            entry["position"] = rank
        entry.setdefault("points", 0.0)
        entry["position"] = int(entry["position"])
        entry["points"] = float(entry["points"])
        if "driver_id" in entry:
            entry.setdefault("constructor_id", "unknown")
            entry.setdefault("constructor", "Unknown")
            entry.setdefault("driver", identity)
            entry.setdefault("wins", 0)
        else:
            entry.setdefault("constructor_id", identity)
            entry.setdefault("constructor", identity)


def _position_sort_key(value: Any) -> float:
    try:
        position = float(value)
    except (TypeError, ValueError):
        return math.inf
    return position if position > 0 and math.isfinite(position) else math.inf


def _driver_form_history(
    sessions: list[dict[str, Any]],
) -> dict[str, list[float]]:
    histories: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=3))
    for session in sessions:
        for result in session.get("results", []):
            driver_id = str(result.get("driver_id") or "")
            if driver_id:
                histories[driver_id].append(
                    _result_points(result, session.get("type", "race"))
                )
    return {driver_id: list(history) for driver_id, history in histories.items()}


def _constructor_form_history(
    sessions: list[dict[str, Any]],
) -> dict[str, list[float]]:
    histories: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=3))
    for session in sessions:
        session_points: dict[str, float] = defaultdict(float)
        for result in session.get("results", []):
            constructor_id = str(result.get("constructor_id") or "unknown")
            session_points[constructor_id] += _result_points(
                result, session.get("type", "race")
            )
        for constructor_id, points in session_points.items():
            histories[constructor_id].append(points)
    return {constructor_id: list(history) for constructor_id, history in histories.items()}

def _driver_dnf_form_history(
    sessions: list[dict[str, Any]],
) -> dict[str, list[float]]:
    histories: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=5))
    for session in sessions:
        for result in session.get("results", []):
            driver_id = str(result.get("driver_id") or "")
            dnf_label = result.get("did_not_finish")
            if driver_id and dnf_label is not None:
                histories[driver_id].append(float(bool(dnf_label)))
    return {driver_id: list(history) for driver_id, history in histories.items()}


def _constructor_dnf_form_history(
    sessions: list[dict[str, Any]],
) -> dict[str, list[float]]:
    histories: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=5))
    for session in sessions:
        labels_by_constructor: dict[str, list[float]] = defaultdict(list)
        for result in session.get("results", []):
            constructor_id = str(result.get("constructor_id") or "unknown")
            dnf_label = result.get("did_not_finish")
            if dnf_label is not None:
                labels_by_constructor[constructor_id].append(float(bool(dnf_label)))
        for constructor_id, labels in labels_by_constructor.items():
            histories[constructor_id].append(sum(labels) / len(labels))
    return {
        constructor_id: list(history)
        for constructor_id, history in histories.items()
    }


def _remaining_events(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    completed_by_round: dict[int, set[str]] = defaultdict(set)
    for session in snapshot.get("sessions", []):
        completed_by_round[int(session["round"])].add(str(session["type"]))
    as_of_round = int(snapshot["as_of_round"])
    remaining = []
    for event in snapshot.get("schedule", []):
        round_num = int(event.get("round", 0))
        if round_num < as_of_round:
            continue
        completed = completed_by_round.get(round_num, set())
        session_types = []
        if event.get("sprint") and "sprint" not in completed:
            session_types.append("sprint")
        if "race" not in completed:
            session_types.append("race")
        if not session_types:
            continue
        remaining.append(
            {
                "round": round_num,
                "event": str(event.get("event") or "Unknown"),
                "circuit": str(event.get("circuit") or "Unknown"),
                "circuit_id": str(event.get("circuit_id") or "unknown"),
                "date": str(event.get("date") or ""),
                "sprint": bool(event.get("sprint")),
                "remaining_sessions": session_types,
            }
        )
    return remaining


def _grid_for_session(
    qualifying_grids: Any,
    round_num: int,
    session_type: str,
) -> dict[str, Optional[int]]:
    if not isinstance(qualifying_grids, dict):
        return {}
    round_grid = qualifying_grids.get(str(round_num), {})
    if not isinstance(round_grid, dict):
        return {}
    if session_type in round_grid and isinstance(round_grid[session_type], dict):
        return round_grid[session_type]
    # Accept a flat round->driver mapping for snapshots created during early development.
    if all(isinstance(value, (int, type(None))) for value in round_grid.values()):
        return round_grid if session_type == "race" else {}
    return {}


def _rank_rows(points: np.ndarray) -> np.ndarray:
    if points.shape[1] == 0:
        return np.zeros_like(points, dtype=int)
    order = np.argsort(-points, axis=1, kind="stable")
    ranks = np.empty_like(order)
    rank_values = np.broadcast_to(
        np.arange(1, points.shape[1] + 1), order.shape
    )
    np.put_along_axis(ranks, order, rank_values, axis=1)
    return ranks


def _form_values(
    history: np.ndarray,
    history_count: np.ndarray,
    simulation_indices: np.ndarray,
    entity_indices: np.ndarray,
) -> np.ndarray:
    counts = np.maximum(history_count[entity_indices], 1)
    return history[simulation_indices, entity_indices, :].sum(axis=1) / counts


def _append_history(
    history: np.ndarray,
    history_count: np.ndarray,
    entity_index: int,
    new_values: np.ndarray,
) -> None:
    history[:, entity_index, :-1] = history[:, entity_index, 1:]
    history[:, entity_index, -1] = new_values
    history_count[entity_index] = min(
        history.shape[2],
        history_count[entity_index] + 1,
    )


def _dnf_probabilities(model: Any, features: pd.DataFrame) -> np.ndarray:
    if model is None or not hasattr(model, "predict_proba"):
        return np.zeros(len(features), dtype=float)
    try:
        probabilities = np.asarray(model.predict_proba(features), dtype=float)
        estimator = (
            list(model.named_steps.values())[-1]
            if hasattr(model, "named_steps")
            else model
        )
        classes = np.asarray(getattr(estimator, "classes_", []))
        positive_indices = np.flatnonzero(classes == 1)
        if not len(positive_indices):
            return np.zeros(len(features), dtype=float)
        return np.clip(probabilities[:, positive_indices[0]], 0.0, 1.0)
    except (AttributeError, IndexError, TypeError, ValueError):
        return np.zeros(len(features), dtype=float)


def _residual_std(validation: dict[str, Any]) -> float:
    try:
        residual_std = float(validation.get("residual_std", 4.0))
    except (TypeError, ValueError):
        return 4.0
    return max(0.0, residual_std) if math.isfinite(residual_std) else 4.0


def _round_number(value: float) -> float:
    return round(value, 2)


season_forecast_service = SeasonForecastService()
