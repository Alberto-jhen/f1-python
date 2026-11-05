from __future__ import annotations

from datetime import datetime, timezone
import importlib
import pickle

import numpy as np
import pandas as pd
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from api.routes import season_forecast as season_forecast_route

from scripts.train_season_forecast_model import (
    _sample_weights,
    last_processed_session,
    model_is_up_to_date,
    train_with_temporal_holdout,
    training_data_fingerprint,
)
from services.season_forecast_data import (
    FEATURE_COLUMNS,
    JolpicaClient,
    TARGET_DNF_COLUMN,
    TARGET_COLUMN,
    build_training_dataset,
    parse_result_sessions,
    points_for_position,
)
from services.season_forecast_service import (
    DEFAULT_RANDOM_SEED,
    DEFAULT_SIMULATIONS,
    SeasonForecastService,
    SeasonForecastUnavailable,
)
season_forecast_module = importlib.import_module(
    "services.season_forecast_service"
)

@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    app = FastAPI()
    app.include_router(season_forecast_route.router)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client


def _result(
    driver_id: str,
    given_name: str,
    family_name: str,
    constructor_id: str,
    constructor: str,
    position: int,
    grid: int,
) -> dict:
    return {
        "Driver": {
            "driverId": driver_id,
            "givenName": given_name,
            "familyName": family_name,
        },
        "Constructor": {
            "constructorId": constructor_id,
            "name": constructor,
        },
        "position": str(position),
        "grid": str(grid),
        "status": "Finished",
    }


def _race_payload(year: int) -> dict:
    return {
        "MRData": {
            "RaceTable": {
                "Races": [
                    {
                        "round": "1",
                        "raceName": f"{year} Opening GP",
                        "Circuit": {
                            "circuitId": "opening",
                            "circuitName": "Opening Circuit",
                        },
                        "date": f"{year}-03-01",
                        "Results": [
                            _result("driver-a", "Alex", "One", "team-a", "Team A", 1, 1),
                            _result("driver-b", "Ben", "Two", "team-b", "Team B", 2, 2),
                        ],
                    },
                    {
                        "round": "2",
                        "raceName": f"{year} Second GP",
                        "Circuit": {
                            "circuitId": "second",
                            "circuitName": "Second Circuit",
                        },
                        "date": f"{year}-03-15",
                        "Results": [
                            _result("driver-b", "Ben", "Two", "team-b", "Team B", 1, 1),
                            _result("driver-a", "Alex", "One", "team-a", "Team A", 2, 2),
                        ],
                    },
                ]
            }
        }
    }


def _sprint_payload(year: int) -> dict:
    return {
        "MRData": {
            "RaceTable": {
                "Races": [
                    {
                        "round": "2",
                        "raceName": f"{year} Second GP",
                        "Circuit": {
                            "circuitId": "second",
                            "circuitName": "Second Circuit",
                        },
                        "date": f"{year}-03-14",
                        "SprintResults": [
                            _result("driver-a", "Alex", "One", "team-a", "Team A", 1, 1),
                            _result("driver-b", "Ben", "Two", "team-b", "Team B", 2, 2),
                        ],
                    }
                ]
            }
        }
    }


def _schedule_payload(year: int) -> dict:
    return {
        "MRData": {
            "RaceTable": {
                "Races": [
                    {
                        "round": "1",
                        "raceName": f"{year} Opening GP",
                        "Circuit": {
                            "circuitId": "opening",
                            "circuitName": "Opening Circuit",
                        },
                        "date": f"{year}-03-01",
                    },
                    {
                        "round": "2",
                        "raceName": f"{year} Second GP",
                        "Circuit": {
                            "circuitId": "second",
                            "circuitName": "Second Circuit",
                        },
                        "date": f"{year}-03-15",
                        "Sprint": {"date": f"{year}-03-14"},
                    },
                ]
            }
        }
    }


class FakeHistoricalClient:
    def fetch_schedule(self, year: int) -> dict:
        return _schedule_payload(year)

    def fetch_race_results(self, year: int) -> dict:
        return _race_payload(year)

    def fetch_sprint_results(self, year: int) -> dict:
        return _sprint_payload(year)

