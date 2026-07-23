import logging
from typing import List
from backend.app.domain.models import QuizSubmission, QuizResultDTO
from backend.app.repositories.quiz_repository import quiz_repository

logger = logging.getLogger("codempress.quiz_service")

class QuizService:
    def __init__(self, repo=quiz_repository):
        self.repo = repo

    async def process_quiz_submission(self, user_id: int, submission: QuizSubmission) -> QuizResultDTO:
        """Evaluates submitted answers, calculates score/XP/mastery, and commits database transaction."""
        topic_id = submission.topic_id
        answers = submission.answers
        
        if not answers:
            raise ValueError("No answers submitted")

        total_questions = len(answers)
        question_ids = [ans.question_id for ans in answers]

        # 1. Batch fetch correct answer keys from repository
        correct_answers_map = await self.repo.get_questions_by_ids(question_ids)

        # 2. Evaluate accuracy score
        correct_count = sum(
            1 for ans in answers
            if correct_answers_map.get(ans.question_id) is not None and 
               correct_answers_map.get(ans.question_id) == ans.selected_option
        )

        score_percent = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
        xp_earned = (correct_count * 10) + (50 if score_percent >= 80 else 0)

        # 3. Calculate mastery: 30% for reading theory + up to 70% for quiz score accuracy
        prog = await self.repo.get_user_topic_progress(user_id, topic_id)
        has_progress = bool(prog)
        theory_score = 30 if (has_progress and prog.get("theory_read")) else 0
        quiz_score = int((score_percent / 100.0) * 70)
        total_mastery = min(100, theory_score + quiz_score)

        # 4. Fetch user stats and compute update increments
        user_stats = await self.repo.get_user_stats(user_id)
        new_total_xp = user_stats.get("xp", 0) + xp_earned
        new_streak = user_stats.get("streak_count", 0) + 1

        # 5. Commit batch atomic database transaction
        await self.repo.save_quiz_attempt_transaction(
            user_id=user_id,
            topic_id=topic_id,
            score_percent=score_percent,
            xp_earned=xp_earned,
            new_total_xp=new_total_xp,
            new_streak=new_streak,
            total_mastery=total_mastery,
            has_progress_record=has_progress
        )

        return QuizResultDTO(
            score_percent=score_percent,
            correct_count=correct_count,
            total_questions=total_questions,
            xp_earned=xp_earned,
            topic_mastery_percent=total_mastery,
            passed=score_percent >= 60
        )

    async def recalculate_topic_mastery(self, user_id: int, topic_id: int) -> int:
        """Calculates mastery: 30% for reading theory + up to 70% based on quiz accuracy."""
        prog = await self.repo.get_user_topic_progress(user_id, topic_id)
        has_progress = bool(prog)
        theory_score = 30 if (has_progress and prog.get("theory_read")) else 0

        attempts = await self.repo.get_questions_by_ids([]) # reuse query
        from backend.database import execute_query, execute_write
        attempts_rows = await execute_query(
            "SELECT score_percent FROM quiz_attempts WHERE user_id = ? AND topic_id = ? ORDER BY _id DESC LIMIT 1",
            (user_id, topic_id)
        )
        quiz_score = int((attempts_rows[0]["score_percent"] / 100.0) * 70) if attempts_rows else 0
        total_mastery = min(100, theory_score + quiz_score)

        if has_progress:
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

quiz_service = QuizService()
