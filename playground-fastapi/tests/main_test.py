from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_route_returns_service_info():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "FastAPI Application Playground ",
        "service": "FastAPI Ecommerce",
    }


def test_health_route_returns_healthy():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
