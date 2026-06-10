from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    AUTH_SERVICE_URL: str = "http://localhost:8001"
    FILE_SERVICE_URL: str = "http://localhost:8002"
    METADATA_SERVICE_URL: str = "http://localhost:8003"
    TELEGRAM_SERVICE_URL: str = "http://localhost:8004"
    AI_SERVICE_URL: str = "http://localhost:8005"

    REQUEST_TIMEOUT_SECONDS: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
