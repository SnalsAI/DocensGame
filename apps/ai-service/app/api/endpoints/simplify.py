"""
Text simplification endpoints for DSA/BES/L2 students
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SimplifyRequest(BaseModel):
    text: str
    level: str = "dsa"  # dsa, l2_a1, l2_a2, l2_b1
    preserve_key_terms: bool = True


class SimplifyResponse(BaseModel):
    simplified: str
    reading_level: str
    word_count_original: int
    word_count_simplified: int


class ReadabilityRequest(BaseModel):
    text: str


class ReadabilityResponse(BaseModel):
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    average_sentence_length: float
    average_word_length: float
    complex_word_percentage: float


@router.post("/text", response_model=SimplifyResponse)
async def simplify_text(request: SimplifyRequest, req: Request):
    """
    Simplify text for DSA/BES/L2 students
    """
    try:
        model_manager = req.app.state.model_manager
        result = await model_manager.simplify_text(
            text=request.text,
            level=request.level,
            preserve_key_terms=request.preserve_key_terms,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/readability", response_model=ReadabilityResponse)
async def analyze_readability(request: ReadabilityRequest, req: Request):
    """
    Analyze text readability metrics
    """
    try:
        model_manager = req.app.state.model_manager
        result = await model_manager.analyze_readability(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/highlight-keywords")
async def highlight_keywords(text: str, req: Request):
    """
    Extract and highlight key terms for better comprehension
    """
    try:
        model_manager = req.app.state.model_manager
        result = await model_manager.extract_keywords(text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
