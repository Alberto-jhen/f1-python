import graphics.violinGraphics as vg

def violin_graphics():
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
    # Optional: validate session type
    if session_type not in ("R", "Q"):
        print("Invalid session type. Use 'R' for race or 'Q' for qualifying.")
        return

    num_drivers_str = input("Enter how many drivers you'd like to compare (graphic would show " \
    "less laps if the number of drivers is high): ")
    try:
        num_drivers = int(num_drivers_str)
    except ValueError:
        print("Invalid year format. Please enter a number like 2025.")
        return
    if num_drivers <= 0 or num_drivers > 20:
        print("The number of drivers must be between 1 and 20")

    # Call your function
    vg.lap_time_distributions_violin_graphic(
        year=year,
        track=track,
        session_type=session_type,
        num_drivers=num_drivers  # or any value you want
    )


if __name__ == "__main__":
    violin_graphics()