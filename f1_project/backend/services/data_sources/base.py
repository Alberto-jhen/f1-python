"""
Strategy Pattern — Abstract interface for standings data sources.

Each concrete strategy knows how to fetch driver standings from one
specific provider (local JSON, Ergast API, OpenF1 API, etc.).
"""

from typing import Protocol, Optional


class StandingsSource(Protocol):
    """Interface that every standings data source must implement."""

    def fetch_season(self, year: str, driver_number: str, code: str = None) -> Optional[dict]:
        """Return {"position": ..., "points": ..., "year": ...} or None."""
        ...

    def fetch_global(self, year: int) -> Optional[list[dict]]:
        """Return list of standings entries for the full grid, or None."""
        ...

    def fetch_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        """Return standings up to a specific round, or None."""
        ...
