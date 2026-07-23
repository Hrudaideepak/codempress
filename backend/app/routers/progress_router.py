import logging
from fastapi import APIRouter, Depends
from backend.database import execute_query
from backend.auth import get_current_user

logger = logging.getLogger("codempress.progress_router")
router = APIRouter(prefix="/api", tags=["Progress"])


@router.get("/progress/me")
async def get_my_progress(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's overall progress stats."""
    try:
        user_id = int(current_user["sub"]) if current_user and "sub" in current_user and str(current_user["sub"]).isdigit() else 1
    except Exception:
        user_id = 1

    # Get user record for XP and streak_count from schema
    user_rows = await execute_query(
        "SELECT xp, streak_count FROM users WHERE _id = ?", (user_id,)
    )
    xp = user_rows[0]["xp"] if user_rows and user_rows[0]["xp"] is not None else 0
    streak = user_rows[0]["streak_count"] if user_rows and user_rows[0]["streak_count"] is not None else 0
    level = int((xp / 100) ** 0.5) + 1 if xp > 0 else 1

    # Count mastered topics (mastery >= 60%)
    mastered_rows = await execute_query(
        "SELECT COUNT(*) as cnt FROM user_progress WHERE user_id = ? AND mastery_percent >= 60",
        (user_id,),
    )
    topics_mastered = mastered_rows[0]["cnt"] if mastered_rows else 0

    # Total topics
    total_rows = await execute_query("SELECT COUNT(*) as cnt FROM topics")
    total_topics = total_rows[0]["cnt"] if total_rows else 0

    overall_mastery = int((topics_mastered / total_topics) * 100) if total_topics > 0 else 0

    return {
        "xp": xp,
        "total_xp": xp,
        "level": level,
        "streak": streak,
        "current_streak": streak,
        "streak_count": streak,
        "topics_mastered": topics_mastered,
        "total_topics": total_topics,
        "overall_mastery": overall_mastery,
    }


@router.get("/rewards/me")
async def get_my_rewards(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's earned badges and rewards."""
    try:
        user_id = int(current_user["sub"]) if current_user and "sub" in current_user and str(current_user["sub"]).isdigit() else 1
    except Exception:
        user_id = 1

    user_rows = await execute_query(
        "SELECT xp FROM users WHERE _id = ?", (user_id,)
    )
    xp = user_rows[0]["xp"] if user_rows and user_rows[0]["xp"] is not None else 0

    badge_defs = [
        {"name": "First Steps", "description": "Earn your first 100 XP", "threshold": 100, "icon": "🚀"},
        {"name": "Rising Star", "description": "Earn 500 XP", "threshold": 500, "icon": "⭐"},
        {"name": "Knowledge Seeker", "description": "Earn 1000 XP", "threshold": 1000, "icon": "📚"},
        {"name": "Code Warrior", "description": "Earn 2500 XP", "threshold": 2500, "icon": "⚔️"},
        {"name": "Master Coder", "description": "Earn 5000 XP", "threshold": 5000, "icon": "🏆"},
        {"name": "Legend", "description": "Earn 10000 XP", "threshold": 10000, "icon": "👑"},
    ]

    badges = []
    for b in badge_defs:
        if xp >= b["threshold"]:
            badges.append({
                "name": b["name"],
                "description": b["description"],
                "icon": b["icon"],
                "earned": True,
            })

    return {"badges": badges, "total_xp": xp}


@router.get("/app-status")
async def get_app_status():
    """Public endpoint returning current app version and maintenance status."""
    return {
        "latest_version": "1.0.0",
        "min_version": "1.0.0",
        "update_url": "",
        "maintenance": False,
    }
