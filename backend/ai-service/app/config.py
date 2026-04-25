# app/config.py

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Groq
    GROQ_API_KEY: str | None = None

    # LLM
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 1024

    # App
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    CONVERSATION_TTL_MINUTES: int = 60
    MAX_HISTORY_MESSAGES: int = 50

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()