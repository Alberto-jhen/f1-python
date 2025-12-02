from matplotlib import pyplot as plt

import graphics.violinGraphics as vg
import graphics.driverLapScatterplot as dlsp

def violin_graphics(year, track, session_type, num_drivers):
    # Function call
    fig, ax, = vg.lap_time_distributions_violin_graphic(
        year,
        track,
        session_type,
        num_drivers
    )
    return fig, ax

def driver_laps_scatterplot(year, track, session_type, driver_name):
    fig, ax = dlsp.laps_driver_scatterplot(
        year, 
        track, 
        session_type, 
        driver_name)
    return fig, ax

def main():
    # Ask user for inputs
    year_str = input("Enter year (e.g. 2025): ")
    # Basic validation and conversion
    try:
        year = int(year_str)
    except ValueError:
        print("Invalid year format. Please enter a number like 2025.")
        return
    
    track = input("Enter circuit / Grand Prix name (e.g. 'Qatar'): ")

    session_type = input(
        "Enter session type ('R' for race, 'Q' for qualifying): "
    ).strip().upper()
    # Validate session type
    if session_type not in ("R", "Q"):
        print("Invalid session type. Use 'R' for race or 'Q' for qualifying.")
        return

    num_drivers_str = input("Enter how many drivers you'd like to compare (graphic would show " \
    "less laps if the number of drivers is high): ")
    # Validate num_drivers
    try:
        num_drivers = int(num_drivers_str)
    except ValueError:
        print("Invalid year format. Please enter a number like 2025.")
        return
    if num_drivers <= 0 or num_drivers > 20:
        print("The number of drivers must be between 1 and 20")

    driver_name = input("Enter the name of a driver to see his laps: ")

    # Function calls
    fig1, ax1 = violin_graphics(year, track, session_type, num_drivers)
    fig2, ax2 = driver_laps_scatterplot(year, track, session_type, driver_name)

    plt.show()

if __name__ == "__main__":
    main()