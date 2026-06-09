"""
Pydantic response schemas (DTOs) for the F1 Analytics API.
These models normalise every API response and auto-generate OpenAPI docs.
"""

from pydantic import BaseModel
from typing import Optional, Union


# ──────────────────────────────────────────────
# Standings
# ──────────────────────────────────────────────

class DriverSeasonStanding(BaseModel):
    position: Union[int, str] = "N/A"
    points: float = 0
    year: Optional[str] = None


class DriverCareerStats(BaseModel):
    titles: int = 0
    wins: int = 0
    podiums: int = 0


class OpenF1Standing(BaseModel):
    position: Union[int, str] = "-"
    total_points_season: float = 0
    last_update: Optional[str] = None


class GlobalStandingEntry(BaseModel):
    position: str
    points: str
    wins: str
    driver: str
    constructor: str


# ──────────────────────────────────────────────
# Drivers
# ──────────────────────────────────────────────

class DriverProfile(BaseModel):
    name: Optional[str] = None
    acronym: Optional[str] = None
    team: Optional[str] = None
    team_color: Optional[str] = None
    country: Optional[str] = None
    image: Optional[str] = None


class DriverInfo(BaseModel):
    label: str
    value: str
    number: int
    team: str
    team_color: Optional[str] = None
    country: str = "N/A"
    points: float = 0


# ──────────────────────────────────────────────
# H2H
# ──────────────────────────────────────────────

class H2HEventResult(BaseModel):
    event: str
    round: int
    driver1_qual: Optional[int] = None
    driver2_qual: Optional[int] = None
    driver1_race: Optional[Union[int, str]] = None
    driver2_race: Optional[Union[int, str]] = None


class H2HResponse(BaseModel):
    year: int
    driver1: str
    driver2: str
    driver1_season_points: float = 0
    driver2_season_points: float = 0
    events: list[H2HEventResult] = []


# ──────────────────────────────────────────────
# Schedule
# ──────────────────────────────────────────────

class YearSchedule(BaseModel):
    tracks: list[str] = []
    sessions: list[str] = []
    sprint_events: list[str] = []


class EventDate(BaseModel):
    year: int
    event: str
    date: str


# ──────────────────────────────────────────────
# Replay / Telemetry
# ──────────────────────────────────────────────

class TelemetryPoint(BaseModel):
    session_id: str
    driver: str
    team: str = "N/A"
    timestamp: float
    x: float = 0
    y: float = 0
    z: float = 0
    speed: int = 0
    gear: int = 0
    throttle: int = 0
    brake: bool = False
    drs: int = 0


class ReplayResponse(BaseModel):
    session_id: str
    driver: str
    count: int
    data: list[TelemetryPoint] = []


# ──────────────────────────────────────────────
# Circuits info
# ──────────────────────────────────────────────

class CircuitInfo(BaseModel):
    season_year: int
    name: str
    round: int
    race_date: str
    description: str
    length_km: float
    lap_record: str
    total_laps: int
    poster_url: Optional[str] = None

# ──────────────────────────────────────────────
# Generic
# ──────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
