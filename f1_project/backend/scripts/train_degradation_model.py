#!/usr/bin/env python3
"""
Tyre degradation model training pipeline.

Goal: train a scikit-learn model that, given tyre wear (TyreLife), compound and
track temperature, predicts the tyre's RELATIVE DEGRADATION: how many seconds
slower a lap is compared to the fresh-tyre pace of the same stint. Because this
is a relative delta, the target is independent of circuit and fuel level
(unlike absolute lap time, which varies widely between tracks).

Steps:
1. Collect race sessions from fastf1 for the configured seasons.
2. Merge weather data into each lap.
3. Clean non-representative laps (VSC/SC, in/out laps, traffic).
4. Numeric encoding of the compound.
5. Fuel correction + delta from the stint's baseline pace to isolate the real
   tyre degradation.
6. Train the model and persist it to `models/tyre_deg_model.pkl`.
"""
from __future__ import annotations

import pickle
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd
import fastf1
from fastf1.core import InvalidSessionError, NoLapDataError
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


# -----------------------------------------------------------------------------
# Path configuration
# -----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "tyre_deg_model.pkl"
CACHE_DIR = BASE_DIR / "cache_fastf1"

# Enable fastf1 disk cache (same as `core.config`).
fastf1.Cache.enable_cache(CACHE_DIR)

# -----------------------------------------------------------------------------
# Domain constants
# -----------------------------------------------------------------------------
# Approximate pace gain per lap from fuel burn: 0.05 s.
# The car gets lighter, so the observed lap time is faster than it would be on a
# full tank. We add this effect back so the model learns the tyre's "pure"
# degradation rather than the fuel-induced lightening.
FUEL_GAIN_PER_LAP: float = 0.05

COMPOUND_MAP: dict[str, int] = {
    "SOFT": 1,
    "MEDIUM": 2,
    "HARD": 3,
}

FEATURES = ["TyreLife", "Compound", "TrackTemp"]
# The model predicts RELATIVE DEGRADATION (seconds lost vs the fresh-tyre pace of
# the same stint), not absolute lap time. This makes the target independent of
# circuit and fuel, and produces smooth degradation curves.
TARGET = "DegradationDelta"

# Number of lowest-TyreLife laps used to estimate the stint's baseline pace.
BASELINE_LAPS: int = 3
# Minimum stint length for a reliable baseline and degradation signal.
MIN_STINT_LAPS: int = 5
# Delta bounds to discard anomalous outliers (noise, undercut, odd laps).
DELTA_MIN: float = -1.5
DELTA_MAX: float = 12.0


