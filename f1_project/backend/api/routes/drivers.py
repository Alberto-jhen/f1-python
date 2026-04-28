from fastapi import APIRouter, HTTPException
import services.drivers_service as drivers_service
from core.schemas import DriverProfile, DriverInfo

router = APIRouter()


@router.get("/driver/profile/{driver_num}", tags=["Drivers"], response_model=DriverProfile)
async def get_driver_profile(driver_num: int):
    data = drivers_service.get_driver_profile(driver_num)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


@router.get("/data/drivers/{year}/{event_name}/{session_type}", tags=["Drivers"], response_model=list[DriverInfo])
async def get_drivers_full_name_by_year(year: int, event_name: str, session_type: str):
    data = drivers_service.get_season_driver_full_names(year, event_name, session_type)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data
