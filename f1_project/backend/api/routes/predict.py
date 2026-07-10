"""
Router for tyre degradation prediction.

GET /predict/degradation/{year}/{track}/{driver}
    Returns two point series (x=TyreLife, y=LapTimeSeconds):
    - `real`: clean telemetry from the driver's longest stint.
    - `predicted`: theoretical curve rebuilt from the model's degradation
      prediction, reanchored to the real stint baseline pace.
"""
from __future__ import annotations

import fastf1
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastf1.core import InvalidSessionError, NoLapDataError

import services.ml_service as ml_service
from core.schemas import DegradationPredictionResponse


router = APIRouter()

# Dry compounds supported by the ML model.
COMPOUND_MAP = {
    "SOFT": 1,
    "MEDIUM": 2,
    "HARD": 3,
}

# Must match the training pipeline (train_degradation_model.py): the model
# predicts a fuel-corrected degradation delta, so we rebuild the lap time using
# the same fuel gain and the same baseline rule (best of the BASELINE_LAPS
# lowest-TyreLife laps).
FUEL_GAIN_PER_LAP = 0.05
BASELINE_LAPS = 3


@router.get(
    "/predict/degradation/{year}/{track}/{driver}",
    tags=["ML"],
    response_model=DegradationPredictionResponse,
)
async def predict_degradation(year: int, track: str, driver: str) -> dict:
    """
    Fetches the driver's longest stint in a race, cleans the laps and returns
    the real series alongside the model's theoretical prediction.
    """
    try:
        session = fastf1.get_session(year, track, "R")
        session.load(laps=True, weather=True)
    except (InvalidSessionError, NoLapDataError) as exc:
        raise HTTPException(status_code=400, detail=f"fastf1 error: {exc}") from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Error loading race session: {exc}"
        ) from exc

    # 1. Retrieve all driver laps.
    driver_laps = session.laps.pick_drivers(driver)
    if driver_laps.empty:
        raise HTTPException(
            status_code=404, detail=f"Driver {driver} not found in {year} {track}"
        )

    # 2. Clean non-representative laps.
    #    - pick_track_status('1'): green flag only.
    #    - Null PitOutTime/PitInTime: discard out-laps and in-laps.
    #    - pick_quicklaps(): statistical traffic/error filter.
    clean = driver_laps.pick_track_status("1")
    clean = clean[clean["PitOutTime"].isna() & clean["PitInTime"].isna()]
    clean = clean.pick_quicklaps()

    if clean.empty:
        raise HTTPException(
            status_code=404,
            detail="No clean laps found for the selected driver.",
        )

    # 3. Merge track temperature and sort by lap number.
    #    get_weather_data() returns a weather-only DataFrame aligned with the laps;
    #    it must be joined onto the laps, not used as a replacement.
    weather = clean.get_weather_data()
    clean = clean.reset_index(drop=True)
    weather = weather.reset_index(drop=True)
    clean = pd.concat(
        [clean, weather.loc[:, ~weather.columns.isin(clean.columns)]],
        axis=1,
    )
    clean = clean.sort_values("LapNumber")

    # 4. Detect stints: compound change or a LapNumber gap (pit stop).
    clean["Stint"] = (
        (clean["Compound"] != clean["Compound"].shift())
        | (clean["LapNumber"].diff() > 1)
    ).cumsum()

    stint_counts = clean.groupby("Stint").size()
    if stint_counts.empty:
        raise HTTPException(
            status_code=404, detail="Could not identify any valid stint."
        )

    longest_stint_id = int(stint_counts.idxmax())
    stint = clean[clean["Stint"] == longest_stint_id].copy()

    # 5. Encode compound and validate it is one of the supported dry compounds.
    stint["CompoundEncoded"] = (
        stint["Compound"].str.upper().map(COMPOUND_MAP)
    )
    if stint["CompoundEncoded"].isna().any():
        raise HTTPException(
            status_code=400,
            detail="The longest stint contains compounds not supported by the model.",
        )

    # 6. Build the model input (one row per lap in the stint).
    model_input = [
        {
            "TyreLife": int(tyre_life),
            "Compound": str(compound),
            "TrackTemp": float(track_temp),
        }
        for tyre_life, compound, track_temp in zip(
            stint["TyreLife"], stint["Compound"], stint["TrackTemp"]
        )
    ]

    try:
        # The model returns relative degradation (fuel-corrected seconds over the
        # baseline pace), NOT an absolute lap time.
        predicted_deltas = ml_service.tyre_deg_model.predict(model_input)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Prediction error: {exc}"
        ) from exc

    # 7. Reanchor the predicted degradation to the REAL baseline pace of this stint.
    #    Baseline = best fuel-corrected lap among the BASELINE_LAPS lowest-TyreLife
    #    laps (same rule as training).
    stint_sorted = stint.sort_values("TyreLife")
    fuel_corrected = (
        stint_sorted["LapTime"].dt.total_seconds()
        + FUEL_GAIN_PER_LAP * (stint_sorted["LapNumber"] - 1)
    )
    baseline = float(fuel_corrected.head(BASELINE_LAPS).min())

    # 8. Build response series (both as raw lap times).
    real_series: list[dict] = []
    predicted_series: list[dict] = []

    for row, delta in zip(stint.itertuples(), predicted_deltas):
        x = int(row.TyreLife)
        lap_number = int(row.LapNumber)
        # Predicted lap time = baseline pace + degradation, reversing the fuel
        # correction so it is comparable with the raw real lap time.
        predicted_fuel_corrected = baseline + float(delta)
        predicted_raw = predicted_fuel_corrected - FUEL_GAIN_PER_LAP * (lap_number - 1)
        real_series.append({"x": x, "y": round(row.LapTime.total_seconds(), 3)})
        predicted_series.append({"x": x, "y": round(predicted_raw, 3)})

    return {"real": real_series, "predicted": predicted_series}
