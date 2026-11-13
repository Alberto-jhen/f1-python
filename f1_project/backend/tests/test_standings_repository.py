from repositories.standings_repository import StandingsRepository


class FakeStandingsSource:
    def __init__(self, global_results=None, round_results=None):
        self.global_results = list(global_results or [])
        self.round_results = list(round_results or [])
        self.global_calls = 0
        self.round_calls = 0

    def fetch_global(self, _year):
        self.global_calls += 1
        return self.global_results.pop(0) if self.global_results else None

    def fetch_by_round(self, _year, _round_num):
        self.round_calls += 1
        return self.round_results.pop(0) if self.round_results else None


def test_global_standings_are_cached_within_ttl():
    now = [100.0]
    remote = FakeStandingsSource(global_results=[[{"driver": "Kimi"}]])
    local = FakeStandingsSource()
    repository = StandingsRepository(
        local_source=local,
        ergast_source=remote,
        openf1_source=object(),
        cache_ttl_seconds=60,
        clock=lambda: now[0],
    )

    assert repository.get_global() == [{"driver": "Kimi"}]
    assert repository.get_global() == [{"driver": "Kimi"}]
    assert remote.global_calls == 1


def test_expired_round_cache_is_returned_if_ergast_fails():
    now = [100.0]
    standings = [{"driver": "Kimi", "points": "380"}]
    remote = FakeStandingsSource(round_results=[standings, None])
    local = FakeStandingsSource()
    repository = StandingsRepository(
        local_source=local,
        ergast_source=remote,
        openf1_source=object(),
        cache_ttl_seconds=60,
        clock=lambda: now[0],
    )

    assert repository.get_by_round(2026, 19) == standings
    now[0] += 61
    assert repository.get_by_round(2026, 19) == standings
    assert repository.get_by_round(2026, 19) == standings
    assert remote.round_calls == 2
    assert local.round_calls == 0


def test_local_json_is_used_and_cached_when_ergast_is_unavailable():
    local_standings = [{"driver": "12", "points": "380", "constructor": "N/A"}]
    remote = FakeStandingsSource(global_results=[None])
    local = FakeStandingsSource(global_results=[local_standings])
    repository = StandingsRepository(
        local_source=local,
        ergast_source=remote,
        openf1_source=object(),
        cache_ttl_seconds=60,
        clock=lambda: 100.0,
    )

    assert repository.get_global() == local_standings
    assert repository.get_global() == local_standings
    assert remote.global_calls == 1
    assert local.global_calls == 1
