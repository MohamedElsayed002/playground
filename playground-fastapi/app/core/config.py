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
from pydantic import AnyUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):

    # APP 
    APP_NAME: str = "FastAPI Ecommerce"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True 
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000 
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_EXPORTER_OTLP_PROTOCOL: str = "grpc"
    OTEL_EXPORTER_OTLP_HEADERS: str = ""
    OTEL_SERVICE_VERSION: str = "1.0.0"

    # Database 
    DATABASE_URL: str 

    # JWT 
    JWT_SECRET_KEY: str 
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int 

    # FILE UPLOADS
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = Field(default=10, gt=0, le=100)
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp,image/gif"

    # CORS 
    CORS_ORIGINS: str = "http://localhost:3000"
    BUCKET_NAME: str
    AWS_REGION: str 
    AWS_SECRET_ACCESS_KEY: str 
    AWS_ACCESS_KEY_ID: str

    IDEMPOTENCY_KEY_TTL_HOURS: float = 0.25

    OPENAI_API_KEY: str
    INNGEST_SIGNING_KEY: Optional[str] = None
    INNGEST_EVENT_KEY: Optional[str] = None

    RESEND_API_KEY: str
    STRIPE_SECRET_KEY: Optional[str] = None

    WORKOS_ORGANIZATION_ID: str
    WORKOS_CLIENT_ID: str 
    WORKOS_API_KEY: str

    STRIPE_SECRET_KEY: str 
    STRIPE_PUBLISHABLE_KEY: str 
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_WEBHOOK_SECRET: str 


    DISCORD_ORDER_WEBHOOK_URL: str 



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