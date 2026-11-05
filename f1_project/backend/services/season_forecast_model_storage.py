"""Publish and retrieve trusted season forecast model artifacts from Supabase."""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Optional


MODEL_BUCKET = "season-forecast-models"
LATEST_MANIFEST_PATH = "latest.json"
ARTIFACT_SCHEMA_VERSION = 2

def _model_bucket_name() -> str:
    return os.getenv("SEASON_FORECAST_MODEL_BUCKET", MODEL_BUCKET)


def create_supabase_client():
    """Create a service-role client without logging credentials."""
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required "
            "for forecast model storage."
        )
    from supabase import create_client

    return create_client(supabase_url, service_role_key)


def _is_not_found_error(error: Exception) -> bool:
    status_code = getattr(error, "status_code", None)
    if str(status_code) == "404":
        return True
    message = str(error).lower()
    return "not found" in message or "404" in message


def read_latest_model_manifest(client=None) -> Optional[dict[str, Any]]:
    """Read the current model pointer; return ``None`` before the first upload."""
    client = client or create_supabase_client()
    bucket_name = _model_bucket_name()
    try:
        payload = client.storage.from_(bucket_name).download(LATEST_MANIFEST_PATH)
    except Exception as exc:
        if _is_not_found_error(exc):
            return None
        raise RuntimeError(
            "Unable to read the season forecast model manifest from Supabase."
        ) from exc

    try:
        manifest = json.loads(payload)
    except (TypeError, json.JSONDecodeError) as exc:
        raise RuntimeError(
            "The season forecast model manifest is invalid JSON."
        ) from exc
    if not isinstance(manifest, dict):
        raise RuntimeError("The season forecast model manifest must be an object.")
    return manifest


def publish_model_artifact(
    model_path,
    *,
    metadata: Optional[dict[str, Any]] = None,
    client=None,
) -> dict[str, Any]:
    """Upload a versioned model, then atomically promote its manifest pointer."""
    client = client or create_supabase_client()
    storage = client.storage
    bucket_name = _model_bucket_name()
    known_buckets = storage.list_buckets()
    existing_bucket = next(
        (
            bucket
            for bucket in known_buckets
            if getattr(bucket, "id", None) == bucket_name
        ),
        None,
    )
    if existing_bucket is None:
        storage.create_bucket(bucket_name, options={"public": False})
    elif bool(getattr(existing_bucket, "public", False)):
        raise RuntimeError(
            f"Supabase bucket {bucket_name!r} must be private."
        )

    with open(model_path, "rb") as model_file:
        artifact_bytes = model_file.read()
    checksum = hashlib.sha256(artifact_bytes).hexdigest()
    artifact_path = f"models/{checksum}.pkl"
    bucket = storage.from_(bucket_name)
    bucket.upload(
        artifact_path,
        artifact_bytes,
        {
            "content-type": "application/octet-stream",
            "upsert": "true",
        },
    )
    manifest = {
        "artifact_schema_version": ARTIFACT_SCHEMA_VERSION,
        "artifact_path": artifact_path,
        "sha256": checksum,
        **(metadata or {}),
    }
    bucket.upload(
        LATEST_MANIFEST_PATH,
        json.dumps(manifest, sort_keys=True).encode("utf-8"),
        {
            "content-type": "application/json",
            "upsert": "true",
        },
    )
    return manifest


def fetch_latest_model_artifact(
    *,
    client=None,
) -> Optional[tuple[bytes, dict[str, Any]]]:
    """Fetch and checksum-verify the model referenced by the private manifest."""
    client = client or create_supabase_client()
    manifest = read_latest_model_manifest(client)
    if manifest is None:
        return None
    if manifest.get("artifact_schema_version") != ARTIFACT_SCHEMA_VERSION:
        raise RuntimeError("The remote season forecast model schema is unsupported.")

    artifact_path = manifest.get("artifact_path")
    checksum = manifest.get("sha256")
    if (
        not isinstance(artifact_path, str)
        or not artifact_path.startswith("models/")
        or ".." in artifact_path.split("/")
        or not isinstance(checksum, str)
        or len(checksum) != 64
    ):
        raise RuntimeError("The remote season forecast model manifest is malformed.")

    try:
        artifact_bytes = client.storage.from_(_model_bucket_name()).download(
            artifact_path
        )
    except Exception as exc:
        raise RuntimeError(
            "Unable to download the current season forecast model from Supabase."
        ) from exc
    if hashlib.sha256(artifact_bytes).hexdigest() != checksum:
        raise RuntimeError("The remote season forecast model checksum does not match.")
    return artifact_bytes, manifest
