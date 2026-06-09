from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    PROJECT_NAME: str = "Worklyn"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    APP_ENV: str = "development"

    CORS_ORIGINS: List[str] | str = [
        "http://localhost:3000",
        "http://frontend:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """
        Parses comma-separated CORS origins from environment variable.
        """
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/postgres"
    REDIS_URL: str = "redis://redis:6379/0"
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/"

    # S3 Storage Configuration
    S3_BUCKET: str = "worklyn"
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_REGION: str | None = None
    S3_CUSTOM_DOMAIN: str | None = None

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
