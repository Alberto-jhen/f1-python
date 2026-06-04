import fastf1
import pandas as pd
from repositories.replay_repository import replay_repo

def ingest_race_data(year: int, track: str):
    session_id = f"{year}_{track}_R"
    print(f"🏎️ Ingestion started for {track} {year} (session: {session_id})...")
    
    # Pre-clean existing telemetry for this session to prevent duplicates
    print(f"🧹 Pre-cleaning existing telemetry for session {session_id}...")
    replay_repo.delete_by_session(session_id)
    
    # 1. Load FastF1 session
    session = fastf1.get_session(year, track, 'R')
    session.load(telemetry=True, weather=False, messages=False)
    
    # 2. Transform and load
    for driver_number in session.drivers:
        try:
            driver_info = session.get_driver(driver_number)
            driver_id = driver_info['Abbreviation']
            print(f"Processing driver {driver_id} ({driver_number})...")
            
            laps = session.laps.pick_driver(driver_number)
            if laps.empty:
                continue
                
            telemetry = laps.get_telemetry()
            telemetry = telemetry.fillna(0)
            
            # Optimization: 1/3 downsampling to avoid inmense data saved into the database.
            telemetry = telemetry.iloc[::3]
            
            records_to_insert = []
            for _, row in telemetry.iterrows():
                record = {
                    "session_id": session_id,
                    "driver": driver_id,
                    "timestamp": float(row['SessionTime'].total_seconds()),
                    "x": float(row['X']),
                    "y": float(row['Y']),
                    "z": float(row['Z']),
                    "speed": int(row['Speed']),
                    "throttle": int(row['Throttle']),
                    "brake": 1 if row['Brake'] else 0,
                    "n_gear": int(row['nGear']),
                    "rpm": int(row['RPM']),
                    "drs": int(row['DRS']),
                    "distance": float(row['Distance'])
                }
                records_to_insert.append(record)
                
            # 3. Batch inserts in chunks of 5000
            batch_size = 5000
            print(f"Uploading {len(records_to_insert)} records to Supabase for {driver_id}...")
            for i in range(0, len(records_to_insert), batch_size):
                batch = records_to_insert[i:i + batch_size]
                replay_repo.insert_batch(batch)
                
            print(f"✅ Driver {driver_id} successfully completed.")
            
        except Exception as e:
            print(f"❌ Error processing driver {driver_number}: {e}")
            
    print(f"🏁 Telemetry ingestion for {session_id} completed successfully.")
    return {"status": "success", "session_id": session_id}
