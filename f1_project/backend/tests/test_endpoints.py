import pytest
from fastapi.routing import APIRoute
from httpx import ASGITransport, AsyncClient, Response
from fastf1.core import DataNotLoadedError

import api.routes.predict as predict_route
from main import app as api_app

# Test to check if the API is answering (health check)
@pytest.mark.anyio
async def test_read_root(client):
    response: Response = await client.get("/")
    assert response.status_code == 200
    assert "status" in response.json() or "message" in response.json()

# Test for driver career endpoint
@pytest.mark.anyio
async def test_get_driver_career_success(client):
    # Simulate a petition.
    driver_name = "Max Verstappen"
    response: Response = await client.get(f"/data/career/standings/{driver_name}")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check the JSON structure.
    assert "titles" in data
    assert "wins" in data
    assert "podiums" in data

# Test for checking error handling
@pytest.mark.anyio
async def test_get_driver_career_not_found(client):
    # Made up name
    invalid_driver = "PilotoInexistente99"
    response: Response = await client.get(f"/data/career/standings/{invalid_driver}")
    
    assert response.status_code == 404 or "error" in response.json()

@pytest.mark.anyio
async def test_degradation_missing_laps_returns_service_unavailable_with_cors(
    client, monkeypatch
):
    class SessionWithoutLaps:
        def load(self, **kwargs):
            pass

        @property
        def laps(self):
            raise DataNotLoadedError("Lap data was not loaded")

    monkeypatch.setattr(
        predict_route.fastf1, "get_session", lambda *args: SessionWithoutLaps()
    )

    response: Response = await client.get(
        "/predict/degradation/2025/Australian%20Grand%20Prix/NOR",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 503
    assert "datos de vueltas" in response.json()["detail"]
    assert response.headers["access-control-allow-origin"] in {
        "*",
        "http://localhost:5173",
    }


@pytest.mark.anyio
async def test_unhandled_server_error_keeps_cors_header():
    async def raise_unhandled_error():
        raise RuntimeError("Simulated internal error")

    fastapi_app = api_app.app
    test_route = APIRoute(
        "/__test_unhandled_error", raise_unhandled_error, methods=["GET"]
    )
    fastapi_app.router.routes.append(test_route)

    try:
        transport = ASGITransport(app=api_app, raise_app_exceptions=False)
        async with AsyncClient(
            transport=transport, base_url="http://testserver"
        ) as test_client:
            response: Response = await test_client.get(
                "/__test_unhandled_error",
                headers={"Origin": "http://localhost:5173"},
            )
    finally:
        fastapi_app.router.routes.remove(test_route)

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] in {
        "*",
        "http://localhost:5173",
    }
