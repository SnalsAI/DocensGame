"""
API routes for Video Service
"""

from fastapi import APIRouter

from app.api.endpoints import tts, video, avatars

router = APIRouter()

router.include_router(tts.router, prefix="/tts", tags=["tts"])
router.include_router(video.router, prefix="/video", tags=["video"])
router.include_router(avatars.router, prefix="/avatars", tags=["avatars"])
