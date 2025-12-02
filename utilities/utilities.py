"""
File to write utility functions needed in other files.
"""

def sec_to_minsec(x, pos):
    # x viene en segundos (float)
    minutes = int(x // 60)
    seconds = x % 60
    # mm:ss.mmm
    return f"{minutes:d}:{seconds:06.3f}"

def get_driver_laps(race, driver_id):
    driver_laps = race.laps.pick_drivers(driver_id).pick_quicklaps().reset_index()

    if driver_laps.empty:
        print(f"Driver '{driver_id}' not found in this session.")
        return None

    return driver_laps