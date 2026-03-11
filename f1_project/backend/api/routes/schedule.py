from fastapi import APIRouter, HTTPException
import services.schedule_service as schedule_service

router = APIRouter()


@router.get("/data/schedule/{year}", tags=["JSON_data", "Schedule"])
async def get_year_schedule(year: int):
    return schedule_service.get_year_schedule(year)


@router.get("/events/date", tags=["Events"])
def get_event_race_date(year: int, event_name: str):
    try:
        return schedule_service.get_event_race_date(year, event_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error obteniendo fecha: {str(e)}")