class RefreshTrackingClient(FakeHistoricalClient):
    def __init__(self):
        self.refresh_flags: dict[str, bool] = {}

    def fetch_schedule(self, year: int, *, refresh: bool = False) -> dict:
        self.refresh_flags["schedule"] = refresh
        return super().fetch_schedule(year)

    def fetch_race_results(self, year: int, *, refresh: bool = False) -> dict:
        self.refresh_flags["race"] = refresh
        return super().fetch_race_results(year)

    def fetch_sprint_results(self, year: int, *, refresh: bool = False) -> dict:
        self.refresh_flags["sprint"] = refresh
        return super().fetch_sprint_results(year)

class DnfHistoricalClient(FakeHistoricalClient):
    def fetch_race_results(self, year: int) -> dict:
        payload = super().fetch_race_results(year)
        result = payload["MRData"]["RaceTable"]["Races"][0]["Results"][0]
        result["positionText"] = "R"
        result["status"] = "Engine"
        return payload



class FakeProvider:
    def __init__(self, inputs: dict | None = None, error: Exception | None = None):
        self.inputs = inputs or _forecast_inputs()
        self.error = error

    def fetch_snapshot_inputs(self, year: int) -> dict:
        if self.error:
            raise self.error
        return self.inputs


class RankingModel:
    def __init__(self):
        self.frames: list[pd.DataFrame] = []

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        self.frames.append(features.copy())
        return np.where(features["driver_id"].to_numpy() == "driver-a", 100.0, 0.0)
class FixedDnfModel:
    classes_ = np.array([0, 1])

    def predict_proba(self, features: pd.DataFrame) -> np.ndarray:
        dnf_probability = (
            features["driver_id"].to_numpy() == "driver-a"
        ).astype(float)
        return np.column_stack((1.0 - dnf_probability, dnf_probability))


class FakeResponse:
    status_code = 200
    headers = {}

    def __init__(self, payload: dict):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class PagedResultsSession:
    def __init__(self):
        self.headers = {}
        self.calls: list[tuple[str, dict]] = []

    def get(self, url: str, params: dict, timeout):
        self.calls.append((url, params))
        offset = params["offset"]
        driver_id = "driver-a" if offset == 0 else "driver-b"
        result_key = "SprintResults" if url.endswith("/sprint.json") else "Results"
        race = {
            "season": "2025",
            "round": "1",
            "raceName": "Opening GP",
            result_key: [
                _result(
                    driver_id,
                    "Alex" if driver_id == "driver-a" else "Ben",
                    "Driver",
                    "team-a",
                    "Team A",
                    1 if driver_id == "driver-a" else 2,
                    1 if driver_id == "driver-a" else 2,
                )
            ],
        }
        return FakeResponse(
            {
                "MRData": {
                    "total": "2",
                    "limit": "1",
                    "offset": str(offset),
                    "RaceTable": {"Races": [race]},
                }
            }
        )


class FakeClock:
    def __init__(self):
        self.current = 0.0
        self.sleeps: list[float] = []

    def __call__(self) -> float:
        return self.current

    def sleep(self, duration: float) -> None:
        self.sleeps.append(duration)
        self.current += duration


