"""Configuração validada do runtime."""

from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    twilio_account_sid: str = Field(min_length=1)
    twilio_auth_token: SecretStr = Field(min_length=1)
    twilio_phone_number: str = Field(min_length=1)
    elevenlabs_api_key: SecretStr = Field(min_length=1)
    elevenlabs_voice_id: str = Field(min_length=1)
    openai_api_key: SecretStr = Field(min_length=1)
    port: int = Field(default=7860, ge=1, le=65535)
    public_wss_url: str = Field(min_length=1)
    tree_path: str = "data/tree.dev.json"


@lru_cache
def get_settings() -> Settings:
    """Valida variáveis na primeira chamada e falha com nomes de campos ausentes."""
    return Settings()
