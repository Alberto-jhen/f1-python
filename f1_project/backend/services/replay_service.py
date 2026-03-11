import fastf1
import pandas as pd
from database.database import get_db

db = get_db()

def set_race_telemetry(year, track):
    try:
        session = fastf1.get_session(year, track, 'R')
        session.load(telemetry=True, laps=True)
        replays_col = db['race_replays']
        
        session_id = f"{year}_{track}_R"
        
        # 1. Limpieza preventiva
        if replays_col.find_one({"session_id": session_id}):
            return {"message": "Los datos ya existen"}

        all_telemetry = []
        drivers = session.drivers 

        for drv in drivers:
            laps = session.laps.pick_drivers([drv])
            telemetry = laps.get_telemetry()

            # --- NUEVA LÓGICA DE LIMPIEZA ---
            # Rellenamos nulos con 0 y eliminamos filas totalmente vacías
            telemetry = telemetry.fillna(0) 
            
            print(f"Procesando piloto {drv}...")

            for _, row in telemetry.iterrows():
                if _ % 3 != 0: continue
                # Usamos row.get('NombreColumna', valor_defecto) para que no explote si falta una
                all_telemetry.append({
                    "session_id": session_id,
                    "driver": str(drv),
                    "team": str(laps['Team'].iloc[0]) if not laps.empty else "N/A",
                    "timestamp": float(row['SessionTime'].total_seconds()),
                    "x": float(row.get('X', 0)),
                    "y": float(row.get('Y', 0)),
                    "z": float(row.get('Z', 0)),
                    "speed": int(row.get('Speed', 0)),
                    # Aquí estaba el fallo: intentamos Gear y si no nGear (común en F1)
                    "gear": int(row.get('Gear', row.get('nGear', 0))), 
                    "throttle": int(row.get('Throttle', 0)),
                    "brake": bool(row.get('Brake', False)),
                    "drs": int(row.get('DRS', 0))
                })

        # 2. Inserción Masiva
        if all_telemetry:
            print(f"🚀 Intentando insertar {len(all_telemetry)} registros...")
            replays_col.insert_many(all_telemetry)
            replays_col.create_index([("session_id", 1), ("timestamp", 1)])
            print("✅ Inserción completada con éxito")

        return {"status": "success", "count": len(all_telemetry)}

    except Exception as e:
        print(f"❌ Error en replay_service: {e}")
        return {"status": "error", "message": str(e)}