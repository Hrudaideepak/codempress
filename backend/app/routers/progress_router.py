import json
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
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


@router.get("/progress/all")
async def get_all_user_progress(current_user: dict = Depends(get_current_user)):
    """Fetches full cross-device progress for Google OAuth user (roadmaps, topics, enrollments, XP)."""
    try:
        user_id = int(current_user["sub"]) if current_user and "sub" in current_user and str(current_user["sub"]).isdigit() else 1
    except Exception:
        user_id = 1

    # Fetch User XP & Streak
    user_rows = await execute_query("SELECT xp, streak_count FROM users WHERE _id = ?", (user_id,))
    xp = user_rows[0]["xp"] if user_rows and user_rows[0]["xp"] is not None else 0
    streak = user_rows[0]["streak_count"] if user_rows and user_rows[0]["streak_count"] is not None else 0

    # Fetch Roadmap Node Progress records
    rm_rows = await execute_query(
        "SELECT roadmap_slug, completed_nodes_json, selected_track, last_node_id, updated_at FROM user_roadmap_progress WHERE user_id = ?",
        (user_id,)
    )
    roadmaps_progress = {}
    for r in rm_rows:
        roadmaps_progress[r["roadmap_slug"]] = {
            "completed_nodes": json.loads(r["completed_nodes_json"] or "[]"),
            "selected_track": r["selected_track"] or "",
            "last_node_id": r["last_node_id"] or "",
            "updated_at": r["updated_at"]
        }

    # Fetch Enrollments
    enrolled_rows = await execute_query(
        "SELECT item_type, item_id FROM user_enrollments WHERE user_id = ?",
        (user_id,)
    )
    enrolled_items = [{"item_type": e["item_type"], "item_id": e["item_id"]} for e in enrolled_rows]

    # Fetch Completed Topics
    topic_rows = await execute_query(
        "SELECT topic_id, mastery_percent FROM user_progress WHERE user_id = ? AND mastery_percent >= 60",
        (user_id,)
    )
    completed_topics = [t["topic_id"] for t in topic_rows]

    return {
        "user_id": user_id,
        "xp": xp,
        "streak": streak,
        "roadmaps_progress": roadmaps_progress,
        "enrolled_items": enrolled_items,
        "completed_topics": completed_topics
    }


class SaveRoadmapProgressRequest(BaseModel):
    roadmap_slug: str
    node_id: Optional[str] = None
    completed_nodes: Optional[List[str]] = None
    selected_track: Optional[str] = None

@router.post("/progress/roadmap/save")
async def save_roadmap_progress(
    payload: SaveRoadmapProgressRequest,
    current_user: dict = Depends(get_current_user)
):
    """Atomically persists roadmap node progress keyed by Google OAuth user ID + roadmap ID."""
    from backend.database import execute_write
    try:
        user_id = int(current_user["sub"]) if current_user and "sub" in current_user and str(current_user["sub"]).isdigit() else 1
    except Exception:
        user_id = 1

    rows = await execute_query(
        "SELECT _id, completed_nodes_json FROM user_roadmap_progress WHERE user_id = ? AND roadmap_slug = ?",
        (user_id, payload.roadmap_slug)
    )

    if payload.completed_nodes is not None:
        completed = payload.completed_nodes
    else:
        existing = json.loads(rows[0]["completed_nodes_json"] or "[]") if rows else []
        if payload.node_id:
            if payload.node_id in existing:
                existing.remove(payload.node_id)
            else:
                existing.append(payload.node_id)
        completed = existing

    if rows:
        await execute_write(
            "UPDATE user_roadmap_progress SET completed_nodes_json = ?, last_node_id = ?, updated_at = CURRENT_TIMESTAMP WHERE _id = ?",
            (json.dumps(completed), payload.node_id or "", rows[0]["_id"])
        )
    else:
        await execute_write(
            "INSERT INTO user_roadmap_progress (user_id, roadmap_slug, completed_nodes_json, last_node_id) VALUES (?, ?, ?, ?)",
            (user_id, payload.roadmap_slug, json.dumps(completed), payload.node_id or "")
        )

    # Award 50 XP per node completion
    new_xp_earned = 50 if payload.node_id and payload.node_id in completed else 0
    if new_xp_earned > 0:
        await execute_write("UPDATE users SET xp = xp + ? WHERE _id = ?", (new_xp_earned, user_id))

    return {
        "status": "success",
        "user_id": user_id,
        "roadmap_slug": payload.roadmap_slug,
        "completed_nodes": completed,
        "xp_awarded": new_xp_earned
    }


@router.get("/app-status")
async def get_app_status():
    """Public endpoint returning current app version and maintenance status."""
    return {
        "latest_version": "1.0.0",
        "min_version": "1.0.0",
        "update_url": "",
        "maintenance": False,
    }