def _forecast_inputs() -> dict:
    def result(driver_id, driver, constructor_id, constructor, position, points):
        return {
            "driver_id": driver_id,
            "driver": driver,
            "constructor_id": constructor_id,
            "constructor": constructor,
            "position": position,
            "grid_position": position,
            "points": points,
            "status": "Finished",
        }

    sessions = [
        {
            "round": 1,
            "event": "Opening GP",
            "circuit_id": "opening",
            "circuit": "Opening Circuit",
            "type": "race",
            "results": [
                result("driver-a", "Alex One", "team-a", "Team A", 2, 18),
                result("driver-b", "Ben Two", "team-b", "Team B", 3, 15),
                result("driver-c", "Chris Three", "team-c", "Team C", 1, 25),
            ],
        },
        {
            "round": 2,
            "event": "Second GP",
            "circuit_id": "second",
            "circuit": "Second Circuit",
            "type": "race",
            "results": [
                result("driver-a", "Alex One", "team-a", "Team A", 1, 25),
                result("driver-b", "Ben Two", "team-b", "Team B", 2, 18),
            ],
        },
    ]
    standings = {
        "driver-c": {
            "driver_id": "driver-c",
            "driver": "Chris Three",
            "constructor_id": "team-c",
            "constructor": "Team C",
            "position": 1,
            "points": 70.0,
            "wins": 2,
        },
        "driver-a": {
            "driver_id": "driver-a",
            "driver": "Alex One",
            "constructor_id": "team-a",
            "constructor": "Team A",
            "position": 2,
            "points": 43.0,
            "wins": 1,
        },
        "driver-b": {
            "driver_id": "driver-b",
            "driver": "Ben Two",
            "constructor_id": "team-b",
            "constructor": "Team B",
            "position": 3,
            "points": 33.0,
            "wins": 0,
        },
    }
    constructors = {
        "team-c": {
            "constructor_id": "team-c",
            "constructor": "Team C",
            "position": 1,
            "points": 70.0,
        },
        "team-a": {
            "constructor_id": "team-a",
            "constructor": "Team A",
            "position": 2,
            "points": 43.0,
        },
        "team-b": {
            "constructor_id": "team-b",
            "constructor": "Team B",
            "position": 3,
            "points": 33.0,
        },
    }
    return {
        "year": 2026,
        "sessions": sessions,
        "schedule": [
            {
                "round": 1,
                "event": "Opening GP",
                "circuit_id": "opening",
                "circuit": "Opening Circuit",
                "date": "2026-03-01",
                "sprint": False,
            },
            {
                "round": 2,
                "event": "Second GP",
                "circuit_id": "second",
                "circuit": "Second Circuit",
                "date": "2026-03-15",
                "sprint": False,
            },
            {
                "round": 3,
                "event": "Sprint GP",
                "circuit_id": "sprint",
                "circuit": "Sprint Circuit",
                "date": "2026-04-01",
                "sprint": True,
            },
        ],
        "driver_standings": standings,
        "constructor_standings": constructors,
        "qualifying_grids": {
            "3": {
                "sprint": {"driver-a": 1, "driver-b": 2},
                "race": {"driver-a": 2, "driver-b": 1},
            }
        },
    }


def test_current_race_and_sprint_scoring():
    assert points_for_position(1, "race") == 25
    assert points_for_position(10, "race") == 1
    assert points_for_position(11, "race") == 0
    assert points_for_position(1, "sprint") == 8
    assert points_for_position(8, "sprint") == 1
    assert points_for_position(9, "sprint") == 0
    assert points_for_position(None, "race") == 0

def test_result_status_distinguishes_dnfs_from_classified_retirements_and_dns():
    def parse_result(result: dict) -> dict:
        payload = {
            "MRData": {
                "RaceTable": {
                    "Races": [{"round": "1", "Results": [result]}]
                }
            }
        }
        return parse_result_sessions(2026, payload)[0]["results"][0]

    unclassified_dnf = _result(
        "driver-a", "Alex", "One", "team-a", "Team A", 20, 1
    )
    unclassified_dnf.update({"positionText": "R", "status": "Engine"})
    classified_retirement = _result(
        "driver-b", "Ben", "Two", "team-b", "Team B", 20, 2
    )
    classified_retirement["status"] = "Engine"
    disqualified = _result(
        "driver-c", "Chris", "Three", "team-c", "Team C", 1, 3
    )
    disqualified["status"] = "Disqualified"
    non_starter = _result(
        "driver-d", "Drew", "Four", "team-d", "Team D", 1, 4
    )
    non_starter.update(
        {"position": "", "positionText": "R", "status": "Did not start"}
    )

    assert parse_result(unclassified_dnf)["did_not_finish"] is True
    assert parse_result(unclassified_dnf)["points"] == 0
    assert parse_result(classified_retirement)["did_not_finish"] is False
    assert parse_result(disqualified)["did_not_finish"] is None
    assert parse_result(non_starter)["did_not_finish"] is None


def test_current_season_training_requests_a_fresh_schedule_and_results():
    client = RefreshTrackingClient()

    build_training_dataset(
        client,
        years=[2026],
        refresh_years={2026},
    )

    assert client.refresh_flags == {
        "schedule": True,
        "race": True,
        "sprint": True,
    }


