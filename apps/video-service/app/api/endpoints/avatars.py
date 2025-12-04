"""
Avatar management endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class Avatar(BaseModel):
    id: str
    name: str
    image_url: str
    voice_id: Optional[str] = None
    is_default: bool = False


class AvatarListResponse(BaseModel):
    avatars: List[Avatar]


@router.get("/", response_model=AvatarListResponse)
async def list_avatars():
    """
    List available avatars for video generation
    """
    return {
        "avatars": [
            {
                "id": "default",
                "name": "Avatar Default",
                "image_url": "/static/avatars/default.png",
                "voice_id": "default",
                "is_default": True,
            },
            {
                "id": "teacher-male-1",
                "name": "Professore 1",
                "image_url": "/static/avatars/teacher-male-1.png",
                "voice_id": "male-1",
                "is_default": False,
            },
            {
                "id": "teacher-female-1",
                "name": "Professoressa 1",
                "image_url": "/static/avatars/teacher-female-1.png",
                "voice_id": "female-1",
                "is_default": False,
            },
            {
                "id": "teacher-female-2",
                "name": "Professoressa 2",
                "image_url": "/static/avatars/teacher-female-2.png",
                "voice_id": "female-2",
                "is_default": False,
            },
            {
                "id": "animated-1",
                "name": "Avatar Animato",
                "image_url": "/static/avatars/animated-1.png",
                "voice_id": "default",
                "is_default": False,
            },
        ]
    }


@router.get("/{avatar_id}", response_model=Avatar)
async def get_avatar(avatar_id: str):
    """
    Get avatar details
    """
    avatars = {
        "default": {
            "id": "default",
            "name": "Avatar Default",
            "image_url": "/static/avatars/default.png",
            "voice_id": "default",
            "is_default": True,
        },
        "teacher-male-1": {
            "id": "teacher-male-1",
            "name": "Professore 1",
            "image_url": "/static/avatars/teacher-male-1.png",
            "voice_id": "male-1",
            "is_default": False,
        },
    }

    if avatar_id not in avatars:
        raise HTTPException(status_code=404, detail="Avatar not found")

    return avatars[avatar_id]


@router.post("/upload")
async def upload_avatar(
    name: str,
    file: UploadFile = File(...),
    voice_id: Optional[str] = None,
    req: Request = None,
):
    """
    Upload custom avatar image
    """
    try:
        video_engine = req.app.state.video_engine
        avatar = await video_engine.upload_avatar(
            name=name,
            file=file,
            voice_id=voice_id,
        )
        return avatar
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
