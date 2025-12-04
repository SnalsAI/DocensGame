"""
Text-to-Speech endpoints
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice_id: str = "default"
    speed: float = 1.0
    pitch: float = 1.0


class TTSResponse(BaseModel):
    audio_url: str
    duration: float


@router.post("/generate", response_model=TTSResponse)
async def generate_speech(request: TTSRequest, req: Request):
    """
    Generate speech audio from text using Coqui TTS
    """
    try:
        video_engine = req.app.state.video_engine
        result = await video_engine.generate_audio(
            text=request.text,
            voice_id=request.voice_id,
            speed=request.speed,
            pitch=request.pitch,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices")
async def list_voices():
    """
    List available TTS voices
    """
    return {
        "voices": [
            {"id": "default", "name": "Voce Standard", "language": "it-IT", "gender": "female"},
            {"id": "male-1", "name": "Voce Maschile 1", "language": "it-IT", "gender": "male"},
            {"id": "female-1", "name": "Voce Femminile 1", "language": "it-IT", "gender": "female"},
            {"id": "female-2", "name": "Voce Femminile 2", "language": "it-IT", "gender": "female"},
        ]
    }


@router.get("/audio/{audio_id}")
async def get_audio(audio_id: str, req: Request):
    """
    Get generated audio file
    """
    try:
        video_engine = req.app.state.video_engine
        audio_path = await video_engine.get_audio_path(audio_id)
        return FileResponse(audio_path, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
