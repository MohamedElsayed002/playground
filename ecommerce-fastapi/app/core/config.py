"""
app/core/config.py

Centralized settings loaded from .env file

NestJS equivalent -> ConfigModule / ConfigService 
FastAPI approach -> pydantic-settings BaseSeetings
    - Read from .env automatically 
    - Validates types (DATABASE_URL must be a valid URL, etc.)
    - Raises clear errors at startup if a required var is missing
"""

from functools import lru_cache 
from pydantic import AnyUrl, field_validator 
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    # APP 
    APP_NAME: str = "FastAPI Ecommerce"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True 
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000 

    # Database 
    DATABASE_URL: str 

    # JWT 
    JWT_SECRET_KEY: str 
    JWT_ALGORITHM: str = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7 

    # FILE UPLOADS
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp,image/gif"

    # CORS 
    CORS_ORIGINS: str = "http://localhost:3000"
    BUCKET_NAME: str

    # Pydantic-settings config: reads from .env file
    model_config = SettingsConfigDict(env_file=".env",case_sensitive=True)

    # Computer helpers
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def allowed_image_types_list(self) -> list[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache 
def get_settings() -> Settings:
    return Settings()

settings = get_settings()