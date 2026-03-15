import requests
import fastf1
import os
from datetime import datetime

openF1_url = os.getenv("OPENF1_URL")


def _resolve_latest_event(year: int):
    """Find the most recent completed race event for a given year."""
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        now = datetime.now()
        # Iterate in reverse to find the last event whose session date has passed
        for _, event in schedule.iloc[::-1].iterrows():
            event_date = event.get('Session5DateUtc') or event.get('Session4DateUtc')
            if event_date is not None and event_date.replace(tzinfo=None) < now:
                return event['EventName']
    except Exception as e:
        print(f"Error resolviendo último evento para {year}: {e}")
    return None


def get_driver_profile(driver_number: int):
    base_url = openF1_url or "https://api.openf1.org/v1"
    url = f"{base_url}/drivers?driver_number={driver_number}"

    try:
        response = requests.get(url, timeout=5)
        data = response.json()

        if data:
            records = list(reversed(data))
            
            best_record = next(
                (r for r in records if r.get('country_code') and "fallback" not in r.get('headshot_url', '')),
                records[0]
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
    COUNTRY_FIX = {
        'VER': 'NED', 'PER': 'MEX',  
        'HAM': 'GBR', 'LEC': 'MON', 
        'NOR': 'GBR', 'PIA': 'AUS',  
        'RUS': 'GBR', 'ANT': 'ITA', 
        'ALO': 'ESP', 'STR': 'CAN',  
        'GAS': 'FRA', 'DOO': 'AUS',  
        'ALB': 'THA', 'SAI': 'ESP',  
        'HUL': 'GER', 'BEA': 'GBR',  
        'TSU': 'JPN', 'HAD': 'FRA',
        'OCO': 'FRA', 'BOR': 'BRA', 
        'BOT': 'FIN', 'ZHO': 'CHN',  
        'COL': 'ARG', 'LAW': 'NZL',
        'LIN': 'GBR',
    }

    try:
        # Resolve "latest" manually if fastf1 can't handle it
        resolved_event = event_name
        if event_name.lower() == "latest":
            resolved = _resolve_latest_event(year)
            if resolved:
                resolved_event = resolved

        session = fastf1.get_session(year, resolved_event, session_type)
        session.load(telemetry=False, weather=False, messages=False)

        results = session.results[[
            'FullName', 'Abbreviation', 'DriverNumber', 
            'TeamName', 'TeamColor', 'CountryCode', 'Points'
        ]].drop_duplicates('FullName')

        drivers_list = []
        for _, row in results.iterrows():
            abbr = row['Abbreviation']
            raw_country = row['CountryCode']

            if not raw_country or str(raw_country).strip() == "" or str(raw_country).lower() == 'nan':
                country = COUNTRY_FIX.get(abbr, 'N/A')
            else:
                country = raw_country

            drivers_list.append({
                "label": row['FullName'], 
                "value": abbr, 
                "number": int(row['DriverNumber']),
                "team": row['TeamName'],
                "team_color": row['TeamColor'],
                "country": country,
                "points": float(row['Points']) 
            })

        return drivers_list

    except Exception as e:
        print(f"Error obteniendo nombres de pilotos: {e}")
        return []
