"""Standings service — orchestrates the Repository for standings data."""

from repositories.standings_repository import standings_repo


def get_season_championship(year: str, number: str, code: str = None):
    return standings_repo.get_season(year, number, code)


def get_career_championship(name: str):
    return standings_repo.get_career(name)


def get_openf1_season_standings(year: int, driver_number: int):
    return standings_repo.get_openf1_season(year, driver_number)


def get_global_standings():
    return standings_repo.get_global()


def get_standings_by_round(year: int, round_num: int):
    return standings_repo.get_by_round(year, round_num)
