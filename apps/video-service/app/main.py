"""
EDU-ATELIER Video Service
FastAPI microservice for video generation (TTS + SadTalker + FFmpeg)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.api import router as api_router
from app.core.config import settings
from app.services.video_engine import VideoEngine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("🎬 Starting EDU-ATELIER Video Service...")

    # Initialize video engine
    video_engine = VideoEngine()
    await video_engine.initialize()
    app.state.video_engine = video_engine

    # Ensure directories exist
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    os.makedirs(settings.AVATARS_DIR, exist_ok=True)

    print("✅ Video Service ready!")

    yield

    # Shutdown
    print("🛑 Shutting down Video Service...")
    await video_engine.cleanup()


app = FastAPI(
    title="EDU-ATELIER Video Service",
    description="Video generation service with TTS and talking head animation",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (avatars, generated videos)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "video-service",
        "version": "0.1.0",
    }
