from fastapi import APIRouter, HTTPException
from database.database import get_supabase

router = APIRouter()


@router.get("/service/replay/{year}/{track}/{driver_id}", tags=["Replay service"])
def get_driver_telemetry(year: int, track: str, driver_id: str):
    try:
        supabase = get_supabase()
        session_id = f"{year}_{track}_R"
        
        response = (
            supabase.table("race_replays")
            .select("*")
            .eq("session_id", session_id)
            .eq("driver", driver_id)
            .order("timestamp", desc=False)
            .execute()
        )
        
        data = response.data
        
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
