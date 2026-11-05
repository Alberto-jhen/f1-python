#!/usr/bin/env python3
"""Train the independent season-points model from cached Jolpica results."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import pickle
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import brier_score_loss, mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.season_forecast_data import (  # noqa: E402
    CATEGORICAL_FEATURES,
    FEATURE_COLUMNS,
    JOLPICA_CACHE_DIR,
    NUMERIC_FEATURES,
    TARGET_DNF_COLUMN,
    TARGET_COLUMN,
    JolpicaClient,
    build_training_dataset,
)
from services.season_forecast_model_storage import (
    ARTIFACT_SCHEMA_VERSION,
    create_supabase_client,
    publish_model_artifact,
    read_latest_model_manifest,
)


MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODEL_DIR / "season_forecast_model.pkl"
DEFAULT_START_YEAR = 2010
DEFAULT_END_YEAR = datetime.now(timezone.utc).year
RECENCY_HALF_LIVES = (None, 2.0, 4.0, 6.0, 8.0)
MAX_VALIDATION_FOLDS = 5


def create_preprocessor() -> ColumnTransformer:
    """Build preprocessing shared by the points and DNF models."""
    return ColumnTransformer(
        transformers=[
            (
                "numeric",
                SimpleImputer(strategy="median", add_indicator=True),
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )


def create_model() -> Pipeline:
    """Build the shared preprocessing and points regression pipeline."""
    return Pipeline(
        steps=[
            ("preprocessing", create_preprocessor()),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=160,
                    max_depth=14,
                    min_samples_leaf=4,
                    max_features=0.9,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def create_dnf_model() -> Pipeline:
    """Build a probabilistic classifier for unclassified retirements."""
    return Pipeline(
        steps=[
            ("preprocessing", create_preprocessor()),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=160,
                    max_depth=12,
                    min_samples_leaf=8,
                    max_features=0.9,
                    random_state=43,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def _sample_weights(training_data, half_life_years, reference_year: int):
    if half_life_years is None:
        return None
    age = np.maximum(
        0.0,
        float(reference_year) - training_data["year"].to_numpy(dtype=float),
    )
    return np.exp2(-age / float(half_life_years))


def _fit_regressor(model, training_data, half_life_years, reference_year):
    sample_weights = _sample_weights(
        training_data, half_life_years, reference_year
    )
    fit_options = (
        {"regressor__sample_weight": sample_weights}
        if sample_weights is not None
        else {}
    )
    model.fit(
        training_data[FEATURE_COLUMNS],
        training_data[TARGET_COLUMN].to_numpy(dtype=float),
        **fit_options,
    )
    return model


def _fit_dnf_classifier(training_data, half_life_years):
    if TARGET_DNF_COLUMN not in training_data:
        return None
    labelled = training_data[training_data[TARGET_DNF_COLUMN].notna()]
    if labelled.empty:
        return None
    classifier = create_dnf_model()
    sample_weights = _sample_weights(
        labelled, half_life_years, int(labelled["year"].max())
    )
    fit_options = (
        {"classifier__sample_weight": sample_weights}
        if sample_weights is not None
        else {}
    )
    classifier.fit(
        labelled[FEATURE_COLUMNS],
        labelled[TARGET_DNF_COLUMN].astype(int).to_numpy(),
        **fit_options,
    )
    return classifier


def _positive_probability(classifier, features) -> np.ndarray:
    probabilities = classifier.predict_proba(features)
    classes = classifier.named_steps["classifier"].classes_
    positive_indices = np.flatnonzero(np.asarray(classes) == 1)
    if not len(positive_indices):
        return np.zeros(len(features), dtype=float)
    return np.asarray(probabilities[:, positive_indices[0]], dtype=float)


def _half_life_label(half_life_years) -> str:
    return (
        "unweighted"
        if half_life_years is None
        else f"{float(half_life_years):g}y"
    )


def _validation_years(training_data, current_year: int) -> list[int]:
    years = sorted(int(year) for year in training_data["year"].unique())
    eligible_years = [
        year
        for year in years
        if year < current_year and any(training_year < year for training_year in years)
    ]
    return eligible_years[-MAX_VALIDATION_FOLDS:]


def training_data_fingerprint(training_data) -> str:
    """Hash the ordered features and labels used to fit either model."""
    columns = [
        column
        for column in (
            "year",
            "round",
            "session_type",
            "session_date",
            *FEATURE_COLUMNS,
            TARGET_COLUMN,
            TARGET_DNF_COLUMN,
        )
        if column in training_data
    ]
    sort_columns = [
        column
        for column in ("year", "round", "session_type", "driver_id")
        if column in training_data
    ]
    ordered = training_data[columns]
    if sort_columns:
        ordered = ordered.sort_values(sort_columns, kind="stable")
    canonical_json = ordered.to_json(
        orient="records",
        date_format="iso",
        double_precision=12,
    )
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def last_processed_session(training_data) -> Optional[dict[str, Any]]:
    required_columns = {"year", "round", "session_type"}
    if not required_columns.issubset(training_data.columns) or training_data.empty:
        return None
    ordered = training_data.assign(
        _session_order=training_data["session_type"].map(
            {"sprint": 0, "race": 1}
        ).fillna(2)
    ).sort_values(["year", "round", "_session_order"], kind="stable")
    latest = ordered.iloc[-1]
    session = {
        "year": int(latest["year"]),
        "round": int(latest["round"]),
        "type": str(latest["session_type"]),
    }
    if "session_date" in latest and latest["session_date"]:
        session["date"] = str(latest["session_date"])
    if "circuit_id" in latest and latest["circuit_id"]:
        session["circuit_id"] = str(latest["circuit_id"])
    return session


def model_is_up_to_date(
    manifest: Optional[dict[str, Any]],
    data_fingerprint: str,
) -> bool:
    return bool(
        manifest
        and manifest.get("artifact_schema_version") == ARTIFACT_SCHEMA_VERSION
        and manifest.get("training_data_fingerprint") == data_fingerprint
    )


def train_with_temporal_holdout(
    training_data,
    model_path: Path = MODEL_PATH,
    *,
    current_year: Optional[int] = None,
) -> dict[str, Any]:
    """Select recency weights with walk-forward validation, then fit all rows."""
    if training_data.empty:
        raise ValueError("Training data is empty")
    if "year" not in training_data or TARGET_COLUMN not in training_data:
        raise ValueError("Training data must include year and target_points columns")
    if not set(FEATURE_COLUMNS).issubset(training_data.columns):
        raise ValueError("Training data is missing required model features")

    if current_year is None:
        current_year = int(training_data["year"].max()) + 1
    validation_years = _validation_years(training_data, current_year)
    if not validation_years:
        raise ValueError(
            "Walk-forward validation needs at least two completed training seasons."
        )

    candidate_scores = {half_life: [] for half_life in RECENCY_HALF_LIVES}
    latest_fold = None
    for validation_year in validation_years:
        train = training_data[training_data["year"] < validation_year]
        test = training_data[training_data["year"] == validation_year]
        if train.empty or test.empty:
            continue
        reference_year = int(train["year"].max())
        fold_predictions = {}
        for half_life in RECENCY_HALF_LIVES:
            validation_model = _fit_regressor(
                create_model(),
                train,
                half_life,
                reference_year,
            )
            predictions = np.asarray(
                validation_model.predict(test[FEATURE_COLUMNS]),
                dtype=float,
            )
            candidate_scores[half_life].append(
                float(mean_absolute_error(test[TARGET_COLUMN], predictions))
            )
            fold_predictions[half_life] = predictions
        latest_fold = {
            "year": validation_year,
            "train": train,
            "test": test,
            "predictions": fold_predictions,
        }

    completed_folds = len(candidate_scores[None])
    if latest_fold is None or not completed_folds:
        raise ValueError("No usable walk-forward validation folds were found.")

    baseline_scores = candidate_scores[None]
    baseline_mean = float(np.mean(baseline_scores))
    selected_half_life = None
    if completed_folds >= 3 and baseline_mean > 0:
        required_wins = math.ceil(completed_folds * 0.6)
        improving_candidates = []
        for half_life in RECENCY_HALF_LIVES:
            if half_life is None:
                continue
            fold_scores = candidate_scores[half_life]
            mean_score = float(np.mean(fold_scores))
            fold_wins = sum(
                candidate < baseline - 1e-9
                for candidate, baseline in zip(fold_scores, baseline_scores)
            )
            if (
                mean_score <= baseline_mean * 0.99
                and fold_wins >= required_wins
            ):
                improving_candidates.append((mean_score, half_life))
        if improving_candidates:
            selected_half_life = min(improving_candidates)[1]

    selected_predictions = latest_fold["predictions"][selected_half_life]
    latest_train = latest_fold["train"]
    latest_test = latest_fold["test"]
    residuals = latest_test[TARGET_COLUMN].to_numpy(dtype=float) - selected_predictions

    dnf_fold_scores = []
    latest_dnf_score = None
    latest_dnf_samples = 0
    if TARGET_DNF_COLUMN in training_data:
        for validation_year in validation_years:
            dnf_train = training_data[
                (training_data["year"] < validation_year)
                & training_data[TARGET_DNF_COLUMN].notna()
            ]
            dnf_test = training_data[
                (training_data["year"] == validation_year)
                & training_data[TARGET_DNF_COLUMN].notna()
            ]
            if dnf_train.empty or dnf_test.empty:
                continue
            classifier = _fit_dnf_classifier(dnf_train, selected_half_life)
            probabilities = _positive_probability(
                classifier, dnf_test[FEATURE_COLUMNS]
            )
            labels = dnf_test[TARGET_DNF_COLUMN].astype(int).to_numpy()
            brier_score = float(brier_score_loss(labels, probabilities))
            dnf_fold_scores.append((validation_year, brier_score, len(dnf_test)))
            if validation_year == latest_fold["year"]:
                latest_dnf_score = brier_score
                latest_dnf_samples = len(dnf_test)

    candidate_mean_scores = {
        _half_life_label(half_life): round(float(np.mean(scores)), 4)
        for half_life, scores in candidate_scores.items()
    }
    metrics = {
        "target": "current_points_per_driver_session",
        "mae": round(
            float(mean_absolute_error(latest_test[TARGET_COLUMN], selected_predictions)),
            4,
        ),
        "r2": (
            round(float(r2_score(latest_test[TARGET_COLUMN], selected_predictions)), 4)
            if len(latest_test) > 1
            else None
        ),
        "residual_std": round(float(np.std(residuals)), 4),
        "train_through_year": int(latest_train["year"].max()),
        "test_year": int(latest_fold["year"]),
        "train_samples": int(len(latest_train)),
        "test_samples": int(len(latest_test)),
        "walk_forward_years": validation_years,
        "walk_forward_mean_mae": round(
            float(np.mean(candidate_scores[selected_half_life])), 4
        ),
        "walk_forward_mae_by_year": {
            str(year): round(score, 4)
            for year, score in zip(
                validation_years,
                candidate_scores[selected_half_life],
            )
        },
        "recency_half_life_years": selected_half_life,
        "recency_candidate_mean_mae": candidate_mean_scores,
        "dnf_brier_score": (
            round(latest_dnf_score, 4)
            if latest_dnf_score is not None
            else None
        ),
        "dnf_walk_forward_brier_score": (
            round(
                float(np.mean([score for _, score, _ in dnf_fold_scores])),
                4,
            )
            if dnf_fold_scores
            else None
        ),
        "dnf_validation_year": (
            int(latest_fold["year"])
            if latest_dnf_score is not None
            else None
        ),
        "dnf_test_samples": latest_dnf_samples,
    }

    final_model = _fit_regressor(
        create_model(),
        training_data,
        selected_half_life,
        int(training_data["year"].max()),
    )
    final_dnf_model = _fit_dnf_classifier(training_data, selected_half_life)
    training_years = [
        int(training_data["year"].min()),
        int(training_data["year"].max()),
    ]
    artifact = {
        "artifact_schema_version": ARTIFACT_SCHEMA_VERSION,
        "model": final_model,
        "dnf_model": final_dnf_model,
        "validation": metrics,
        "features": FEATURE_COLUMNS,
        "training_years": training_years,
        "trained_through_year": training_years[1],
        "last_processed_session": last_processed_session(training_data),
        "training_data_fingerprint": training_data_fingerprint(training_data),
        "recency_half_life_years": selected_half_life,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = model_path.with_suffix(f"{model_path.suffix}.tmp")
    with temporary_path.open("wb") as model_file:
        pickle.dump(artifact, model_file, protocol=pickle.HIGHEST_PROTOCOL)
    temporary_path.replace(model_path)
    return artifact


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Train the F1 season forecast model from Jolpica"
    )
    parser.add_argument("--start-year", type=int, default=DEFAULT_START_YEAR)
    parser.add_argument("--end-year", type=int, default=DEFAULT_END_YEAR)
    parser.add_argument("--current-year", type=int, default=DEFAULT_END_YEAR)
    parser.add_argument("--model-path", type=Path, default=MODEL_PATH)
    parser.add_argument(
        "--request-interval",
        type=float,
        default=0.3,
        help="Minimum delay between uncached Jolpica requests (seconds)",
    )
    parser.add_argument(
        "--publish",
        action="store_true",
        help="Publish the validated artifact to private Supabase Storage",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Publish even if the training data fingerprint has not changed",
    )
    args = parser.parse_args()
    if args.start_year > args.end_year:
        parser.error("--start-year must be <= --end-year")
    if args.current_year < args.start_year:
        parser.error("--current-year must be >= --start-year")

    storage_client = None
    if args.publish:
        from dotenv import load_dotenv

        load_dotenv(BACKEND_DIR / ".env")
        storage_client = create_supabase_client()

    client = JolpicaClient(
        cache_dir=JOLPICA_CACHE_DIR,
        min_request_interval=args.request_interval,
    )
    dataset = build_training_dataset(
        client,
        range(args.start_year, args.end_year + 1),
        refresh_years={args.end_year},
        allow_empty_years={args.end_year},
    )
    if dataset.empty:
        raise RuntimeError("No completed Jolpica results are available for training.")
    data_fingerprint = training_data_fingerprint(dataset)
    if args.publish:
        latest_manifest = read_latest_model_manifest(storage_client)
        if (
            not args.force
            and model_is_up_to_date(latest_manifest, data_fingerprint)
        ):
            print("No new or corrected results; the published model is up to date.")
            return 0

    print(
        f"Collected {len(dataset)} driver-session rows "
        f"from {args.start_year}–{args.end_year}."
    )
    artifact = train_with_temporal_holdout(
        dataset,
        model_path=args.model_path,
        current_year=args.current_year,
    )
    print(f"Walk-forward validation: {artifact['validation']}")
    print(f"Model saved to {args.model_path}")
    if args.publish:
        manifest = publish_model_artifact(
            args.model_path,
            metadata={
                "created_at": artifact["created_at"],
                "training_data_fingerprint": data_fingerprint,
                "trained_through_year": artifact["trained_through_year"],
                "last_processed_session": artifact["last_processed_session"],
            },
            client=storage_client,
        )
        print(
            "Published season forecast model "
            f"{manifest['sha256'][:12]} to private Supabase Storage."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
