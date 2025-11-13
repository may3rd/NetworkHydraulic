"""Basic tests for the Hydraulic Network Calculator API.

This module provides basic tests for the API endpoints and integration
with the network-hydraulic library.
"""

import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import create_app
from backend.database import get_db, Base
from backend.config import settings

# Create test database
test_engine = create_engine("sqlite:///:memory:", echo=False)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    """Create test client with overridden dependencies."""
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    
    # Create tables
    Base.metadata.create_all(bind=test_engine)
    
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Hydraulic Network Calculator API"
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "version" in data


def test_cors_headers(client):
    """Test CORS headers are present."""
    response = client.options("/api/calculate/")
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_invalid_endpoint(client):
    """Test invalid endpoint returns 404."""
    response = client.get("/api/invalid")
    assert response.status_code == 404


def test_calculation_validation_error(client):
    """Test calculation validation with invalid data."""
    invalid_request = {
        "configuration": {
            "network": {
                "name": "test",
                "fluid": {}  # Missing required fields
            },
            "sections": []
        }
    }
    
    response = client.post("/api/calculate/", json=invalid_request)
    assert response.status_code == 400
    
    data = response.json()
    assert data["success"] is False
    assert "error" in data


def test_configuration_validation_endpoint(client):
    """Test configuration validation endpoint."""
    valid_config = {
        "configuration": {
            "network": {
                "name": "Test Network",
                "fluid": {
                    "name": "Water",
                    "phase": "liquid",
                    "temperature": {"value": 25.0, "unit": "degC"},
                    "pressure": {"value": 101.325, "unit": "kPa"},
                    "density": {"value": 998.0, "unit": "kg/m^3"},
                    "viscosity": {"value": 1.0, "unit": "cP"}
                },
                "sections": [
                    {
                        "id": "test_section",
                        "schedule": "40",
                        "pipe_NPD": 2.0,
                        "roughness": 4.57e-5,
                        "length": {"value": 10.0, "unit": "m"},
                        "fitting_type": "LR",
                        "fittings": []
                    }
                ]
            }
        }
    }
    
    response = client.post("/api/calculate/validate", json=valid_config)
    assert response.status_code == 200
    
    data = response.json()
    assert data["valid"] is True
    assert "errors" in data
    assert "warnings" in data


def test_templates_endpoint(client):
    """Test templates endpoint."""
    response = client.get("/api/config/templates")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)


def test_fitting_types_endpoint(client):
    """Test fitting types endpoint."""
    response = client.get("/api/config/fittings")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)


def test_system_status_endpoint(client):
    """Test system status endpoint."""
    response = client.get("/api/calculate/system/status")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "system" in data["data"]
    assert "queue" in data["data"]


def test_websocket_url_endpoint(client):
    """Test WebSocket URL endpoint."""
    response = client.get("/api/calculate/progress/ws-url")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "websocket_url" in data["data"]


def test_history_endpoints(client):
    """Test history endpoints."""
    # Test history list (should be empty initially)
    response = client.get("/api/history/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 0
    
    # Test statistics (should be zero initially)
    response = client.get("/api/history/statistics")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_calculations"] == 0


def test_results_endpoints(client):
    """Test results endpoints with non-existent calculation."""
    calculation_id = "non_existent_id"
    
    # Test results endpoint
    response = client.get(f"/api/results/{calculation_id}")
    assert response.status_code == 404
    
    # Test summary endpoint
    response = client.get(f"/api/results/{calculation_id}/summary")
    assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__])