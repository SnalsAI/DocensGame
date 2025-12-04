"""
Content processing endpoints
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()


class ParseRequest(BaseModel):
    text: str
    file_url: Optional[str] = None


class ParseResponse(BaseModel):
    concepts: List[str]
    key_points: List[str]
    entities: Dict[str, List[str]]


class SummarizeRequest(BaseModel):
    text: str
    type: str = "brief"  # brief, detailed, key_points, dsa_adapted, l2_adapted


class SummarizeResponse(BaseModel):
    summary: str


class ConceptMapRequest(BaseModel):
    text: str


class ConceptMapResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class ScriptRequest(BaseModel):
    text: str
    style: str = "educational"


class ScriptResponse(BaseModel):
    script: str


@router.post("/parse", response_model=ParseResponse)
async def parse_content(request: ParseRequest, req: Request):
    """
    Parse content and extract concepts, key points, and entities
    """
    try:
        model_manager = req.app.state.model_manager
        result = await model_manager.parse_content(request.text, request.file_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_content(request: SummarizeRequest, req: Request):
    """
    Generate summary of content
    """
    try:
        model_manager = req.app.state.model_manager
        summary = await model_manager.summarize(request.text, request.type)
        return SummarizeResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/concept-map", response_model=ConceptMapResponse)
async def generate_concept_map(request: ConceptMapRequest, req: Request):
    """
    Generate concept map from text
    """
    try:
        model_manager = req.app.state.model_manager
        result = await model_manager.generate_concept_map(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-script", response_model=ScriptResponse)
async def generate_script(request: ScriptRequest, req: Request):
    """
    Generate narration script for video lesson
    """
    try:
        model_manager = req.app.state.model_manager
        script = await model_manager.generate_script(request.text, request.style)
        return ScriptResponse(script=script)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
