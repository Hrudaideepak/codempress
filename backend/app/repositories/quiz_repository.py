import json
import logging
from typing import List, Dict, Tuple, Any
from backend.database import execute_query, execute_batch_write

logger = logging.getLogger("codempress.quiz_repository")

class QuizRepository:
    @staticmethod
    async def get_questions_by_ids(question_ids: List[int]) -> Dict[int, int]:
        """Batch fetches question IDs and returns map of question_id -> correct_answer."""
        if not question_ids:
            return {}
        placeholders = ",".join("?" for _ in question_ids)
        rows = await execute_query(
            f"SELECT _id, correct_answer FROM questions WHERE _id IN ({placeholders})",
            tuple(question_ids)
        )
        return {row["_id"]: row["correct_answer"] for row in rows}

    @staticmethod
    async def get_user_topic_progress(user_id: int, topic_id: int) -> Dict[str, Any]:
        """Fetches progress record for a user and topic."""
        rows = await execute_query(
            "SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ?",
            (user_id, topic_id)
        )
        return rows[0] if rows else {}

    @staticmethod
    async def get_user_stats(user_id: int) -> Dict[str, Any]:
        """Fetches current user XP and streak count."""
        rows = await execute_query("SELECT xp, streak_count FROM users WHERE _id = ?", (user_id,))
        return rows[0] if rows else {"xp": 0, "streak_count": 0}

    @staticmethod
    async def save_quiz_attempt_transaction(
        user_id: int,
        topic_id: int,
        score_percent: int,
        xp_earned: int,
        new_total_xp: int,
        new_streak: int,
        total_mastery: int,
        has_progress_record: bool
    ) -> List[int]:
        """Executes attempt recording, user XP update, and progress update atomically."""
        queries_and_params: List[Tuple[str, Tuple]] = []

        # 1. Record quiz attempt
        queries_and_params.append((
            "INSERT INTO quiz_attempts (user_id, topic_id, score_percent, xp_earned) VALUES (?, ?, ?, ?)",
            (user_id, topic_id, score_percent, xp_earned)
        ))

        # 2. Update user stats
        queries_and_params.append((
            "UPDATE users SET xp = ?, streak_count = ? WHERE _id = ?",
            (new_total_xp, new_streak, user_id)
        ))

        # 3. Update or insert progress
        if has_progress_record:
            queries_and_params.append((
                "UPDATE user_progress SET mastery_percent = ?, last_studied = CURRENT_TIMESTAMP WHERE user_id = ? AND topic_id = ?",
                (total_mastery, user_id, topic_id)
            ))
        else:
            queries_and_params.append((
                "INSERT INTO user_progress (user_id, topic_id, mastery_percent) VALUES (?, ?, ?)",
                (user_id, topic_id, total_mastery)
            ))

        return await execute_batch_write(queries_and_params)

quiz_repository = QuizRepository()
