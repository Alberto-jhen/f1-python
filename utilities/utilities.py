"""
File to write utility functions needed in other files.
"""

def sec_to_minsec(x, pos):
    # x viene en segundos (float)
    minutes = int(x // 60)
    seconds = x % 60
    # mm:ss.mmm
    return f"{minutes:d}:{seconds:06.3f}"