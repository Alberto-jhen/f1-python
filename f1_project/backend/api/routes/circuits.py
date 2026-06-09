from fastapi import APIRouter, HTTPException
from services.circuits_service import circuits_service
from core.schemas import CircuitInfo

router = APIRouter(
    prefix="/circuits",
    tags=["Circuits info"]
)

@router.get("/{season_year}/{round_num}")
def get_circuit_info(season_year: int, round_num: int):
    data = circuits_service.get_circuit_details(season_year, round_num)
    
    # Check first if the data exists
    if not data:
        raise HTTPException(status_code=404, detail=f"No info found for year {season_year} round {round_num}")
        
    # If data exists an its a dictionary, check errors.
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
        
    return data