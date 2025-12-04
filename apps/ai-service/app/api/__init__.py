"""
API routes for AI Service
"""

from fastapi import APIRouter

from app.api.endpoints import content, quiz, simplify

router = APIRouter()

router.include_router(content.router, prefix="/content", tags=["content"])
router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
router.include_router(simplify.router, prefix="/simplify", tags=["simplify"])
