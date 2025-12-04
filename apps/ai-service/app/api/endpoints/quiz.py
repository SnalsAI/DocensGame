"""
Quiz generation endpoints
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Any

router = APIRouter()


class GenerateQuizRequest(BaseModel):
    text: str
    quiz_type: str = "multiple_choice"  # multiple_choice, true_false, fill_blank, matching, open_ended
    num_questions: int = 5
    difficulty: str = "medium"  # easy, medium, hard


class QuizQuestion(BaseModel):
    id: str
    question: str
    type: str
    options: Optional[List[str]] = None
    correct_answer: Any
    explanation: Optional[str] = None


class GenerateQuizResponse(BaseModel):
    questions: List[QuizQuestion]


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest, req: Request):
    """
    Generate quiz questions from content
    """
    try:
        model_manager = req.app.state.model_manager
        questions = await model_manager.generate_quiz(
            text=request.text,
            quiz_type=request.quiz_type,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
        )
        return GenerateQuizResponse(questions=questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_answer(
    question_id: str,
    user_answer: str,
    correct_answer: str,
    req: Request,
):
    """
    Validate user answer (for open-ended questions)
    """
    try:
        model_manager = req.app.state.model_manager
        result = await model_manager.validate_answer(
            question_id=question_id,
            user_answer=user_answer,
            correct_answer=correct_answer,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
