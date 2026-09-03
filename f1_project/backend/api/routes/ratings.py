from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException
from services.ratings_service import ratings_service
from core.schemas import RatingCreate, RatingResponse

router = APIRouter()

@router.get("/ratings/most_liked", response_model=list[RatingResponse], tags=["ratings"])
async def get_most_liked_comments(limit: int = 10, since: str | None = None):
    parsed_since = None
    if since:
        try:
            parsed_since = datetime.fromisoformat(since)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="El parámetro since debe tener formato ISO (ej: 2024-01-01T00:00:00)",
            )

    data = ratings_service.get_most_liked_comments(limit=limit, since=parsed_since)

    # Check first if the data exists
    if not data:
        raise HTTPException(status_code=404, detail="No ratings found")

    return data


@router.get("/ratings/profile/{profile_id}", response_model=list[RatingResponse], tags=["ratings"])
async def get_ratings_by_profile(profile_id: str):
    data = ratings_service.get_ratings_by_profile(profile_id)
    if not data:
        raise HTTPException(status_code=404, detail="No ratings found for this user")
    return data


@router.get("/ratings/{rating_id}", response_model=RatingResponse, tags=["ratings"])
async def get_rating_by_id(rating_id: UUID):
    data = ratings_service.get_rating_by_id(rating_id)
    if not data:
        raise HTTPException(status_code=404, detail="Rating not found")
    return data


@router.post("/ratings/{profile_id}", response_model=RatingResponse, tags=["ratings"])
async def create_rating(profile_id: str, rating: RatingCreate):
    try:
        return ratings_service.create_rating(profile_id, rating)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/ratings/{profile_id}/{rating_id}", response_model=RatingResponse, tags=["ratings"])
async def update_rating(profile_id: str, rating_id: UUID, rating: RatingCreate):
    try:
        data = ratings_service.update_rating(profile_id, rating_id, rating)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not data:
        raise HTTPException(status_code=404, detail="Rating not found")
    return data


@router.delete("/ratings/{profile_id}/{rating_id}", tags=["ratings"])
async def delete_rating(profile_id: str, rating_id: UUID):
    try:
        deleted = ratings_service.delete_rating(profile_id, rating_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Rating not found")
    return {"message": "Rating deleted successfully"}


@router.post("/ratings/{rating_id}/like", response_model=RatingResponse, tags=["ratings"])
async def like_rating(rating_id: UUID):
    data = ratings_service.like_rating(rating_id)
    if not data:
        raise HTTPException(status_code=404, detail="Rating not found")
    return data

