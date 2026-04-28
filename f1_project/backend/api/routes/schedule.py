from fastapi import APIRouter, HTTPException
import services.schedule_service as schedule_service
from core.schemas import YearSchedule, EventDate

router = APIRouter()


@router.get("/data/schedule/{year}", tags=["Schedule"], response_model=YearSchedule)
async def get_year_schedule(year: int):
    return schedule_service.get_year_schedule(year)


@router.get("/events/date", tags=["Schedule"], response_model=EventDate)
def get_event_race_date(year: int, event_name: str):
    try:
        return schedule_service.get_event_race_date(year, event_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching date: {str(e)}")
