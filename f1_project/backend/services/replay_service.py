import fastf1
import pandas as pd
from database.database import get_supabase

supabase = get_supabase()

BATCH_SIZE = 500

def set_race_telemetry(year, track):
    try:
        session = fastf1.get_session(year, track, 'R')
        session.load(telemetry=True, laps=True)
        
        session_id = f"{year}_{track}_R"
        
        # 1. Limpieza preventiva
        existing = supabase.table("race_replays").select("session_id").eq("session_id", session_id).limit(1).execute()
        if existing.data:
            return {"message": "Los datos ya existen"}

        all_telemetry = []
        drivers = session.drivers 

        for drv in drivers:
            laps = session.laps.pick_drivers([drv])
            telemetry = laps.get_telemetry()

            telemetry = telemetry.fillna(0) 
            
            print(f"Procesando piloto {drv}...")

            for _, row in telemetry.iterrows():
                if _ % 3 != 0: continue
                all_telemetry.append({
                    "session_id": session_id,
                    "driver": str(drv),
                    "team": str(laps['Team'].iloc[0]) if not laps.empty else "N/A",
                    "timestamp": float(row['SessionTime'].total_seconds()),
                    "x": float(row.get('X', 0)),
                    "y": float(row.get('Y', 0)),
                    "z": float(row.get('Z', 0)),
                    "speed": int(row.get('Speed', 0)),
                    "gear": int(row.get('Gear', row.get('nGear', 0))), 
                    "throttle": int(row.get('Throttle', 0)),
                    "brake": bool(row.get('Brake', False)),
                    "drs": int(row.get('DRS', 0))
                })

        # 2. Inserción masiva por lotes
        if all_telemetry:
            print(f"🚀 Intentando insertar {len(all_telemetry)} registros...")
            for i in range(0, len(all_telemetry), BATCH_SIZE):
                batch = all_telemetry[i:i + BATCH_SIZE]
                supabase.table("race_replays").insert(batch).execute()
            print("✅ Inserción completada con éxito")

        return {"status": "success", "count": len(all_telemetry)}

    except Exception as e:
        print(f"❌ Error en replay_service: {e}")
        return {"status": "error", "message": str(e)}
