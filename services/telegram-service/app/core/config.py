from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PORT: int = 8004
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:8000,http://localhost:8002"

    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_CHANNEL_ID: str
    TELEGRAM_API_BASE: str = "https://api.telegram.org"

    MAX_FILE_SIZE_BYTES: int = 52428800  # 50 MB
    REQUEST_TIMEOUT_SECONDS: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def bot_api_base(self) -> str:
        return f"{self.TELEGRAM_API_BASE}/bot{self.TELEGRAM_BOT_TOKEN}"

    @property
    def file_api_base(self) -> str:
        return f"{self.TELEGRAM_API_BASE}/file/bot{self.TELEGRAM_BOT_TOKEN}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
