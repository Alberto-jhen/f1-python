"""
Inference service for the tyre degradation model.

`TyreDegradationModel` loads the trained model (`models/tyre_deg_model.pkl`)
on module import and exposes `predict()` to obtain the relative degradation
(fuel-corrected delta over the stint's baseline pace) for each lap. Reanchoring
that delta to absolute lap times is handled by the endpoint.
"""
from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any, Union

import numpy as np
import pandas as pd


class TyreDegradationModel:
    """
    Wrapper del modelo de scikit-learn para predicción de degradación.

    Atributos:
        model: Estimador de scikit-learn cargado desde el fichero `.pkl`.
    """

    COMPOUND_MAP: dict[str, int] = {
        "SOFT": 1,
        "MEDIUM": 2,
        "HARD": 3,
    }
    FEATURES: list[str] = ["TyreLife", "Compound", "TrackTemp"]
    MODEL_PATH: Path = Path(__file__).resolve().parent.parent / "models" / "tyre_deg_model.pkl"

    def __init__(self) -> None:
        self.model: Any | None = None
        self._load()

    def _load(self) -> None:
        """Load the model from disk if it exists."""
        if self.MODEL_PATH.exists():
            with open(self.MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
        else:
            print(f"[WARN] Model not found at {self.MODEL_PATH}. "
                  "Run `scripts/train_degradation_model.py` first.")

    def encode_compound(self, compound: str) -> int:
        """Encode the compound name to the numeric value expected by the model."""
        return self.COMPOUND_MAP.get(compound.upper(), 0)

    def predict(self, data: Union[list[dict], pd.DataFrame]) -> np.ndarray:
        """
        Predict the relative degradation for each lap: the fuel-corrected
        seconds lost relative to the fresh-tyre pace of the same stint. This is
        NOT an absolute lap time; the endpoint reanchors it to the real stint
        baseline to obtain comparable lap times.

        Args:
            data: List of dicts or DataFrame with columns `TyreLife`,
                `Compound` (string) and `TrackTemp`.

        Returns:
            Array of degradation deltas in seconds (approximately >= 0).
        """
        if self.model is None:
            raise RuntimeError(
                "Tyre degradation model is not available. "
                "Run the training pipeline before using this service."
            )

        if isinstance(data, pd.DataFrame):
            df = data.copy()
        else:
            df = pd.DataFrame(data)

        df["Compound"] = df["Compound"].apply(self.encode_compound)
        X = df[self.FEATURES]
        return self.model.predict(X)


# Module-level instance consumed by endpoints.
tyre_deg_model = TyreDegradationModel()
