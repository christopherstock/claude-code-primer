"""
Pytest configuration and shared fixtures for the Todo App backend tests.
"""
import pytest
import fakeredis
from unittest.mock import patch
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def fake_redis_client():
    """Create a single fake Redis client for all tests."""
    return fakeredis.FakeRedis(decode_responses=True)


@pytest.fixture(autouse=True)
def mock_redis(fake_redis_client, monkeypatch):
    """
    Mock Redis client creation to use FakeRedis for all tests.
    This fixture runs automatically for every test.
    """
    import redis

    def mock_redis_init(host=None, port=None, db=None, decode_responses=False, **kwargs):
        """Return the fake Redis client instead of creating a real one."""
        return fake_redis_client

    # Patch redis.Redis to return our fake client
    monkeypatch.setattr("redis.Redis", mock_redis_init)

    # Clear the fake Redis database before each test
    fake_redis_client.flushall()

    yield

    # Clean up after the test
    fake_redis_client.flushall()


@pytest.fixture
def test_client(fake_redis_client):
    """Create a test client for the FastAPI application."""
    # Import app after Redis is mocked
    from app.main import app
    from app.services import redis_service as svc

    # Replace the redis client in the singleton service with the shared fake_redis_client
    svc.redis_service.redis_client = fake_redis_client

    # Clear the database before each test
    fake_redis_client.flushall()

    yield TestClient(app)

    # Clean up after the test
    fake_redis_client.flushall()


@pytest.fixture
def redis_service(fake_redis_client):
    """Create a RedisService instance with a fake Redis client."""
    from app.services.redis_service import RedisService

    service = RedisService()
    # Replace the real Redis client with the fake one
    service.redis_client = fake_redis_client
    return service


@pytest.fixture
def sample_todo_data():
    """Sample todo data for testing."""
    return {
        "title": "Test Todo",
        "description": "This is a test todo item",
        "completed": False,
        "priority": "medium"
    }


@pytest.fixture
def sample_todo_create():
    """Sample TodoCreate data for testing."""
    return {
        "title": "New Todo",
        "description": "A new todo item",
        "completed": False,
        "priority": "medium"
    }


@pytest.fixture
def multiple_todos():
    """Multiple sample todos for testing list operations."""
    return [
        {
            "title": "First Todo",
            "description": "First item",
            "completed": False,
            "priority": "high"
        },
        {
            "title": "Second Todo",
            "description": "Second item",
            "completed": True,
            "priority": "low"
        },
        {
            "title": "Third Todo",
            "description": "Third item",
            "completed": False,
            "priority": "medium"
        }
    ]
