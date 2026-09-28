"""Business logic for user ratings (comments and reviews)."""

from uuid import UUID
from datetime import datetime

from core.schemas import RatingCreate, RatingResponse
from repositories.ratings_repository import ratings_repo


class DuplicateRatingError(Exception):
    """Raised when a profile tries to rate the same race/driver twice."""


class RatingsService:

    def __init__(self):
        self._repo = ratings_repo

    def _to_response(self, data: dict | None) -> RatingResponse | None:
        if not data:
            return None
        return RatingResponse(**data)

    @staticmethod
    def _duplicate_message(driver_id: str | None) -> str:
        if driver_id:
            return (
                "Ya has valorado a este piloto en esta carrera. "
                "Solo puedes valorarlo una vez por Gran Premio."
            )
        return (
            "Ya has valorado esta carrera. "
            "Solo puedes valorarla una vez por Gran Premio."
        )

    def create_rating(self, profile_id: str, rating: RatingCreate) -> RatingResponse:
        data = rating.model_dump()
        data["profile_id"] = profile_id

        existing = self._repo.get_by_profile_and_race(
            profile_id, data["race_id"], data.get("driver_id")
        )
        if existing:
            raise DuplicateRatingError(self._duplicate_message(data.get("driver_id")))

        try:
            created = self._repo.create(data)
        except Exception as exc:
            # Race condition: the unique constraint rejected a concurrent duplicate.
            message = str(exc).lower()
            if "duplicate" in message or "unique" in message or "23505" in message:
                raise DuplicateRatingError(
                    self._duplicate_message(data.get("driver_id"))
                ) from exc
            raise RuntimeError("No se pudo crear la valoración") from exc
        if not created:
            raise RuntimeError("No se pudo crear la valoración")
        return self._to_response(created)

    def get_rating_by_id(self, rating_id: UUID | str) -> RatingResponse | None:
        return self._to_response(self._repo.get_by_id(rating_id))

    def get_all_ratings(
        self,
        race_id: int | None = None,
        sort_by: str = "likes",
        limit: int = 20,
        since: datetime | None = None,
        current_profile_id: str | None = None,
    ) -> list[RatingResponse]:
        rows = self._repo.get_all(
            race_id=race_id,
            sort_by=sort_by,
            limit=limit,
            since=since,
            current_profile_id=current_profile_id,
        )
        return [RatingResponse(**row) for row in rows]

    def get_ratings_by_profile(
        self,
        profile_id: str,
        race_id: int | None = None,
        sort_by: str = "newest",
        limit: int | None = None,
        current_profile_id: str | None = None,
    ) -> list[RatingResponse]:
        rows = self._repo.get_by_profile(
            profile_id,
            race_id=race_id,
            sort_by=sort_by,
            limit=limit,
            current_profile_id=current_profile_id,
        )
        return [RatingResponse(**row) for row in rows]
    
    def get_most_liked_comments(
        self,
        limit: int = 10,
        since: datetime | None = None,
        race_id: int | None = None,
        current_profile_id: str | None = None,
    ) -> list[RatingResponse]:
        rows = self._repo.get_most_liked_comments(
            limit=limit,
            since=since,
            race_id=race_id,
            current_profile_id=current_profile_id,
        )
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

    def like_rating(self, profile_id: str, rating_id: UUID | str) -> RatingResponse | None:
        updated = self._repo.add_like(profile_id, rating_id)
        return self._to_response(updated)

    def unlike_rating(self, profile_id: str, rating_id: UUID | str) -> RatingResponse | None:
        updated = self._repo.remove_like(profile_id, rating_id)
        return self._to_response(updated)


# Module-level singleton
ratings_service = RatingsService()

