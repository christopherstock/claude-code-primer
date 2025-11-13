"""
Tests for main application endpoints (root and health check).
"""
import pytest
from fastapi import status


@pytest.mark.api
class TestRootEndpoint:
    """Tests for the root endpoint."""

    def test_root_endpoint_success(self, test_client):
        """Test that root endpoint returns correct information."""
        response = test_client.get("/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Todo App API"
        assert data["version"] == "1.0.0"
        assert data["docs"] == "/docs"

    def test_root_endpoint_structure(self, test_client):
        """Test that root endpoint has the expected structure."""
        response = test_client.get("/")
        data = response.json()

        assert "message" in data
        assert "version" in data
        assert "docs" in data
        assert isinstance(data["message"], str)
        assert isinstance(data["version"], str)
        assert isinstance(data["docs"], str)


@pytest.mark.api
class TestHealthCheckEndpoint:
    """Tests for the health check endpoint."""

    def test_health_check_healthy(self, test_client):
        """Test health check returns healthy status with fake Redis."""
        response = test_client.get("/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["redis"] == "connected"

    def test_health_check_structure(self, test_client):
        """Test health check response has the expected structure."""
        response = test_client.get("/health")
        data = response.json()

        assert "status" in data
        assert "redis" in data
        assert data["status"] in ["healthy", "unhealthy"]
        assert data["redis"] in ["connected", "disconnected"]

    def test_health_check_response_type(self, test_client):
        """Test health check returns JSON response."""
        response = test_client.get("/health")

        assert response.headers["content-type"] == "application/json"
        assert isinstance(response.json(), dict)


@pytest.mark.api
class TestCORS:
    """Tests for CORS configuration."""

    def test_cors_headers_present(self, test_client):
        """Test that CORS headers are present in responses."""
        response = test_client.options(
            "/api/todos/",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )

        # Check for CORS headers
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers


@pytest.mark.api
class TestAPIDocumentation:
    """Tests for API documentation endpoints."""

    def test_openapi_json_accessible(self, test_client):
        """Test that OpenAPI JSON schema is accessible."""
        response = test_client.get("/openapi.json")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert data["info"]["title"] == "Todo App API"
        assert data["info"]["version"] == "1.0.0"

    def test_swagger_ui_accessible(self, test_client):
        """Test that Swagger UI documentation is accessible."""
        response = test_client.get("/docs")

        assert response.status_code == status.HTTP_200_OK
        assert "text/html" in response.headers["content-type"]

    def test_redoc_accessible(self, test_client):
        """Test that ReDoc documentation is accessible."""
        response = test_client.get("/redoc")

        assert response.status_code == status.HTTP_200_OK
        assert "text/html" in response.headers["content-type"]


@pytest.mark.api
class TestLifecycleEvents:
    """Tests for application lifecycle events."""

    def test_startup_event(self, capsys):
        """Test startup event handler executes."""
        from app.main import app, startup_event
        import asyncio

        # Run the startup event
        asyncio.run(startup_event())

        # Capture printed output
        captured = capsys.readouterr()
        assert "Starting Todo App API..." in captured.out
        assert "Redis connection:" in captured.out

    def test_shutdown_event(self, capsys):
        """Test shutdown event handler executes."""
        from app.main import shutdown_event
        import asyncio

        # Run the shutdown event
        asyncio.run(shutdown_event())

        # Capture printed output
        captured = capsys.readouterr()
        assert "Shutting down Todo App API..." in captured.out