def test_training_dnf_rates_use_only_prior_sessions():
    dataset = build_training_dataset(DnfHistoricalClient(), years=[2024])
    first_race = dataset[
        (dataset["year"] == 2024)
        & (dataset["round"] == 1)
        & (dataset["driver_id"] == "driver-a")
    ].iloc[0]
    second_round_sprint = dataset[
        (dataset["year"] == 2024)
        & (dataset["round"] == 2)
        & (dataset["session_type"] == "sprint")
        & (dataset["driver_id"] == "driver-a")
    ].iloc[0]

    assert first_race[TARGET_DNF_COLUMN] == 1
    assert first_race["driver_dnf_rate_last5"] == 0
    assert first_race["team_dnf_rate_last5"] == 0
    assert second_round_sprint["driver_dnf_rate_last5"] == 1
    assert second_round_sprint["team_dnf_rate_last5"] == 1


def test_jolpica_client_paginates_caches_and_rate_limits(tmp_path):
    session = PagedResultsSession()
    clock = FakeClock()
    client = JolpicaClient(
        cache_dir=tmp_path / "jolpica",
        session=session,
        min_request_interval=0.25,
        retries=1,
        sleep=clock.sleep,
        clock=clock,
    )

    first = client.fetch_race_results(2025)
    second = client.fetch_race_results(2025)
    sprints = client.fetch_sprint_results(2025)

    assert len(first["MRData"]["RaceTable"]["Races"][0]["Results"]) == 2
    assert second == first
    assert len(sprints["MRData"]["RaceTable"]["Races"][0]["SprintResults"]) == 2
    assert len(session.calls) == 4
    assert session.calls[0][0].endswith("/2025/results.json")
    assert session.calls[1][1]["offset"] == 1
    assert session.calls[2][0].endswith("/2025/sprint.json")
    assert clock.sleeps == [0.25, 0.25, 0.25]
    assert len(list((tmp_path / "jolpica").glob("*.json"))) == 4


def test_training_features_use_only_prior_sessions():
    dataset = build_training_dataset(FakeHistoricalClient(), years=[2024, 2025])
    first_race = dataset[
        (dataset["year"] == 2024)
        & (dataset["round_progress"] == 0.5)
        & (dataset["driver_id"] == "driver-a")
        & (dataset["is_sprint"] == 0)
    ].iloc[0]
    second_round_sprint = dataset[
        (dataset["year"] == 2024)
        & (dataset["round_progress"] == 1.0)
        & (dataset["driver_id"] == "driver-a")
        & (dataset["is_sprint"] == 1)
    ].iloc[0]
    second_round_race = dataset[
        (dataset["year"] == 2024)
        & (dataset["round_progress"] == 1.0)
        & (dataset["driver_id"] == "driver-a")
        & (dataset["is_sprint"] == 0)
    ].iloc[0]

    assert first_race["driver_points"] == 0
    assert first_race["driver_form_last3"] == 0
    assert first_race["grid_position"] == 1
    assert first_race[TARGET_COLUMN] == 25

    assert second_round_sprint["driver_points"] == 25
    assert second_round_sprint["driver_form_last3"] == 25
    assert second_round_sprint["circuit_id"] == "second"
    assert second_round_sprint["grid_position"] == 1
    assert second_round_sprint[TARGET_COLUMN] == 8

    assert second_round_race["driver_points"] == 33
    assert second_round_race["driver_form_last3"] == 16.5
    assert second_round_race[TARGET_COLUMN] == 18


def test_temporal_training_uses_2025_holdout_and_fits_final_artifact(tmp_path):
    dataset = build_training_dataset(FakeHistoricalClient(), years=[2024, 2025])
    artifact = train_with_temporal_holdout(
        dataset,
        model_path=tmp_path / "season_forecast_model.pkl",
    )

    assert artifact["validation"]["train_through_year"] == 2024
    assert artifact["validation"]["test_year"] == 2025
    assert artifact["validation"]["target"] == "current_points_per_driver_session"
    assert artifact["validation"]["train_samples"] > 0
    assert artifact["validation"]["test_samples"] > 0
    assert artifact["validation"]["walk_forward_years"] == [2025]
    assert artifact["validation"]["recency_half_life_years"] is None
    assert (tmp_path / "season_forecast_model.pkl").is_file()
    assert artifact["features"] == FEATURE_COLUMNS
    assert artifact["dnf_model"] is not None
    assert artifact["training_years"] == [2024, 2025]
    assert artifact["last_processed_session"]["type"] == "race"
    assert artifact["last_processed_session"]["round"] == 2
    assert model_is_up_to_date(
        {
            "artifact_schema_version": artifact["artifact_schema_version"],
            "training_data_fingerprint": training_data_fingerprint(dataset),
        },
        artifact["training_data_fingerprint"],
    )
    assert not model_is_up_to_date(
        {
            "artifact_schema_version": artifact["artifact_schema_version"],
            "training_data_fingerprint": "changed",
        },
        artifact["training_data_fingerprint"],
    )
    assert last_processed_session(dataset) == artifact["last_processed_session"]

