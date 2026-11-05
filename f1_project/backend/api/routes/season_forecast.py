"""Probabilistic driver championship projections for the remaining season."""

from fastapi import APIRouter, HTTPException

from core.schemas import SeasonForecastResponse
from services.season_forecast_service import (
    SeasonForecastUnavailable,
    season_forecast_service,
)


router = APIRouter()


@router.get(
    "/predict/season/{year}",
    tags=["ML"],
    response_model=SeasonForecastResponse,
)
def predict_season(year: int) -> dict:
    try:
        return season_forecast_service.get_forecast(year)
    except SeasonForecastUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
