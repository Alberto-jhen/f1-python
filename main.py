import seaborn as sns
from matplotlib import pyplot as plt
import matplotlib.ticker as mtick

import fastf1
import fastf1.plotting

# Enable matplotlib to manage times as timedelta values
fastf1.plotting.setup_mpl(mpl_timedelta_support=True, color_scheme='fastf1')

# Load the race
race = fastf1.get_session(2025, "Qatar", 'R')
race.load()

# Get only the point finisher drivers
point_finishers = race.drivers[:10]
print(point_finishers)
# Filter laps unpacking the VSC, yellow flag, etc. laps
driver_laps = race.laps.pick_drivers(point_finishers).pick_quicklaps()
driver_laps = driver_laps.reset_index()

# Redo the finishing order getting the first 3 letters of each driver.
finishing_order = [race.get_driver(i)["Abbreviation"] for i in point_finishers]
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

def sec_to_minsec(x, pos):
    # x viene en segundos (float)
    minutes = int(x // 60)
    seconds = x % 60
    # mm:ss.mmm
    return f"{minutes:d}:{seconds:06.3f}"

ax.yaxis.set_major_formatter(mtick.FuncFormatter(sec_to_minsec))

ax.set_xlabel("Driver")
ax.set_ylabel("Lap Time")
plt.suptitle("2025 Qatar Grand Prix Lap Time Distributions")
sns.despine(left=True, bottom=True)

plt.tight_layout()
plt.show()