from fastapi import APIRouter, HTTPException
from services.circuits_service import circuits_service
from core.schemas import CircuitInfo

router = APIRouter(
    prefix="/circuits",
    tags=["Circuits info"]
)

@router.get("/{season_year}/{round_num}", response_model=CircuitInfo)
def get_circuit_info(season_year: int, round_num: int):
    data = circuits_service.get_circuit_details(season_year, round_num)

    # Check first if the data exists
    if not data:
        raise HTTPException(status_code=404, detail=f"No info found for year {season_year} round {round_num}")

    return data


@router.get("/{season_year}", response_model=list[CircuitInfo])
def get_circuits_by_season(season_year: int):
    data = circuits_service.get_races_by_season(season_year)

    if not data:
        raise HTTPException(status_code=404, detail=f"No circuits found for year {season_year}")

    return data
