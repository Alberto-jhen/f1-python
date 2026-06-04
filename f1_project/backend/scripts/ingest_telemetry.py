# scripts/ingest_telemetry.py
import sys
import os
import fastf1
import pandas as pd

# Append the parent directory to sys.path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from repositories.replay_repository import replay_repo

def ingest_race_data(year: int, track: str):
    print(f"🏎️ Starting telemetry data ingestion for {track} ({year})...")
    
    # EXTRACT: Load the session data from FastF1
    session = fastf1.get_session(year, track, 'R')
    
    # Load telemetry. Weather and messages are disabled to optimize execution time
    session.load(telemetry=True, weather=False, messages=False) 
    
    session_id = f"{year}_{track}_R"
    
    # TRANSFORM: Iterate through each driver present in the session
    for driver_number in session.drivers:
        try:
            print(f"Processing driver number {driver_number}...")
            
            # Retrieve the standard 3-letter abbreviation for the driver (e.g., 'VER')
            driver_info = session.get_driver(driver_number)
            driver_id = driver_info['Abbreviation'] 
            
            laps = session.laps.pick_driver(driver_number)
            if laps.empty:
                continue
                
            telemetry = laps.get_telemetry()
            
            # Replace NaN values with 0 to comply with strict database schemas
            telemetry = telemetry.fillna(0)

            # --- DATA OPTIMIZATION ---
            # Downsample the dataframe by retaining only every 3rd row 
            # This drastically reduces DB payload and frontend memory footprint
            telemetry = telemetry.iloc[::3]
            
            records_to_insert = []
            
            # Map the Pandas DataFrame rows into a list of dictionaries for bulk insertion
            for _, row in telemetry.iterrows():
                record = {
                    "session_id": session_id,
                    "driver": driver_id,
                    # Convert SessionTime (Timedelta object) to a float representing total seconds
                    "timestamp": float(row['SessionTime'].total_seconds()),
                    "x": float(row['X']),
                    "y": float(row['Y']),
                    "z": float(row['Z']),
                    "speed": int(row['Speed']),
                    "throttle": int(row['Throttle']),
                    # Cast the boolean Brake value to an integer (1 or 0)
                    "brake": 1 if row['Brake'] else 0,
                    "n_gear": int(row['nGear']),
                    "rpm": int(row['RPM']),
                    "drs": int(row['DRS']),
                    "distance": float(row['Distance'])
                }
                records_to_insert.append(record)
                
            # LOAD: Batch insertion to the database
            # Limit batch size to 5000 to prevent timeout or payload size errors in PostgREST/Supabase
            batch_size = 5000
            print(f"Uploading {len(records_to_insert)} records to Supabase for {driver_id}...")
            
            for i in range(0, len(records_to_insert), batch_size):
                batch = records_to_insert[i:i + batch_size]
                replay_repo.insert_batch(batch)
                
            print(f"✅ Driver {driver_id} successfully processed.")
            
        except Exception as e:
            print(f"❌ Error processing driver {driver_number}: {e}")

    print("🏁 Data ingestion completed successfully.")

# Script entry point
if __name__ == "__main__":
    # Default testing parameters
    ingest_race_data(2023, 'Monaco')