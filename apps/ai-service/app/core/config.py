"""
Configuration settings for AI Service
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Service
    SERVICE_NAME: str = "edu-atelier-ai"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Model paths
    MODEL_PATH: str = "/models"
    LLM_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.2"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Model settings
    USE_GPU: bool = True
    MAX_NEW_TOKENS: int = 1024
    TEMPERATURE: float = 0.7

    # Fallback API (optional)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    USE_FALLBACK: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
