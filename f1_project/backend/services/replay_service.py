import fastf1
import pandas as pd
from repositories.replay_repository import replay_repo

BATCH_SIZE = 500

def set_race_telemetry(year, track):
    try:
        session = fastf1.get_session(year, track, 'R')
        session.load(telemetry=True, laps=True)
        
        session_id = f"{year}_{track}_R"
        
        # 1. Check if data already exists
        if replay_repo.session_exists(session_id):
            return {"message": "Data already exists"}

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

        # 2. Batch insert
        if all_telemetry:
            print(f"🚀 Attempting to insert {len(all_telemetry)} records...")
            for i in range(0, len(all_telemetry), BATCH_SIZE):
                batch = all_telemetry[i:i + BATCH_SIZE]
                replay_repo.insert_batch(batch)
            print("✅ Insert completed successfully")

        return {"status": "success", "count": len(all_telemetry)}

    except Exception as e:
        print(f"❌ Error en replay_service: {e}")
        return {"status": "error", "message": str(e)}
