"""
Configuration settings for Video Service
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Service
    SERVICE_NAME: str = "edu-atelier-video"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "edu-atelier"
    MINIO_SECURE: bool = False

    # Directories
    TEMP_DIR: str = "/tmp/videos"
    AVATARS_DIR: str = "/app/avatars"

    # TTS Settings
    TTS_MODEL: str = "tts_models/it/mai_female/vits"
    TTS_SPEAKER: str = "default"

    # Video Settings
    VIDEO_FPS: int = 25
    VIDEO_RESOLUTION: tuple = (1280, 720)

    # GPU
    USE_GPU: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
