import seaborn as sns
from matplotlib import pyplot as plt
import matplotlib.ticker as mtick
import io
import pandas as pd
import fastf1
import fastf1.plotting
from fastf1.core import InvalidSessionError, NoLapDataError
from fastf1.core import Laps
from timple.timedelta import strftimedelta

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

def get_quailfying_results_overview(year, track):
    try:
        session = fastf1.get_session(year, track, 'Q')
        session.load()
    except (InvalidSessionError, NoLapDataError) as e:
        return None, str(e)
    
    drivers = pd.unique(session.laps['Driver'])

    list_fastest_laps = list()
    for drv in drivers:
        drvs_fastest_lap = session.laps.pick_drivers(drv).pick_fastest()
        # FIX: Solo añadir si el resultado NO es None
        if drvs_fastest_lap is not None:
            list_fastest_laps.append(drvs_fastest_lap)
    
    # FIX: Si la lista está vacía tras el filtrado, evitar error
    if not list_fastest_laps:
        return None, "No hay tiempos registrados en esta sesión"

    fastest_laps = Laps(list_fastest_laps) \
        .sort_values(by='LapTime') \
        .reset_index(drop=True)
    
    pole_lap = fastest_laps.pick_fastest()
    
    # FIX: Asegurarnos de que pole_lap existe antes de restar
    if pole_lap is None:
        return None, "No se pudo determinar la Pole Position"

    fastest_laps['LapTimeDelta'] = fastest_laps['LapTime'] - pole_lap['LapTime']

    team_colors = list()
    for index, lap in fastest_laps.iterlaps():
        color = fastf1.plotting.get_team_color(lap['Team'], session=session)
        team_colors.append(color)

    fig, ax = plt.subplots(figsize=(10, 6)) # Un poco más ancho para que se vea bien en el modal
    ax.barh(fastest_laps.index, fastest_laps['LapTimeDelta'],
            color=team_colors, edgecolor='grey')
    ax.set_yticks(fastest_laps.index)
    ax.set_yticklabels(fastest_laps['Driver'])

    ax.invert_yaxis()
    ax.set_axisbelow(True)
    ax.xaxis.grid(True, which='major', linestyle='--', color='white', alpha=0.2, zorder=-1000)

    # Mejoramos el estilo para el modo oscuro de tu web
    fig.patch.set_facecolor('#0f172a') # bg-slate-900
    ax.set_facecolor('#0f172a')
    ax.tick_params(colors='white')
    ax.xaxis.label.set_color('white')
    ax.yaxis.label.set_color('white')

    lap_time_string = strftimedelta(pole_lap['LapTime'], '%m:%s.%ms')
    plt.suptitle(f"{session.event['EventName']} {session.event.year} Qualifying\n"
            f"Fastest Lap: {lap_time_string} ({pole_lap['Driver']})", color='white')

    return fig, None

# DATA LOGIC -- Returns dictionaries for JSON --

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
        
        drivers_shown_ids = race.drivers[:num_drivers]
        finishing_order = [race.get_driver(i)["Abbreviation"] for i in drivers_shown_ids]
        
        order_map = {driver: i for i, driver in enumerate(finishing_order)}
        
        driver_colors = fastf1.plotting.get_driver_color_mapping(session=race)
        driver_laps = race.laps.pick_drivers(finishing_order).pick_quicklaps().reset_index()
        driver_laps['LapTimeSeconds'] = driver_laps['LapTime'].dt.total_seconds()
        
        driver_laps['TeamColor'] = driver_laps['Driver'].map(driver_colors)
        driver_laps['OfficialOrder'] = driver_laps['Driver'].map(order_map)
        
        driver_laps['OfficialOrder'] = driver_laps['OfficialOrder'].astype(int)
        
        result = driver_laps[['Driver', 'LapTimeSeconds', 'Compound', 'TeamColor', 'OfficialOrder']].to_dict('records')
        return result, None
    except Exception as e:
        return None, str(e)
    

def get_qualifying_results_data(year, track):
    try:
        session = fastf1.get_session(year, track, 'Q')
        session.load()
        
        # Obtain every driver.
        drivers = pd.unique(session.laps['Driver'])
        list_fastest_laps = list()
        
        for drv in drivers:
            drvs_fastest_lap = session.laps.pick_drivers(drv).pick_fastest()
            if drvs_fastest_lap is not None:
                list_fastest_laps.append(drvs_fastest_lap)
        
        # Convert to laps and sort values so the fastest is at the top.
        fastest_laps = Laps(list_fastest_laps).sort_values(by='LapTime').reset_index(drop=True)
        
        # Pole lap is the first one after sort.
        pole_lap = fastest_laps.pick_fastest()
        pole_time = pole_lap['LapTime'].total_seconds()
        
        results = []
        for _, lap in fastest_laps.iterlaps():
            driver_code = lap['Driver']
            team_name = lap['Team']
            current_lap_time = lap['LapTime'].total_seconds()
            
            results.append({
                'Driver': driver_code,
                'Team': team_name,
                'LapTime': current_lap_time,
                'Delta': current_lap_time - pole_time, 
                'TeamColor': fastf1.plotting.get_team_color(team_name, session=session),
                'IsPole': driver_code == pole_lap['Driver']
            })
            
        return results, None
    except Exception as e:
        return None, str(e)