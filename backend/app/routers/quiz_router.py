import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from backend.auth import get_current_user, get_current_user_optional
from backend.app.domain.models import AnswerSubmission, QuizSubmission, QuizResultDTO
from backend.app.services.quiz_service import quiz_service

logger = logging.getLogger("codempress.quiz_router")
router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

async def recalculate_topic_mastery(user_id: int, topic_id: int):
    return await quiz_service.recalculate_topic_mastery(user_id, topic_id)

@router.post("/submit", response_model=QuizResultDTO)
async def submit_quiz(submission: QuizSubmission, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Evaluates quiz submission, awards XP/streaks, updates topic mastery, and returns result."""
    user_id = 1
    if current_user and isinstance(current_user, dict):
        sub_val = str(current_user.get("sub", "1"))
        if sub_val.isdigit():
            user_id = int(sub_val)

    try:
        result = await quiz_service.process_quiz_submission(user_id, submission, current_user=current_user)
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Quiz submission failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error evaluating quiz submission")