def _process_race_session(session) -> Optional[pd.DataFrame]:
    """
    Clean a race session and return a DataFrame with features and target.

    Filters applied (fastf1 recommended order):
    1. `pick_track_status('1')`: green flag only, no VSC/SC.
    2. Null PitOutTime/PitInTime: removes out-laps and in-laps.
    3. `pick_quicklaps()`: statistical filter that drops traffic-affected or
       error laps (keeps laps within a threshold from the fastest clean lap).
    4. `get_weather_data()`: adds TrackTemp per lap by temporal proximity.
    5. Stint grouping (Driver + Stint) and target calculation as the fuel-corrected
       delta from the stint's baseline pace.
    """
    laps = session.laps

    # 1. Track status '1' -> green flag only (no safety car / virtual safety car).
    laps = laps.pick_track_status("1")
    if laps.empty:
        return None

    # 2. Remove out-laps (PitOutTime != NaT) and in-laps (PitInTime != NaT).
    laps = laps[laps["PitOutTime"].isna() & laps["PitInTime"].isna()]
    if laps.empty:
        return None

    # 3. Statistical filter: keep laps within a representative pace range.
    laps = laps.pick_quicklaps()
    if laps.empty:
        return None

    # 4. Merge weather data (track temperature).
    #    get_weather_data() returns a weather-only DataFrame aligned with the laps;
    #    it must be joined onto the laps, not used as a replacement.
    weather = laps.get_weather_data()
    laps = laps.reset_index(drop=True)
    weather = weather.reset_index(drop=True)
    laps = pd.concat(
        [laps, weather.loc[:, ~weather.columns.isin(laps.columns)]],
        axis=1,
    )

    # Lap time in seconds.
    laps["LapTimeSeconds"] = laps["LapTime"].dt.total_seconds()

    # Feature: numerically encoded compound.
    laps["Compound"] = laps["Compound"].str.upper().map(COMPOUND_MAP)
    laps = laps[laps["Compound"].notna()]

    # Feature: track temperature.
    laps = laps[laps["TrackTemp"].notna()]

    # We need these columns to group by stint and compute the degradation delta.
    laps = laps.dropna(subset=["LapTimeSeconds", "LapNumber", "TyreLife", "Driver", "Stint"])
    if laps.empty:
        return None

    # Fuel correction: normalises every lap to "full-tank" pace.
    # The car gets ~0.05 s/lap lighter; we add that back to avoid confusing the
    # lightening effect with (smaller) tyre degradation.
    laps["FuelCorrected"] = (
        laps["LapTimeSeconds"] + FUEL_GAIN_PER_LAP * (laps["LapNumber"] - 1)
    )

    # Drop stints that are too short to estimate a reliable baseline and slope.
    stint_sizes = laps.groupby(["Driver", "Stint"])["LapNumber"].transform("size")
    laps = laps[stint_sizes >= MIN_STINT_LAPS]
    if laps.empty:
        return None

    # Stint baseline: best fuel-corrected lap among the BASELINE_LAPS lowest
    # TyreLife laps (the freshest tyres of that stint).
    laps = laps.sort_values(["Driver", "Stint", "TyreLife"])
    baseline = (
        laps.groupby(["Driver", "Stint"])
        .head(BASELINE_LAPS)
        .groupby(["Driver", "Stint"])["FuelCorrected"]
        .min()
        .rename("Baseline")
    )
    laps = laps.merge(baseline, on=["Driver", "Stint"], how="left")

    # Target: relative degradation = how much slower (fuel-corrected) this lap is
    # than the fresh-tyre pace of the same stint.
    laps[TARGET] = laps["FuelCorrected"] - laps["Baseline"]

    # Drop anomalous deltas (noise, undercut, odd laps).
    laps = laps[laps[TARGET].between(DELTA_MIN, DELTA_MAX)]

    # Select final columns and drop any remaining nulls.
    df = laps[FEATURES + [TARGET]].copy()
    df = df.dropna()
    return df


def collect_training_data(years: list[int]) -> pd.DataFrame:
    """
    Iterate each season calendar and collect clean laps.
    """
    chunks: list[pd.DataFrame] = []

    for year in years:
        try:
            schedule = fastf1.get_event_schedule(year, include_testing=False)
        except Exception as exc:
            print(f"[SKIP] Could not get calendar for {year}: {exc}")
            continue

        for _, event in schedule.iterrows():
            event_name = event.get("EventName")
            if not event_name:
                continue

            try:
                session = fastf1.get_session(year, event_name, "R")
                session.load(laps=True, weather=True)
            except (InvalidSessionError, NoLapDataError) as exc:
                print(f"[SKIP] {year} {event_name}: {exc}")
                continue
            except Exception as exc:
                print(f"[SKIP] {year} {event_name}: {exc}")
                continue

            df = _process_race_session(session)
            if df is not None and not df.empty:
                chunks.append(df)
                print(f"[OK] {year} {event_name}: {len(df)} laps added")

    if not chunks:
        raise RuntimeError("No valid laps collected for training.")

    return pd.concat(chunks, ignore_index=True)


def train_and_save_model(df: pd.DataFrame) -> Tuple[RandomForestRegressor, dict]:
    """
    Train a scikit-learn RandomForest and persist the model to disk.
    """
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    metrics = {
        "mae": round(mean_absolute_error(y_test, y_pred), 4),
        "r2": round(r2_score(y_test, y_pred), 4),
    }
    print(f"Validation metrics: {metrics}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved to: {MODEL_PATH}")

    return model, metrics


if __name__ == "__main__":
    training_data = collect_training_data([2024, 2025])
    print(f"Total training samples: {len(training_data)}")
    train_and_save_model(training_data)
