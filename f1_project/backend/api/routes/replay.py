from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from repositories.replay_repository import replay_repo
from core.schemas import ReplayResponse
from services.ingestion_service import ingest_race_data

router = APIRouter()


class IngestRequest(BaseModel):
    year: int
    track: str


@router.post("/service/replay/ingest", tags=["Replay service"])
async def trigger_ingestion(body: IngestRequest):
    try:
        result = ingest_race_data(body.year, body.track)
        return {"status": "success", "message": f"Telemetry for {body.track} ({body.year}) ingested successfully.", "session_id": result["session_id"]}
    except Exception as e:
        print(f"Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.get("/service/replay/{year}/{track}/bounds", tags=["Replay service"])
def get_replay_bounds(year: int, track: str):
    try:
        session_id = f"{year}_{track}_R"
        bounds = replay_repo.get_session_bounds(session_id)
        return {
            "session_id": session_id,
            "start_time": bounds["start_time"],
            "end_time": bounds["end_time"]
        }
    except Exception as e:
        print(f"Error retrieving bounds for {year}_{track}: {e}")
        raise HTTPException(status_code=500, detail="Internal error retrieving telemetry bounds")


@router.get("/service/replay/{year}/{track}", tags=["Replay service"]) #
def get_race_telemetry(
    year: int, 
    track: str, 
    # driver_id optional: if not received, return all drivers.
    driver_id: Optional[str] = Query(None, description="ID del piloto (opcional para ver todos)"),
    start_time: float = Query(0.0, description="Tiempo de inicio en segundos"),
    end_time: float = Query(300.0, description="Tiempo de fin en segundos")
):
    try:
        if start_time < 0 or start_time >= end_time:
            raise HTTPException(status_code=400, detail="Rango de tiempo inválido")
            
        # 600s as time limit to avoid server saturation.
        if (end_time - start_time) > 600:
            raise HTTPException(status_code=400, detail="El chunk solicitado es demasiado grande (máximo 600s)")

        session_id = f"{year}_{track}_R"
        
        data = replay_repo.find_by_session_and_driver(
            session_id=session_id, 
            driver_id=driver_id,
            start_time=start_time,
            end_time=end_time
        )

        if not data:
            msg = f"No telemetry data found for driver {driver_id}" if driver_id else "No telemetry data found for this time chunk"
            raise HTTPException(
                status_code=404,
                detail=f"{msg} in this race"
            )

        # Response
        return {
            "session_id": session_id,
            "driver": driver_id, 
            "time_range": {"start": start_time, "end": end_time},
            "count": len(data),
            "data": data,
        }
        
    except HTTPException:
        raise 
    except Exception as e:
        print(f"Error retrieving telemetry for session {year}_{track}: {e}")
        raise HTTPException(status_code=500, detail="Internal error retrieving telemetry")
