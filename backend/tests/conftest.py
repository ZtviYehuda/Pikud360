import os
import pytest
from unittest.mock import patch

# Force test configuration
os.environ["FLASK_ENV"] = "testing"

@pytest.fixture(autouse=True)
def mock_db_pool():
    """Mocks database connection checks and connection pooling initialization during tests."""
    with patch("app.database.connection.DatabaseConnectionManager.initialize") as mock_init, \
         patch("app.database.connection.DatabaseConnectionManager.check_health", return_value=True) as mock_health:
        yield mock_init, mock_health

@pytest.fixture
def app():
    """Flask application fixture for testing."""
    from app import create_app
    app = create_app()
    return app

@pytest.fixture
def client(app):
    """A test client for testing API endpoints."""
    return app.test_client()
