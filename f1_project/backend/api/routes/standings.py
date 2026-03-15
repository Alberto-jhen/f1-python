from fastapi import APIRouter, HTTPException
import services.standings_service as standings_service

router = APIRouter()


@router.get("/data/standings/{year}/{number}", tags=["JSON_data (own)", "Drivers"])
async def get_season_standings(year: str, number: str):
    return standings_service.get_season_championship(year, number)


@router.get("/data/career/standings/{name}", tags=["JSON_data (own)", "Drivers"])
async def get_career_standings(name: str):
    return standings_service.get_career_championship(name)


@router.get("/data/drivers/{year}/{driver_number}", tags=["JSON_data", "Drivers"])
def get_openf1_season_total(year: int, driver_number: int):
    data = standings_service.get_openf1_season_standings(year, driver_number)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


@router.get("/standings/global/", tags=["Standings"])
def get_current_standings():
    data = standings_service.get_global_standings()
    if data is None:
        raise HTTPException(status_code=500, detail="Error al conectar con el proveedor de datos de F1")
    return data


@router.get("/standings/{year}/{round_num}", tags=["Standings"])
def get_standings_by_round(year: int, round_num: int):
    data = standings_service.get_standings_by_round(year, round_num)
    if data is None:
        raise HTTPException(status_code=500, detail="Error al obtener standings por ronda")
    return data
