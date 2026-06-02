"""
Repository Pattern — Single entry point for all standings data access.

Uses the Strategy pattern internally: iterates through a prioritised chain
of data sources and returns the first successful result.
"""

from datetime import datetime
from typing import Optional

from services.data_sources.local_json import LocalJsonSource
from services.data_sources.ergast import ErgastSource
from services.data_sources.openf1 import OpenF1Source


class StandingsRepository:
    """
    Encapsulates *where* standings data comes from.
    The service layer calls the repository without knowing
    whether the data is local JSON, Ergast, or OpenF1.
    """

    def __init__(self):
        self._local = LocalJsonSource()
        self._ergast = ErgastSource()
        self._openf1 = OpenF1Source()

        # Priority chain for season standings: local JSON → Ergast
        self._season_sources = [self._local, self._ergast]

        # Priority chain for global / by-round: only Ergast has this data
        self._grid_sources = [self._ergast]

    # ── Season championship (single driver) ────────────────────────

    def get_season(self, year: str, driver_number: str, code: str = None) -> dict:
        for source in self._season_sources:
            result = source.fetch_season(year, driver_number, code)
            if result:
                return result
        return None

    # ── OpenF1 season total (separate schema) ──────────────────────

    def get_openf1_season(self, year: int, driver_number: int) -> dict:
        result = self._openf1.fetch_season(str(year), str(driver_number))
        if result:
            return result
        return None

    # ── Global current standings (full grid) ───────────────────────

    def get_global(self) -> Optional[list[dict]]:
        year = datetime.now().year
        for source in self._grid_sources:
            result = source.fetch_global(year)
            if result is not None:
                return result
        return None

    # ── Standings by round ─────────────────────────────────────────

    def get_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        for source in self._grid_sources:
            result = source.fetch_by_round(year, round_num)
            if result is not None:
                return result
        return None

    # ── Career stats (only local JSON) ─────────────────────────────

    def get_career(self, driver_name: str) -> dict:
        result = self._local.fetch_career(driver_name)
        if result:
            return result
        return None


# Module-level singleton
standings_repo = StandingsRepository()
