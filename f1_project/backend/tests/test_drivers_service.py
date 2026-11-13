import pandas as pd

from services import drivers_service


def test_missing_fastf1_team_colors_do_not_trigger_openf1_lookup(monkeypatch):
    results = pd.DataFrame([
        {
            "FullName": "Lando Norris",
            "Abbreviation": "NOR",
            "DriverNumber": 1,
            "TeamName": "McLaren",
            "TeamColor": "",
            "CountryCode": "GBR",
            "Points": 25,
        },
        {
            "FullName": "Lewis Hamilton",
            "Abbreviation": "HAM",
            "DriverNumber": 44,
            "TeamName": "Ferrari",
            "TeamColor": "DC0000",
            "CountryCode": "GBR",
            "Points": 18,
        },
        {
            "FullName": "Ryo Hirakawa",
            "Abbreviation": "HIR",
            "DriverNumber": 50,
            "TeamName": "Haas F1 Team",
            "TeamColor": "",
            "CountryCode": "JPN",
            "Points": 0,
        },
    ])

    class FakeSession:
        def __init__(self):
            self.results = results

        def load(self, **kwargs):
            pass

    def fail_if_openf1_is_called(*_args, **_kwargs):
        raise AssertionError("Driver list fallback must not call OpenF1")

    monkeypatch.setattr(
        drivers_service.fastf1,
        "get_session",
        lambda *_args: FakeSession(),
    )
    monkeypatch.setattr(
        drivers_service.requests,
        "get",
        fail_if_openf1_is_called,
    )

    drivers = drivers_service.get_season_driver_full_names(2026, "Australian Grand Prix", "R")

    assert drivers[0]["team_color"] == ""
    assert drivers[1]["team_color"] == "DC0000"
    assert drivers[2]["team_color"] == ""
