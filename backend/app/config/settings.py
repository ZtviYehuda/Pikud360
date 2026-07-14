import os
from functools import lru_cache
from typing import Optional
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

class Settings:
    """Base application settings managed via environment variables."""
    
    # Flask configuration
    FLASK_APP: str = os.getenv("FLASK_APP", "run.py")
    ENV: str = os.getenv("FLASK_ENV", "development").lower()
    DEBUG: bool = ENV == "development"
    TESTING: bool = ENV == "testing"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_123")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev_jwt_secret_key_456")
    PORT: int = int(os.getenv("PORT", 5000))
    
    # PostgreSQL configuration
    DB_USER: str = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres_secure_pass_123")
    DB_NAME: str = os.getenv("POSTGRES_DB", "pikud360_db")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    
    # DB connection pool configurations
    DB_MIN_CONNECTIONS: int = int(os.getenv("DB_MIN_CONNECTIONS", 1))
    DB_MAX_CONNECTIONS: int = int(os.getenv("DB_MAX_CONNECTIONS", 10))
    
    @property
    def database_url(self) -> str:
        """Returns the PostgreSQL connection string."""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

class DevelopmentSettings(Settings):
    ENV: str = "development"
    DEBUG: bool = True

class TestingSettings(Settings):
    ENV: str = "testing"
    TESTING: bool = True
    DEBUG: bool = True
    DB_NAME: str = f"{os.getenv('POSTGRES_DB', 'pikud360_db')}_test"

class ProductionSettings(Settings):
    ENV: str = "production"
    DEBUG: bool = False
    TESTING: bool = False

@lru_cache()
def get_settings() -> Settings:
    """Returns the cached configurations based on current FLASK_ENV."""
    env = os.getenv("FLASK_ENV", "development").lower()
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    return DevelopmentSettings()
