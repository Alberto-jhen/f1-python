import requests

from repositories.standings_repository import StandingsRepository
from services.data_sources.local_json import LocalJsonSource


class UnavailableErgastSource:
    def fetch_by_round(self, _year, _round_num):
        return None


class UnexpectedOpenF1Source:
    def fetch_season(self, *_args):
        raise AssertionError("Local standings fallback must not call OpenF1")


def test_local_json_round_fallback_does_not_make_http_requests(monkeypatch):
    def fail_if_http_is_called(*_args, **_kwargs):
        raise AssertionError("Local standings fallback must not make HTTP requests")

    monkeypatch.setattr(requests, "get", fail_if_http_is_called)
    local_source = LocalJsonSource()
    year = max(int(season) for season in local_source._season)
    repository = StandingsRepository(
        local_source=local_source,
        ergast_source=UnavailableErgastSource(),
        openf1_source=UnexpectedOpenF1Source(),
    )

    standings = repository.get_by_round(year, 1)

    assert standings
    assert all(row["driver"].isdigit() for row in standings)
    assert all(row["constructor"] == "N/A" for row in standings)
