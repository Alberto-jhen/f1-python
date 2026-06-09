import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Cargar las variables del archivo .env a la memoria
load_dotenv()

# 2. Leer las variables (Ajustado a los nombres de tu .env)
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Validación rápida para asegurarnos de que lo ha leído bien
if not url or not key:
    raise ValueError("¡No se han encontrado las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env!")

# 3. Crear el cliente
supabase: Client = create_client(url, key)

# --- A partir de aquí, el código de subida ---

# 1. Subir Career Standings
with open('data/career_standings.json') as f:
    career_data = json.load(f)["f1_comprehensive_stats_2018_2025"]
    
    records = []
    for driver, stats in career_data.items():
        records.append({
            "driver_name": driver,
            "titulos": stats["titulos"],
            "victorias": stats["victorias"],
            "podios": stats["podios"]
        })
    
    # Upsert actualiza si ya existe, o inserta si es nuevo
    supabase.table('career_standings').upsert(records).execute()

# 2. Subir Season Standings
with open('data/season_standings.json') as f:
    season_data = json.load(f)
    
    records = []
    for year, drivers in season_data.items():
        for driver_id, stats in drivers.items():
            records.append({
                "year": int(year),
                "driver_id": int(driver_id),
                "position": stats["pos"],
                "points": stats["pts"]
            })
            
    supabase.table('season_standings').upsert(records).execute()

print("Conexión exitosa con la base de datos")