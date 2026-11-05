from dataclasses import dataclass

import pytest

from services import season_forecast_model_storage as model_storage


@dataclass
class FakeBucketInfo:
    id: str
    public: bool = False


class FakeBucket:
    def __init__(self):
        self.objects: dict[str, bytes] = {}

    def upload(self, path: str, content: bytes, options: dict) -> None:
        self.objects[path] = content

    def download(self, path: str) -> bytes:
        if path not in self.objects:
            raise RuntimeError("Object not found")
        return self.objects[path]


class FakeStorage:
    def __init__(self, buckets: list[FakeBucketInfo] | None = None):
        self.bucket_info = {bucket.id: bucket for bucket in buckets or []}
        self.bucket_objects = {bucket_id: FakeBucket() for bucket_id in self.bucket_info}

    def list_buckets(self) -> list[FakeBucketInfo]:
        return list(self.bucket_info.values())

    def create_bucket(self, bucket_id: str, *, options: dict) -> None:
        self.bucket_info[bucket_id] = FakeBucketInfo(
            id=bucket_id,
            public=bool(options.get("public", False)),
        )
        self.bucket_objects[bucket_id] = FakeBucket()

    def from_(self, bucket_id: str) -> FakeBucket:
        if bucket_id not in self.bucket_objects:
            raise RuntimeError("Bucket not found")
        return self.bucket_objects[bucket_id]


class FakeSupabase:
    def __init__(self, buckets: list[FakeBucketInfo] | None = None):
        self.storage = FakeStorage(buckets)


def test_publish_and_fetch_model_uses_private_version_and_verified_manifest(
    tmp_path,
    monkeypatch,
):
    bucket_name = "test-season-models"
    monkeypatch.setenv("SEASON_FORECAST_MODEL_BUCKET", bucket_name)
    model_path = tmp_path / "model.pkl"
    model_path.write_bytes(b"trusted model artifact")
    client = FakeSupabase()

    manifest = model_storage.publish_model_artifact(
        model_path,
        metadata={"trained_through_year": 2026},
        client=client,
    )
    fetched = model_storage.fetch_latest_model_artifact(client=client)

    assert client.storage.bucket_info[bucket_name].public is False
    assert manifest["artifact_path"].startswith("models/")
    assert manifest["trained_through_year"] == 2026
    assert fetched == (b"trusted model artifact", manifest)


def test_fetch_rejects_a_model_that_does_not_match_its_checksum(
    tmp_path,
    monkeypatch,
):
    bucket_name = "test-season-models"
    monkeypatch.setenv("SEASON_FORECAST_MODEL_BUCKET", bucket_name)
    model_path = tmp_path / "model.pkl"
    model_path.write_bytes(b"original")
    client = FakeSupabase()
    manifest = model_storage.publish_model_artifact(model_path, client=client)
    bucket = client.storage.from_(bucket_name)
    bucket.objects[manifest["artifact_path"]] = b"corrupt"

    with pytest.raises(RuntimeError, match="checksum"):
        model_storage.fetch_latest_model_artifact(client=client)


def test_publish_refuses_to_write_to_a_public_bucket(tmp_path, monkeypatch):
    bucket_name = "test-season-models"
    monkeypatch.setenv("SEASON_FORECAST_MODEL_BUCKET", bucket_name)
    model_path = tmp_path / "model.pkl"
    model_path.write_bytes(b"model")
    client = FakeSupabase([FakeBucketInfo(bucket_name, public=True)])

    with pytest.raises(RuntimeError, match="must be private"):
        model_storage.publish_model_artifact(model_path, client=client)