def test_walk_forward_evaluates_recent_seasons_before_fitting_final_models(tmp_path):
    dataset = build_training_dataset(
        FakeHistoricalClient(),
        years=[2020, 2021, 2022, 2023],
    )
    artifact = train_with_temporal_holdout(
        dataset,
        model_path=tmp_path / "season_forecast_model.pkl",
        current_year=2024,
    )

    assert artifact["validation"]["walk_forward_years"] == [2021, 2022, 2023]
    assert artifact["validation"]["test_year"] == 2023
    assert set(artifact["validation"]["recency_candidate_mean_mae"]) == {
        "unweighted",
        "2y",
        "4y",
        "6y",
        "8y",
    }
    assert artifact["model"] is not None
    assert artifact["dnf_model"] is not None


def test_recency_sample_weights_follow_the_selected_half_life():
    dataset = pd.DataFrame({"year": [2024, 2022, 2020]})

    weights = _sample_weights(dataset, half_life_years=2, reference_year=2024)

    np.testing.assert_allclose(weights, [1.0, 0.5, 0.25])


def test_simulation_samples_dnfs_and_reassigns_points_to_finishers(tmp_path):
    service = SeasonForecastService(
        provider=FakeProvider(),
        snapshot_dir=tmp_path / "snapshots",
        model=RankingModel(),
        dnf_model=FixedDnfModel(),
        validation={"residual_std": 0},
        simulations=3,
        random_seed=7,
    )

    forecast = service.get_forecast(2026)
    by_driver = {entry["driver_id"]: entry for entry in forecast["standings"]}

    assert by_driver["driver-a"]["expected_final_points"] == 43
    assert by_driver["driver-b"]["expected_final_points"] == 66
    assert by_driver["driver-c"]["expected_final_points"] == 70


def test_default_forecast_is_reproducible_for_the_same_inputs(tmp_path):
    service = SeasonForecastService(
        provider=FakeProvider(),
        snapshot_dir=tmp_path / "snapshots",
        model=RankingModel(),
        dnf_model=FixedDnfModel(),
        validation={"residual_std": 4},
    )

    first = service.get_forecast(2026)
    second = service.get_forecast(2026)

    assert service.simulations == DEFAULT_SIMULATIONS == 10_000
    assert service._random_seed == DEFAULT_RANDOM_SEED == 42
    assert first["standings"] == second["standings"]


def test_service_refreshes_remote_model_when_manifest_hash_changes(
    tmp_path,
    monkeypatch,
):
    monkeypatch.setenv("SUPABASE_URL", "https://supabase.invalid")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key")
    first_model = RankingModel()
    first_model.marker = "first"
    second_model = RankingModel()
    second_model.marker = "second"
    first_bytes = pickle.dumps(
        {"model": first_model, "validation": {"residual_std": 0}}
    )
    second_bytes = pickle.dumps(
        {"model": second_model, "validation": {"residual_std": 1}}
    )
    latest = {"sha256": "first"}
    remote_bytes = first_bytes
    monkeypatch.setattr(
        season_forecast_module,
        "read_latest_model_manifest",
        lambda: dict(latest),
    )
    monkeypatch.setattr(
        season_forecast_module,
        "fetch_latest_model_artifact",
        lambda: (remote_bytes, dict(latest)),
    )
    service = SeasonForecastService(model_path=tmp_path / "model.pkl")
    service._last_remote_model_check = -1_000_000

    service._load_model()

    assert service._model.marker == "first"
    latest["sha256"] = "second"
    remote_bytes = second_bytes
    service._last_remote_model_check = -1_000_000
    service._load_model()

    assert service._model.marker == "second"
    assert service._validation["residual_std"] == 1
    assert (tmp_path / "model.pkl").read_bytes() == second_bytes


