import json

def test_health_check_success(client):
    """Test health endpoint returns 200 and success object."""
    response = client.get("/health")
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["database"] == "connected"

def test_version_check(client):
    """Test version endpoint returns application details."""
    response = client.get("/version")
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data["success"] is True
    assert "version" in data["data"]
    assert data["data"]["api_version"] == "v1"

def test_status_check(client):
    """Test status check endpoint retrieves configurations."""
    response = client.get("/status")
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data["success"] is True
    assert data["data"]["environment"] == "testing"
    assert data["data"]["testing_mode"] is True

def test_api_index(client):
    """Test api root catalog is returned."""
    response = client.get("/api")
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data["success"] is True
    assert len(data["data"]["endpoints"]) == 4
