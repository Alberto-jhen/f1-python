from fastapi import APIRouter, HTTPException
import services.plotting_service as plotting_service

router = APIRouter()


@router.get("/data/laps/{year}/{track}/{session}/{driver}", tags=["JSON_data"])
async def laps_json(year: int, track: str, session: str, driver: str):
    data = plotting_service.get_driver_laps_json(year, track, session, driver)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


@router.get("/data/laps/distribution/{year}/{track}/{session}/{num_drivers}", tags=["JSON_data"])
async def lap_distributions(year: int, track: str, session: str, num_drivers: int):
    data = plotting_service.get_violin_data_json(year, track, session, num_drivers)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


@router.get("/data/qualy/overview/{year}/{track}", tags=["JSON_data"])
async def get_qualy_overview_data(year: int, track: str):
    data = plotting_service.get_qualy_overview_json(year, track)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data
