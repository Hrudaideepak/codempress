import time
import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from backend.database import execute_query, execute_write
from backend.auth import get_current_user

from backend.app.routers.generation_router import ensure_correct_language_code_example

logger = logging.getLogger("codempress.curriculum_router")
router = APIRouter(prefix="/api", tags=["Curriculum"])

# Static curriculum in-memory caches
_static_subjects = None
_static_curriculum = None

async def get_static_subjects():
    """Returns static subjects summary, preloaded once from DB."""
    global _static_subjects
    if _static_subjects is None:
        subjects_rows = await execute_query(
            "SELECT subject_name, COUNT(_id) as total_topics FROM topics GROUP BY subject_name ORDER BY subject_name"
        )
        _static_subjects = subjects_rows
    return _static_subjects

async def get_static_curriculum():
    """Returns full static curriculum skeleton (topics grouped by subject), preloaded once from DB."""
    global _static_curriculum
    if _static_curriculum is None:
        all_topics = await execute_query(
            "SELECT _id, subject_name, title, level FROM topics ORDER BY subject_name, _id"
        )
        curriculum = {}
        for t in all_topics:
            sub = t["subject_name"]
            if sub not in curriculum:
                curriculum[sub] = []
            curriculum[sub].append({
                "id": t["_id"],
                "title": t["title"],
                "level_name": t["level"]
            })
        _static_curriculum = curriculum
    return _static_curriculum

@router.get("/subjects")
async def get_subjects(current_user: dict = Depends(get_current_user)):
    """Returns list of subjects with total topics & user progress metrics (read from memory cache)."""
    user_id = int(current_user["sub"])
    subjects_rows = await get_static_subjects()
    
    user_progress_rows = await execute_query(
        "SELECT t.subject_name, COUNT(p._id) as mastered_count FROM user_progress p "
        "JOIN topics t ON p.topic_id = t._id WHERE p.user_id = ? AND p.mastery_percent >= 60 GROUP BY t.subject_name",
        (user_id,)
    )
    
    progress_map = {r["subject_name"]: r["mastered_count"] for r in user_progress_rows}

    results = []
    for s in subjects_rows:
        sub_name = s["subject_name"]
        total = s["total_topics"]
        mastered = progress_map.get(sub_name, 0)
        percent = int((mastered / total) * 100) if total > 0 else 0
        
        results.append({
            "name": sub_name,
            "total_topics": total,
            "mastered_topics": mastered,
            "mastery_percent": percent
        })

    return {"subjects": results}

@router.get("/topics/{topic_id}")
async def get_topic_detail(topic_id: int, current_user: dict = Depends(get_current_user)):
    """Returns topic details, cached theory, questions, and user mastery status."""
    user_id = int(current_user["sub"])
    
    topic_rows = await execute_query("SELECT * FROM topics WHERE _id = ?", (topic_id,))
    if not topic_rows:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic = topic_rows[0]
    questions_rows = await execute_query("SELECT _id, question_text, code_snippet, options_json FROM questions WHERE topic_id = ?", (topic_id,))
    
    progress_rows = await execute_query("SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ?", (user_id, topic_id))
    mastery_percent = progress_rows[0]["mastery_percent"] if progress_rows else 0

    theory_json_str = topic["theory_json"]
    if theory_json_str:
        try:
            parsed = json.loads(theory_json_str) if isinstance(theory_json_str, str) else theory_json_str
            if isinstance(parsed, dict) and "code_example" in parsed:
                parsed["code_example"] = ensure_correct_language_code_example(parsed["code_example"], topic["title"], topic["subject_name"])
                theory_json_str = json.dumps(parsed)
        except Exception as e:
            logger.warning(f"Error validating code example language for topic {topic_id}: {e}")

    return {
        "_id": topic["_id"],
        "subject_name": topic["subject_name"],
        "title": topic["title"],
        "level": topic["level"],
        "theory_json": theory_json_str,
        "mastery_percent": mastery_percent,
        "questions": [
            {
                "_id": q["_id"],
                "question_text": q["question_text"],
                "code_snippet": q["code_snippet"],
                "options": json.loads(q["options_json"])
            }
            for q in questions_rows
        ]
    }

@router.get("/library")
async def get_library(current_user: dict = Depends(get_current_user)):
    """Returns all subjects and their topics with progress metrics, optimized using memory skeletons."""
    user_id = int(current_user["sub"])
    
    # 1. Fetch static skeleton from cache
    subjects_map = await get_static_curriculum()
    
    # 2. Fetch only the user's progress records (O(K) rows, where K is user's studied topics)
    progress_rows = await execute_query(
        "SELECT topic_id, mastery_percent FROM user_progress WHERE user_id = ?",
        (user_id,)
    )
    
    # Map progress details for quick O(1) in-memory lookups
    progress_map = {p["topic_id"]: p["mastery_percent"] for p in progress_rows}
    
    # 3. Assemble dynamic progress state with static memory caching
    categories = []
    for sub_name, sub_topics in subjects_map.items():
        topics_list = []
        is_prev_cleared = True  # The first topic in a subject is unlocked
        
        for idx, t in enumerate(sub_topics):
            t_id = t["id"]
            mastery = progress_map.get(t_id, 0)
            cleared = mastery >= 60
            
            # Unlock gating logic
            locked = not is_prev_cleared
            
            # Mappings for difficulty (Beginner: 2, Intermediate: 3, Pro: 5) and XP (100, 200, 300)
            level = t["level_name"]
            if level == "Beginner":
                difficulty = 2
                xp = 100
            elif level == "Intermediate":
                difficulty = 3
                xp = 200
            else:
                difficulty = 5
                xp = 300
                
            topics_list.append({
                "id": t_id,
                "title": t["title"],
                "description": t["description"],
                "level_name": level,
                "locked": locked,
                "cleared": cleared,
                "difficulty": difficulty,
                "xp": xp,
                "mastery": mastery,
                "sequence": idx
            })
            
            # The next topic is unlocked if this one is cleared
            is_prev_cleared = cleared
            
        categories.append({
            "name": sub_name,
            "topic_count": len(sub_topics),
            "topics": topics_list
        })
        
    return {"categories": categories}

@router.post("/topics/{topic_id}/theory-read")
async def mark_theory_read(topic_id: int, current_user: dict = Depends(get_current_user)):
    """Marks a topic's theory as read and recalculates mastery."""
    user_id = int(current_user["sub"])
    
    # Verify topic exists
    topic_rows = await execute_query("SELECT _id FROM topics WHERE _id = ?", (topic_id,))
    if not topic_rows:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    # Check if user has an existing progress record
    prog_rows = await execute_query(
        "SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ?", 
        (user_id, topic_id)
    )
    
    if prog_rows:
        await execute_write(
            "UPDATE user_progress SET theory_read = 1, last_studied = CURRENT_TIMESTAMP WHERE user_id = ? AND topic_id = ?",
            (user_id, topic_id)
        )
    else:
        await execute_write(
            "INSERT INTO user_progress (user_id, topic_id, theory_read) VALUES (?, ?, 1)",
            (user_id, topic_id)
        )
        
    # Recalculate topic mastery
    from backend.quiz_router import recalculate_topic_mastery
    mastery_percent = await recalculate_topic_mastery(user_id, topic_id)
    
    return {
        "status": "success",
        "topic_id": topic_id,
        "theory_read": True,
        "mastery": mastery_percent
    }
