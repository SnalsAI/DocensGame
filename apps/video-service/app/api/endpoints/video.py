"""
Video generation endpoints
"""

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class VideoGenerateRequest(BaseModel):
    audio_url: str
    avatar_id: str = "default"
    background: Optional[str] = None


class VideoGenerateResponse(BaseModel):
    video_url: str
    thumbnail_url: str
    duration: int


class VideoStatusResponse(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int
    video_url: Optional[str] = None
    error: Optional[str] = None


@router.post("/generate", response_model=VideoGenerateResponse)
async def generate_video(request: VideoGenerateRequest, req: Request):
    """
    Generate talking head video from audio using SadTalker
    """
    try:
        video_engine = req.app.state.video_engine
        result = await video_engine.generate_video(
            audio_url=request.audio_url,
            avatar_id=request.avatar_id,
            background=request.background,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-async")
async def generate_video_async(
    request: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    req: Request,
):
    """
    Start async video generation job
    """
    try:
        video_engine = req.app.state.video_engine
        job_id = await video_engine.start_video_job(
            audio_url=request.audio_url,
            avatar_id=request.avatar_id,
            background=request.background,
        )

        background_tasks.add_task(
            video_engine.process_video_job,
            job_id,
        )

        return {"job_id": job_id, "status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}", response_model=VideoStatusResponse)
async def get_video_status(job_id: str, req: Request):
    """
    Get video generation job status
    """
    try:
        video_engine = req.app.state.video_engine
        status = await video_engine.get_job_status(job_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/thumbnail")
async def generate_thumbnail(video_url: str, timestamp: int, req: Request):
    """
    Generate thumbnail from video
    """
    try:
        video_engine = req.app.state.video_engine
        thumbnail_url = await video_engine.generate_thumbnail(video_url, timestamp)
        return {"thumbnail_url": thumbnail_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