def test_forecast_simulates_sprint_and_race_but_keeps_inactive_points(tmp_path):
    model = RankingModel()
    provider = FakeProvider()
    service = SeasonForecastService(
        provider=provider,
        snapshot_dir=tmp_path / "snapshots",
        model=model,
        validation={"mae": 3.1, "residual_std": 0},
        simulations=20,
        now_factory=lambda: datetime(2026, 10, 17, tzinfo=timezone.utc),
        random_seed=7,
    )

    forecast = service.get_forecast(2026)
    by_driver = {entry["driver_id"]: entry for entry in forecast["standings"]}

    assert forecast["year"] == 2026
    assert forecast["as_of_round"] == 2
    assert forecast["standings_source"] == "jolpica"
    assert forecast["is_stale"] is False
    assert forecast["validation"]["mae"] == 3.1
    assert forecast["simulations"] == 20
    assert forecast["remaining_events"][0]["remaining_sessions"] == [
        "sprint",
        "race",
    ]
    assert by_driver["driver-c"]["current_points"] == 70
    assert by_driver["driver-c"]["expected_final_points"] == 70
    assert by_driver["driver-a"]["expected_final_points"] == 76
    assert by_driver["driver-a"]["championship_probability"] == 1
    assert by_driver["driver-c"]["championship_probability"] == 0

    assert len(model.frames) == 2
    sprint_features, race_features = model.frames
    assert set(sprint_features["is_sprint"]) == {1}
    assert set(race_features["is_sprint"]) == {0}
    assert sprint_features["grid_position"].dropna().tolist() == [1.0, 2.0] * 20
    assert race_features["grid_position"].dropna().tolist() == [2.0, 1.0] * 20
    assert "driver_form_last3" in sprint_features
    assert "team_form_last3" in sprint_features


def test_provider_outage_uses_only_dated_jolpica_snapshot_and_marks_stale(tmp_path):
    provider = FakeProvider()
    service = SeasonForecastService(
        provider=provider,
        snapshot_dir=tmp_path / "snapshots",
        model=RankingModel(),
        validation={"residual_std": 0},
        simulations=4,
        now_factory=lambda: datetime(2026, 10, 17, tzinfo=timezone.utc),
        random_seed=1,
    )
    first = service.get_forecast(2026)
    provider.error = ConnectionError("provider unavailable")

    stale = service.get_forecast(2026)

    assert first["is_stale"] is False
    assert stale["is_stale"] is True
    assert stale["standings_source"] == "jolpica_snapshot"
    assert stale["fetched_at"] == first["fetched_at"]


def test_provider_outage_without_dated_snapshot_is_unavailable(tmp_path):
    service = SeasonForecastService(
        provider=FakeProvider(error=ConnectionError("provider unavailable")),
        snapshot_dir=tmp_path / "empty-snapshots",
        model=RankingModel(),
        simulations=2,
    )

    with pytest.raises(SeasonForecastUnavailable, match="no dated Jolpica snapshot"):
        service.get_forecast(2026)


@pytest.mark.anyio
async def test_season_forecast_endpoint_returns_contract(client, monkeypatch, tmp_path):
    service = SeasonForecastService(
        provider=FakeProvider(),
        snapshot_dir=tmp_path / "snapshots",
        model=RankingModel(),
        validation={"residual_std": 0},
        simulations=2,
        random_seed=1,
    )
    monkeypatch.setattr(season_forecast_route, "season_forecast_service", service)

    response = await client.get("/predict/season/2026")
    payload = response.json()

    assert response.status_code == 200
    assert {
        "year",
        "as_of_round",
        "fetched_at",
        "standings_source",
        "is_stale",
        "validation",
        "simulations",
        "remaining_events",
        "standings",
    } <= payload.keys()
    assert {
        "position",
        "current_position",
        "current_points",
        "expected_final_points",
        "p10_final_points",
        "p90_final_points",
        "championship_probability",
    } <= payload["standings"][0].keys()


@pytest.mark.anyio
async def test_season_forecast_endpoint_returns_explicit_unavailable(client, monkeypatch):
    class UnavailableService:
        def get_forecast(self, year: int):
            raise SeasonForecastUnavailable(
                f"Season forecast unavailable for {year}: no dated Jolpica snapshot."
            )

    monkeypatch.setattr(
        season_forecast_route, "season_forecast_service", UnavailableService()
    )

    response = await client.get("/predict/season/2026")

    assert response.status_code == 503
    assert "Season forecast unavailable" in response.json()["detail"]
