from __future__ import annotations
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PORT: int = 8002
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:8000"
    FIREBASE_CREDENTIALS_PATH: str = "./secrets/firebase-admin-key.json"
    TELEGRAM_SERVICE_URL: str = "http://localhost:8004"
    METADATA_SERVICE_URL: str = "http://localhost:8003"
    CHUNK_SIZE_BYTES: int = 49_000_000
    MAX_FILE_SIZE_BYTES: int = 5_368_709_120
    REQUEST_TIMEOUT_SECONDS: int = 300

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
