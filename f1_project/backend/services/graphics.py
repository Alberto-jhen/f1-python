import seaborn as sns
from matplotlib import pyplot as plt
import matplotlib.ticker as mtick
import io
import fastf1
import fastf1.plotting
from fastf1.core import InvalidSessionError, NoLapDataError

import services.utilities.utilities as ut

fastf1.plotting.setup_mpl(mpl_timedelta_support=True, color_scheme='fastf1')

def get_laps_driver_scatterplot(year, track, session_type, driver_name):
    try:
        race = fastf1.get_session(year, track, session_type)
        race.load()
    except (InvalidSessionError, NoLapDataError) as e:
        return None, str(e)

    # Driver name processing.
    parts = driver_name.split()
    base = parts[1] if len(parts) >= 2 else parts[0]
    driver_id = base[:3].upper()
    
    driver_laps = ut.get_driver_laps(race, driver_id)
    if driver_laps is None:
        return None, "Driver not found"

    fig, ax = plt.subplots(figsize=(8, 8))
    sns.scatterplot(
        data=driver_laps,
        x="LapNumber",
        y="LapTime",
        ax=ax,
        hue="Compound",
        palette=fastf1.plotting.get_compound_mapping(session=race),
        s=80,
        linewidth=0,
        legend='auto'
    )
    
    ax.invert_yaxis()
    ax.set_xlabel("Lap Number")
    ax.set_ylabel("Lap Time")
    plt.suptitle(f"{driver_id} Laptimes - {year} {track}")
    plt.grid(color='w', which='major', axis='both')
    sns.despine(left=True, bottom=True)
    plt.tight_layout()
    
    return fig, None

def get_lap_time_distributions_violin(year, track, session_type, num_drivers):
    try:
        race = fastf1.get_session(year, track, session_type)
        race.load()
    except (InvalidSessionError, NoLapDataError) as e:
        return None, str(e)

    drivers_shown = race.drivers[:num_drivers]
    driver_laps = race.laps.pick_drivers(drivers_shown).pick_quicklaps().reset_index()
    finishing_order = [race.get_driver(i)["Abbreviation"] for i in drivers_shown]

    fig, ax = plt.subplots(figsize=(10, 5))
    driver_laps["LapTime(s)"] = driver_laps["LapTime"].dt.total_seconds()

    sns.violinplot(
        data=driver_laps,
        x="Driver",
        y="LapTime(s)",
        hue="Driver",
        inner=None,
        density_norm="area",
        order=finishing_order,
        palette=fastf1.plotting.get_driver_color_mapping(session=race)
    ) 

    sns.swarmplot(
        data=driver_laps,
        x="Driver",
        y="LapTime(s)",
        order=finishing_order,
        hue="Compound",
        palette=fastf1.plotting.get_compound_mapping(session=race),
        hue_order=["SOFT", "MEDIUM", "HARD"],
        linewidth=0,
        size=4
    )

    ax.yaxis.set_major_formatter(mtick.FuncFormatter(ut.sec_to_minsec))
    ax.set_xlabel("Driver")
    ax.set_ylabel("Lap Time")
    plt.suptitle(f"{year} {track} Lap Time Distributions")
    sns.despine(left=True, bottom=True)
    plt.tight_layout()
    
    return fig, None

# DATA LOGIC -- Returns dictionaries fro JSON --

def get_driver_laps_data(year, track, session_type, driver_name):
    try:
        race = fastf1.get_session(year, track, session_type)
        race.load()
    except (InvalidSessionError, NoLapDataError) as e:
        return None, str(e)

    parts = driver_name.split()
    base = parts[1] if len(parts) >= 2 else parts[0]
    driver_id = base[:3].upper()
    
    driver_laps = ut.get_driver_laps(race, driver_id)
    if driver_laps is None:
        return None, "Driver not found"
    
    # Select only the necessary columns for the JSON.
    df_json = driver_laps.copy()
    df_json['LapTimeSeconds'] = df_json['LapTime'].dt.total_seconds()
    
    result = df_json[['LapNumber', 'LapTimeSeconds', 'Compound', 'TyreLife']].copy()
    
    return result.to_dict('records'), None

def get_lap_distributions_data(year, track, session_type, num_drivers):
    try:
        race = fastf1.get_session(year, track, session_type)
        race.load()
    except (InvalidSessionError, NoLapDataError) as e:
        return None, str(e)

    drivers_shown = race.drivers[:num_drivers]
    driver_laps = race.laps.pick_drivers(drivers_shown).pick_quicklaps().reset_index()
    
    # Convert the lap times to seconds.
    driver_laps['LapTimeSeconds'] = driver_laps['LapTime'].dt.total_seconds()
    
    # Select only the necessary columns.
    result = driver_laps[['Driver', 'LapTimeSeconds', 'Compound', 'LapNumber']].copy()
    
    return result.to_dict('records'), None