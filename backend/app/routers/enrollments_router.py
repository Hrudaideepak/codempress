"""
Enrollments Router Module
--------------------------
Exposes endpoints for user-initiated manual course & roadmap enrollments:
- GET /api/enrollments/me: Returns list of enrolled roadmaps & subjects for current user.
- POST /api/enrollments/toggle: Enrolls or unenrolls user from a roadmap or subject.
"""

import sqlite3
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.auth import get_current_user_optional
from backend.database import DB_PATH

logger = logging.getLogger("codempress.enrollments_router")
router = APIRouter(prefix="/api/enrollments", tags=["User Enrollments"])


class EnrollmentToggleRequest(BaseModel):
    item_type: str  # 'roadmap' or 'subject'
    item_id: str   # e.g., 'ai-software-engineer' or 'Agentic AI'


@router.get("/me")
async def get_my_enrollments(current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Returns all enrolled roadmaps and subjects for the current user."""
    user_id = 1
    if current_user:
        user_id = current_user.get("_id") or current_user.get("id") or 1

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            "SELECT item_type, item_id, enrolled_at FROM user_enrollments WHERE user_id = ?",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()

        roadmaps = [r[1] for r in rows if r[0] == "roadmap"]
        subjects = [r[1] for r in rows if r[0] == "subject"]

        return {
            "enrolled_roadmaps": roadmaps,
            "enrolled_subjects": subjects,
            "total_enrolled": len(rows)
        }
    except Exception as err:
        logger.error(f"Error fetching enrollments: {err}")
        return {"enrolled_roadmaps": [], "enrolled_subjects": [], "total_enrolled": 0}


@router.post("/toggle")
async def toggle_enrollment(
    payload: EnrollmentToggleRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Toggles enrollment for a roadmap or subject (enrolls if not enrolled, unenrolls if enrolled)."""
    user_id = 1
    if current_user:
        user_id = current_user.get("_id") or current_user.get("id") or 1

    item_type = payload.item_type.lower()
    if item_type not in ("roadmap", "subject"):
        raise HTTPException(status_code=400, detail="item_type must be 'roadmap' or 'subject'")

    item_id = payload.item_id.strip()
    if not item_id:
        raise HTTPException(status_code=400, detail="item_id cannot be empty")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        "SELECT _id FROM user_enrollments WHERE user_id = ? AND item_type = ? AND item_id = ?",
        (user_id, item_type, item_id)
    )
    existing = cur.fetchone()

    is_enrolled = False
    if existing:
        cur.execute("DELETE FROM user_enrollments WHERE _id = ?", (existing[0],))
        is_enrolled = False
    else:
        cur.execute(
            "INSERT INTO user_enrollments (user_id, item_type, item_id) VALUES (?, ?, ?)",
            (user_id, item_type, item_id)
        )
        is_enrolled = True

    conn.commit()

    # Get updated counts
    cur.execute(
        "SELECT item_type, item_id FROM user_enrollments WHERE user_id = ?",
        (user_id,)
    )
    rows = cur.fetchall()
    conn.close()

    roadmaps = [r[1] for r in rows if r[0] == "roadmap"]
    subjects = [r[1] for r in rows if r[0] == "subject"]

    return {
        "is_enrolled": is_enrolled,
        "item_type": item_type,
        "item_id": item_id,
        "enrolled_roadmaps": roadmaps,
        "enrolled_subjects": subjects
    }
