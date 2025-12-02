import graphics.violinGraphics as vg

def violin_graphics():
    # Ask user for inputs
    year_str = input("Enter year (e.g. 2025): ")
    track = input("Enter circuit / Grand Prix name (e.g. 'Qatar'): ")
    session_type = input(
        "Enter session type ('R' for race, 'Q' for qualifying): "
    ).strip().upper()

    # Basic validation and conversion
    try:
        year = int(year_str)
    except ValueError:
        print("Invalid year format. Please enter a number like 2025.")
        return

    # Optional: validate session type
    if session_type not in ("R", "Q"):
        print("Invalid session type. Use 'R' for race or 'Q' for qualifying.")
        return

    # Call your function
    vg.lap_time_distributions_violin_graphic(
        year=year,
        track=track,
        session_type=session_type,
        num_drivers=10  # or any value you want
    )


if __name__ == "__main__":
    violin_graphics()