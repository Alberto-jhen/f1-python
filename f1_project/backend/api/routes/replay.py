from fastapi import APIRouter, HTTPException
from database.database import get_db

router = APIRouter()


@router.get("/service/replay/{year}/{track}/{driver_id}", tags=["Replay service"])
def get_driver_telemetry(year: int, track: str, driver_id: str):
    try:
        db = get_db()
        replays_col = db['race_replays']
        session_id = f"{year}_{track}_R"
        
        query = {
            "session_id": session_id,
            "driver": driver_id
        }
        
        data = list(replays_col.find(
            query, 
            {"_id": 0}
        ).sort("timestamp", 1))
        
        if not data:
            raise HTTPException(
                status_code=404, 
                detail=f"No hay datos para el piloto {driver_id} en esta carrera"
            )
            
        return {
            "session_id": session_id,
            "driver": driver_id,
            "count": len(data),
            "data": data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error recuperando telemetría de {driver_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al recuperar telemetría")
