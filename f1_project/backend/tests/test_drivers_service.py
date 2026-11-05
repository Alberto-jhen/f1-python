import pandas as pd

from services import drivers_service


class FakeResponse:
    def __init__(self, data):
        self.data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self.data


def test_uses_openf1_team_colors_when_fastf1_colors_are_missing(monkeypatch):
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

    monkeypatch.setattr(
        drivers_service.fastf1,
        "get_session",
        lambda *_args: FakeSession(),
    )
    monkeypatch.setattr(
        drivers_service.requests,
        "get",
        lambda *_args, **_kwargs: FakeResponse([
            {"driver_number": 1, "team_name": "McLaren", "team_colour": "F47600"},
            {"driver_number": 44, "team_name": "Ferrari", "team_colour": "FFFFFF"},
            {"driver_number": 87, "team_name": "Haas F1 Team", "team_colour": "9C9FA2"},
            {"driver_number": 50, "team_name": None, "team_colour": None},
        ]),
    )

    drivers = drivers_service.get_season_driver_full_names(2026, "Australian Grand Prix", "R")

    assert drivers[0]["team_color"] == "F47600"
    assert drivers[1]["team_color"] == "DC0000"
    assert drivers[2]["team_color"] == "9C9FA2"
