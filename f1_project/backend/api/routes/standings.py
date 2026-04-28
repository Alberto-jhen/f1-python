from fastapi import APIRouter, HTTPException
import services.standings_service as standings_service
from core.schemas import DriverSeasonStanding, DriverCareerStats, OpenF1Standing, GlobalStandingEntry

router = APIRouter()


@router.get("/data/standings/{year}/{number}", tags=["Standings"], response_model=DriverSeasonStanding)
async def get_season_standings(year: str, number: str, code: str = None):
    return standings_service.get_season_championship(year, number, code=code)


@router.get("/data/career/standings/{name}", tags=["Standings"], response_model=DriverCareerStats)
async def get_career_standings(name: str):
    return standings_service.get_career_championship(name)


@router.get("/data/drivers/{year}/{driver_number}", tags=["Standings"], response_model=OpenF1Standing)
def get_openf1_season_total(year: int, driver_number: int):
    data = standings_service.get_openf1_season_standings(year, driver_number)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


@router.get("/standings/global/", tags=["Standings"], response_model=list[GlobalStandingEntry])
def get_current_standings():
    data = standings_service.get_global_standings()
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to connect to F1 data provider")
    return data


@router.get("/standings/{year}/{round_num}", tags=["Standings"], response_model=list[GlobalStandingEntry])
def get_standings_by_round(year: int, round_num: int):
    data = standings_service.get_standings_by_round(year, round_num)
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch standings by round")
    return data
