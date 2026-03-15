import fastf1


def get_year_schedule(year: int):
    schedule = fastf1.get_event_schedule(year)
    tracks = schedule['EventName'].unique().tolist()

    # Build a map of which events have sprint races
    sprint_events = []
    if 'EventFormat' in schedule.columns:
        for _, event in schedule.iterrows():
            fmt = str(event.get('EventFormat', '')).lower()
            if 'sprint' in fmt:
                sprint_events.append(event['EventName'])

    return {
        "tracks": tracks,
        "sessions": ['R', 'Q', 'Q1', 'Q2', 'Q3', 'FP1', 'FP2', 'FP3'],
        "sprint_events": sprint_events,
    }


def get_event_race_date(year: int, event_name: str):
    event = fastf1.get_event(year, event_name)
    race_date = event.get_session_date("R")

    return {
        "year": year,
        "event": event_name,
        "date": race_date.isoformat()
    }
