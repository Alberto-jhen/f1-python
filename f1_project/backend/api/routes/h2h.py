from fastapi import APIRouter, HTTPException
import services.h2h_service as h2h_service

router = APIRouter()


@router.get("/data/h2h/{year}/{driver1}/{driver2}", tags=["JSON_data", "H2H"])
async def get_h2h(year: int, driver1: str, driver2: str):
    data = h2h_service.get_h2h_data(year, driver1.upper(), driver2.upper())
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data
