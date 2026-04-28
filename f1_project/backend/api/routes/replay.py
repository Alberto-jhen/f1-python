from fastapi import APIRouter, HTTPException
from repositories.replay_repository import replay_repo
from core.schemas import ReplayResponse

router = APIRouter()


@router.get("/service/replay/{year}/{track}/{driver_id}", tags=["Replay service"], response_model=ReplayResponse)
def get_driver_telemetry(year: int, track: str, driver_id: str):
    try:
        session_id = f"{year}_{track}_R"
        data = replay_repo.find_by_session_and_driver(session_id, driver_id)

        if not data:
            raise HTTPException(
                status_code=404,
                detail=f"No telemetry data found for driver {driver_id} in this race"
            )

        return {
            "session_id": session_id,
            "driver": driver_id,
            "count": len(data),
            "data": data,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving telemetry for {driver_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal error retrieving telemetry")
