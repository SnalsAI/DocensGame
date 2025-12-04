"""
EDU-ATELIER AI Service
FastAPI microservice for AI-powered content processing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import router as api_router
from app.core.config import settings
from app.services.model_manager import ModelManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("🚀 Starting EDU-ATELIER AI Service...")

    # Initialize model manager
    model_manager = ModelManager()
    await model_manager.initialize()
    app.state.model_manager = model_manager

    print("✅ AI Service ready!")

    yield

    # Shutdown
    print("🛑 Shutting down AI Service...")
    await model_manager.cleanup()


app = FastAPI(
    title="EDU-ATELIER AI Service",
    description="AI-powered content processing for educational platform",
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

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "0.1.0",
    }
