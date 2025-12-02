import seaborn as sns
from matplotlib import pyplot as plt
import matplotlib.ticker as mtick
import utilities.utilities as ut
from fastf1.core import InvalidSessionError, NoLapDataError

import fastf1
import fastf1.plotting

def lap_time_distributions_violin_graphic(year, track, session_type, num_drivers):
    # Enable matplotlib to manage times as timedelta values
    fastf1.plotting.setup_mpl(mpl_timedelta_support=True, color_scheme='fastf1')

    try:
        # Load the race data
        race = fastf1.get_session(year, track, session_type)
        race.load()

    except InvalidSessionError:
        print("There's no session available with that year/track/session type.")
        return

    except NoLapDataError:
        print("Session exists but there's no lap data.")
        return

    # Get only the point finisher drivers
    drivers_shown = race.drivers[:num_drivers]
    print(drivers_shown)
    # Filter laps unpacking the VSC, yellow flag, etc. laps
    driver_laps = race.laps.pick_drivers(drivers_shown).pick_quicklaps()
    driver_laps = driver_laps.reset_index()

    # Redo the finishing order getting the first 3 letters of each driver.
    finishing_order = [race.get_driver(i)["Abbreviation"] for i in drivers_shown]
    print(finishing_order)

    # create the figure
    fig, ax = plt.subplots(figsize=(10, 5))

    # Seaborn doesn't have proper timedelta support,
    # so we have to convert timedelta to float (in seconds)
    driver_laps["LapTime(s)"] = driver_laps["LapTime"].dt.total_seconds()

    sns.violinplot(data=driver_laps,
                    x="Driver",
                    y="LapTime(s)",
                    hue="Driver",
                    inner=None,
                    density_norm="area",
                    order=finishing_order,
                    palette=fastf1.plotting.get_driver_color_mapping(session=race)
                    ) 

    sns.swarmplot(data=driver_laps,
                    x="Driver",
                    y="LapTime(s)",
                    order=finishing_order,
                    hue="Compound",
                    palette=fastf1.plotting.get_compound_mapping(session=race),
                    hue_order=["SOFT", "MEDIUM", "HARD"],
                    linewidth=0,
                    size=4,
                    )


    ax.yaxis.set_major_formatter(mtick.FuncFormatter(ut.sec_to_minsec))

    ax.set_xlabel("Driver")
    ax.set_ylabel("Lap Time")
    plt.suptitle("2025 Qatar Grand Prix Lap Time Distributions")
    sns.despine(left=True, bottom=True)

    plt.tight_layout()
    plt.show()