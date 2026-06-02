from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    DATABASE_URL: str
    JWT_SECRET: str = Field(min_length=16)
    JWT_EXPIRY_MINUTES: int = 720
    JWT_ALGORITHM: str = "HS256"

    # Stored as a CSV string in .env; parsed into a list via the computed
    # property below. (pydantic-settings v2.14 tries to JSON-parse list-typed
    # fields from .env before validators run, which breaks plain CSV input.)
    CORS_ALLOW_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    SEED_TREASURER_EMAIL: str
    SEED_TREASURER_PASSWORD: str
    SEED_TREASURER_NAME: str = "Society Treasurer"

    SEED_PRESIDENT_EMAIL: str
    SEED_PRESIDENT_PASSWORD: str
    SEED_PRESIDENT_NAME: str = "Society President"

    SEED_SECRETARY_EMAIL: str
    SEED_SECRETARY_PASSWORD: str
    SEED_SECRETARY_NAME: str = "Society Secretary"

    DEFAULT_ANNUAL_MAINTENANCE: int = 88000

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> List[str]:
        return [item.strip() for item in self.CORS_ALLOW_ORIGINS.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
