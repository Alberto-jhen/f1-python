import seaborn as sns
from matplotlib import pyplot as plt
import matplotlib.ticker as mtick
import utilities.utilities as ut
from fastf1.core import InvalidSessionError, NoLapDataError

import fastf1
import fastf1.plotting

def laps_driver_scatterplot(year, track, session_type, driver):
    # Enable matplotlib to manage times as timedelta values
    fastf1.plotting.setup_mpl(mpl_timedelta_support=True, color_scheme='fastf1')

    try:
        # Load the race
        race = fastf1.get_session(year, track, session_type)
        race.load()

    except InvalidSessionError:
        print("There's no session available with that year/track/session type.")
        return

    except NoLapDataError:
        print("Session exists but there's no lap data.")
        return
    
    # In case the driver is written as 'Name Surname', get only the surname
    parts = driver.split()
    if len(parts) >= 2:
        base = parts[1]
    else:
        base = parts[0]
    # Refactor the driver name to match the id in the race (e.g. 'Alonso' = 'ALO')
    driver = base[:3].upper()
    driver_laps = ut.get_driver_laps(race, driver)

    fig, ax = plt.subplots(figsize=(8, 8))

    sns.scatterplot(data=driver_laps,
                    x="LapNumber",
                    y="LapTime",
                    ax=ax,
                    hue="Compound",
                    palette=fastf1.plotting.get_compound_mapping(session=race),
                    s=80,
                    linewidth=0,
                    legend='auto')
    
    ax.set_xlabel("Lap Number")
    ax.set_ylabel("Lap Time")

    # The y-axis increases from bottom to top by default
    # Since we are plotting time, it makes sense to invert the axis
    ax.invert_yaxis()
    plt.suptitle("Alonso Laptimes in the 2023 Azerbaijan Grand Prix")

    # Turn on major grid lines
    plt.grid(color='w', which='major', axis='both')
    sns.despine(left=True, bottom=True)

    plt.tight_layout()
    
    return fig, ax