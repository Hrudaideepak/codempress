import json
import logging
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from backend.database import execute_query, execute_write
from backend.auth import get_current_user

logger = logging.getLogger("codempress.quiz_router")
router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: int

class QuizSubmission(BaseModel):
    topic_id: int
    answers: List[AnswerSubmission]

async def recalculate_topic_mastery(user_id: int, topic_id: int):
    """Calculates mastery: 30% for reading theory + up to 70% based on quiz accuracy."""
    prog_rows = await execute_query(
        "SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ?", 
        (user_id, topic_id)
    )
    
    theory_score = 30 if (prog_rows and prog_rows[0]["theory_read"]) else 0
    
    attempts = await execute_query(
        "SELECT score_percent FROM quiz_attempts WHERE user_id = ? AND topic_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id, topic_id)
    )
    
    quiz_score = int((attempts[0]["score_percent"] / 100.0) * 70) if attempts else 0
    total_mastery = min(100, theory_score + quiz_score)
    
    if prog_rows:
        await execute_write(
            "UPDATE user_progress SET mastery_percent = ?, last_studied = CURRENT_TIMESTAMP WHERE user_id = ? AND topic_id = ?",
            (total_mastery, user_id, topic_id)
        )
    else:
        await execute_write(
            "INSERT INTO user_progress (user_id, topic_id, mastery_percent) VALUES (?, ?, ?)",
            (user_id, topic_id, total_mastery)
        )
    return total_mastery

@router.post("/submit")
async def submit_quiz(submission: QuizSubmission, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    topic_id = submission.topic_id
    
    if not submission.answers:
        raise HTTPException(status_code=400, detail="No answers submitted")

    correct_count = 0
    total_questions = len(submission.answers)

    # Batch fetch correct answers to eliminate N+1 database queries loop
    question_ids = [ans.question_id for ans in submission.answers]
    if question_ids:
        placeholders = ",".join("?" for _ in question_ids)
        q_rows = await execute_query(
            f"SELECT _id, correct_answer FROM questions WHERE _id IN ({placeholders})",
            tuple(question_ids)
        )
        # Map question ID to correct answer
        answers_map = {row["_id"]: row["correct_answer"] for row in q_rows}
        
        for ans in submission.answers:
            correct_option = answers_map.get(ans.question_id)
            if correct_option is not None and correct_option == ans.selected_option:
                correct_count += 1

    score_percent = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    xp_earned = (correct_count * 10) + (50 if score_percent >= 80 else 0)

    # Prepare atomic batch writes for transaction consistency
    from backend.database import execute_batch_write
    queries_and_params = []

    # 1. Record attempt log query
    queries_and_params.append((
        "INSERT INTO quiz_attempts (user_id, topic_id, score_percent, xp_earned) VALUES (?, ?, ?, ?)",
        (user_id, topic_id, score_percent, xp_earned)
    ))

    # 2. Award user XP & update streak query
    user_rows = await execute_query("SELECT xp, streak_count FROM users WHERE _id = ?", (user_id,))
    if user_rows:
        new_xp = user_rows[0]["xp"] + xp_earned
        new_streak = user_rows[0]["streak_count"] + 1
        queries_and_params.append((
            "UPDATE users SET xp = ?, streak_count = ? WHERE _id = ?",
            (new_xp, new_streak, user_id)
        ))

    # 3. Recalculate topic mastery and prepare query
    prog_rows = await execute_query(
        "SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ?", 
        (user_id, topic_id)
    )
    theory_score = 30 if (prog_rows and prog_rows[0]["theory_read"]) else 0
    # Since we are committing the new score right now, we use the current score_percent
    quiz_score = int((score_percent / 100.0) * 70)
    total_mastery = min(100, theory_score + quiz_score)

    if prog_rows:
        queries_and_params.append((
            "UPDATE user_progress SET mastery_percent = ?, last_studied = CURRENT_TIMESTAMP WHERE user_id = ? AND topic_id = ?",
            (total_mastery, user_id, topic_id)
        ))
    else:
        queries_and_params.append((
            "INSERT INTO user_progress (user_id, topic_id, mastery_percent) VALUES (?, ?, ?)",
            (user_id, topic_id, total_mastery)
        ))

    # Execute all database writes atomically in a single transaction
    await execute_batch_write(queries_and_params)

    return {
        "score_percent": score_percent,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "xp_earned": xp_earned,
        "topic_mastery_percent": total_mastery,
        "passed": score_percent >= 60
    }
