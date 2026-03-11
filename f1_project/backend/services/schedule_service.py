import fastf1


def get_year_schedule(year: int):
    schedule = fastf1.get_event_schedule(year)
    tracks = schedule['EventName'].unique().tolist()
    return {
        "tracks": tracks,
        "sessions": ['R', 'Q', 'Q1', 'Q2', 'Q3', 'FP1', 'FP2', 'FP3']
    }


def get_event_race_date(year: int, event_name: str):
    event = fastf1.get_event(year, event_name)
    race_date = event.get_session_date("R")

    return {
        "year": year,
        "event": event_name,
        "date": race_date.isoformat()
    }
