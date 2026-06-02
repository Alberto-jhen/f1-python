"""
The `conftest.py` file serves as a centralized configuration and setup hub for `pytest`.
Its primary purpose is to define reusable fixtures—such as the asynchronous HTTPX test 
client—and initialization logic (like loading environment variables) that are automatically 
shared across all test files within its directory, eliminating the need for explicit 
imports or repetitive setup code.
"""

import pytest
import os
import sys
from httpx import AsyncClient, ASGITransport
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

from main import app

@pytest.fixture(scope="session")
def anyio_backend():
    """Configura el backend para pruebas asíncronas."""
    return "asyncio"

@pytest.fixture
async def client():
    """Fixture que proporciona un cliente HTTP asíncrono conectado a la app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac