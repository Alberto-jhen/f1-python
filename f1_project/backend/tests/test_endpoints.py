import pytest
from httpx import Response

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