"""
Repository Pattern — Single entry point for all standings data access.

Uses the Strategy pattern internally: iterates through a prioritised chain
of data sources and returns the first successful result.
"""

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from threading import Lock
from time import monotonic
from typing import Callable, Optional

from services.data_sources.ergast import ErgastSource
from services.data_sources.local_json import LocalJsonSource
from services.data_sources.openf1 import OpenF1Source

STANDINGS_CACHE_TTL_SECONDS = 300


@dataclass
class _CachedStandings:
    data: list[dict]
    expires_at: float


class StandingsRepository:
    """
    Encapsulates *where* standings data comes from.
    The service layer calls the repository without knowing
    whether the data is local JSON, Ergast, or OpenF1.
    """

    def __init__(
        self,
        local_source: Optional[LocalJsonSource] = None,
        ergast_source: Optional[ErgastSource] = None,
        openf1_source: Optional[OpenF1Source] = None,
        *,
        cache_ttl_seconds: float = STANDINGS_CACHE_TTL_SECONDS,
        clock: Callable[[], float] = monotonic,
    ):
        self._local = local_source if local_source is not None else LocalJsonSource()
        self._ergast = ergast_source if ergast_source is not None else ErgastSource()
        self._openf1 = openf1_source if openf1_source is not None else OpenF1Source()
        self._season_sources = [self._local, self._ergast]
        self._cache_ttl_seconds = max(0, cache_ttl_seconds)
        self._clock = clock
        self._grid_cache: dict[tuple[str, int, Optional[int]], _CachedStandings] = {}
        self._grid_cache_lock = Lock()

    def _get_grid_standings(
        self,
        cache_key: tuple[str, int, Optional[int]],
        fetch_remote: Callable[[], Optional[list[dict]]],
        fetch_local: Callable[[], Optional[list[dict]]],
    ) -> Optional[list[dict]]:
        """Return cached standings, refreshing from Ergast and falling back locally."""
        with self._grid_cache_lock:
            cached = self._grid_cache.get(cache_key)
            if cached and cached.expires_at > self._clock():
                return deepcopy(cached.data)

            try:
                remote_data = fetch_remote()
            except Exception as error:
                print(f"Ergast standings request failed: {error}")
                remote_data = None

            if remote_data:
                data = deepcopy(remote_data)
                self._grid_cache[cache_key] = _CachedStandings(
                    data=data,
                    expires_at=self._clock() + self._cache_ttl_seconds,
                )
                return deepcopy(data)

            if cached:
                # Keep the last good result and delay the next upstream attempt.
                cached.expires_at = self._clock() + self._cache_ttl_seconds
                return deepcopy(cached.data)

            try:
                local_data = fetch_local()
            except Exception as error:
                print(f"Local standings fallback failed: {error}")
                return None

            if not local_data:
                return None

            data = deepcopy(local_data)
            self._grid_cache[cache_key] = _CachedStandings(
                data=data,
                expires_at=self._clock() + self._cache_ttl_seconds,
            )
            return deepcopy(data)

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
        return self._get_grid_standings(
            ("global", year, None),
            lambda: self._ergast.fetch_global(year),
            lambda: self._local.fetch_global(year),
        )

    # ── Standings by round ─────────────────────────────────────────

    def get_by_round(self, year: int, round_num: int) -> Optional[list[dict]]:
        return self._get_grid_standings(
            ("round", year, round_num),
            lambda: self._ergast.fetch_by_round(year, round_num),
            lambda: self._local.fetch_by_round(year, round_num),
        )

    # ── Career stats (only local JSON) ─────────────────────────────

    def get_career(self, driver_name: str) -> dict:
        result = self._local.fetch_career(driver_name)
        if result:
            return result
        return None


# Module-level singleton
standings_repo = StandingsRepository()
