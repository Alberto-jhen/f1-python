import requests
import fastf1
import os
from datetime import datetime

openF1_url = os.getenv("OPENF1_URL")

def get_driver_profile(driver_number: int):
    base_url = openF1_url or "https://api.openf1.org/v1"
    url = f"{base_url}/drivers?driver_number={driver_number}"

    try:
        # Open the url and wait 5 seconds max to get a response.
        response = requests.get(url, timeout=5)
        data = response.json()

        if data:
            # Sort the list to have the newest entry first.
            records = list(reversed(data))
            
            # Search first entry with the country_code with a valid value and an image without "fallback".
            best_record = next(
                (r for r in records if r.get('country_code') and "fallback" not in r.get('headshot_url', '')),
                records[0] # In case the condition isnt fullfilled, get the latest entry.
            )
            
            return {
                "name": best_record.get('full_name'),
                "acronym": best_record.get('name_acronym'),
                "team": best_record.get('team_name'),
                "team_color": f"#{best_record.get('team_colour')}",
                "country": best_record.get('country_code'), 
                "image": best_record.get('headshot_url')
            }
        
        return {"error": "No se encontraron datos para el piloto en la busqueda en openF1"}
    except Exception as e:
        return {"error": str(e)}
    

def get_season_driver_full_names(year: int, event_name: str, session_type: str):
    try:
        session = fastf1.get_session(year, event_name, session_type)
        session.load(telemetry=False, weather=False, messages=False)

        # Get only the full name and use set for avoiding repeated keys.
        names = sorted(list(set(session.results['FullName'].tolist())))

        return [{"label": name, "value": name} for name in names]

    except Exception as e:
        print(f"Error obteniendo nombres de pilotos: {e}")
        return []