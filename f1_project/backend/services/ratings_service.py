"""Business logic for user ratings (comments and reviews)."""

from uuid import UUID
from datetime import datetime

from core.schemas import RatingCreate, RatingResponse
from repositories.ratings_repository import ratings_repo


class RatingsService:

    def __init__(self):
        self._repo = ratings_repo

    def _to_response(self, data: dict | None) -> RatingResponse | None:
        if not data:
            return None
        return RatingResponse(**data)

    def create_rating(self, profile_id: str, rating: RatingCreate) -> RatingResponse:
        data = rating.model_dump()
        data["profile_id"] = profile_id
        created = self._repo.create(data)
        if not created:
            raise RuntimeError("No se pudo crear la valoración")
        return self._to_response(created)

    def get_rating_by_id(self, rating_id: UUID | str) -> RatingResponse | None:
        return self._to_response(self._repo.get_by_id(rating_id))

    def get_ratings_by_profile(self, profile_id: str) -> list[RatingResponse]:
        rows = self._repo.get_by_profile(profile_id)
        return [RatingResponse(**row) for row in rows]

    def get_most_liked_comments(
        self,
        limit: int = 10,
        since: datetime | None = None,
    ) -> list[RatingResponse]:
        rows = self._repo.get_most_liked_comments(limit=limit, since=since)
        return [RatingResponse(**row) for row in rows]

    def update_rating(
        self,
        profile_id: str,
        rating_id: UUID | str,
        rating: RatingCreate,
    ) -> RatingResponse | None:
        existing = self._repo.get_by_id(rating_id)
        if not existing:
            return None
        if existing.get("profile_id") != profile_id:
            raise PermissionError("No tienes permiso para editar esta valoración")

        data = rating.model_dump()
        data.pop("profile_id", None)
        updated = self._repo.update(rating_id, data)
        return self._to_response(updated)

    def delete_rating(self, profile_id: str, rating_id: UUID | str) -> bool:
        existing = self._repo.get_by_id(rating_id)
        if not existing:
            return False
        if existing.get("profile_id") != profile_id:
            raise PermissionError("No tienes permiso para eliminar esta valoración")

        self._repo.delete(rating_id)
        return True

    def like_rating(self, rating_id: UUID | str) -> RatingResponse | None:
        updated = self._repo.increment_likes(rating_id)
        return self._to_response(updated)


# Module-level singleton
ratings_service = RatingsService()

