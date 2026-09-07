"""Unit tests for circuits service join parsing."""
from services.circuits_service import CircuitsService
from core.schemas import CircuitInfo


def test_circuit_info_from_race_with_circuit_id_relation():
    """The Supabase FK join returns circuit data under the 'circuit_id' key."""
    service = CircuitsService()
    race_data = {
        "season_year": 2025,
        "round": 1,
        "race_date": "2025-03-16",
        "circuit_id": {
            "id": "melbourne",
            "name": "Melbourne Grand Prix Circuit",
            "description": "Albert Park",
            "length_km": 5.278,
            "lap_record": "1:20.235",
            "total_laps": 58,
            "poster_url": None,
        },
    }

    info = service._circuit_info_from_race(race_data)

    assert info is not None
    assert isinstance(info, CircuitInfo)
    assert info.name == "Melbourne Grand Prix Circuit"
    assert info.round == 1
    assert info.season_year == 2025
    assert info.length_km == 5.278
    assert info.total_laps == 58


def test_circuit_info_from_race_returns_none_when_empty():
    """Missing race data should be handled gracefully."""
    service = CircuitsService()
    assert service._circuit_info_from_race(None) is None
    assert service._circuit_info_from_race({}) is None
