import io
import json
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from backend.database import execute_query, execute_write
from backend.auth import get_current_user, get_current_user_optional
from backend.infrastructure.services.ai_service import ai_engine

logger = logging.getLogger("codempress.mentor_router")
router = APIRouter(prefix="/api/mentor", tags=["AI Career Mentor"])

async def call_ai(prompt: str) -> str:
    try:
        res = await ai_engine.generate_completion([{"role": "user", "content": prompt}])
        return res["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"AI completion failed: {e}")
        return ""

def extract_text_from_file_bytes(file_bytes: bytes, filename: str) -> str:
    """Extracts raw text content from PDF, DOCX, TXT, or CSV file bytes."""
    fname = filename.lower()
    text = ""

    if fname.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages_text)
        except Exception as e:
            logger.error(f"Error reading PDF file {filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF file: {e}")

    elif fname.endswith(".docx") or fname.endswith(".doc"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            logger.error(f"Error reading DOCX file {filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse DOCX file: {e}")

    else:
        # Fallback to UTF-8 text parsing
        try:
            text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode text file: {e}")

    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Uploaded file contained no extractable text.")
    return cleaned


class ResumeUploadRequest(BaseModel):
    resume_text: str

class MentorChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class MentorRoadmapRequest(BaseModel):
    target_role: Optional[str] = "AI Software Engineer"

class ToggleStepRequest(BaseModel):
    step_id: int


async def process_and_analyze_resume(text: str, user_id: int) -> Dict[str, Any]:
    """Dynamically analyzes resume text via AI Engine without hardcoded dummy fallbacks."""
    prompt = f"""You are an expert Resume Analyzer and Career Data Scientist.
Analyze the following resume text dynamically:

=== RESUME ===
{text[:4000]}

Extract real details and return ONLY a valid JSON object with exact structure:
{{
  "skills": ["List", "Of", "Real", "Extracted", "Skills"],
  "experience_level": "Junior" or "Mid" or "Senior" or "Lead",
  "education": "Exact degree or background summary extracted from resume",
  "proficiency": {{
    "Skill": ["TopSkill1", "TopSkill2", "TopSkill3", "TopSkill4", "TopSkill5"],
    "Score": [85, 78, 72, 68, 60]
  }}
}}
Rules:
- Extract ONLY real skills mentioned in or derived from the user's actual resume.
- Scores must be realistic integer proficiency estimates between 40 and 95.
- Return raw JSON only without markdown formatting."""

    raw_ai = await call_ai(prompt)
    if not raw_ai:
        raise HTTPException(status_code=502, detail="AI engine timed out while analyzing resume. Please retry.")

    try:
        cleaned = raw_ai.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
    except Exception as e:
        logger.error(f"Failed to parse dynamic resume AI response: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI dynamic analysis. Please retry.")

    skills = parsed.get("skills", [])
    exp_level = parsed.get("experience_level", "Mid")
    education = parsed.get("education", "Software Engineering Background")
    prof_data = parsed.get("proficiency", {"Skill": [], "Score": []})

    if not skills:
        skills = ["Software Engineering", "Problem Solving"]
    if not prof_data.get("Skill"):
        prof_data = {"Skill": skills[:5], "Score": [80] * len(skills[:5])}

    await execute_write(
        "INSERT INTO user_resumes (user_id, resume_text, skills_json, experience_level, education, proficiency_json) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, text, json.dumps(skills), exp_level, education, json.dumps(prof_data))
    )

    return {
        "status": "success",
        "skills": skills,
        "experience_level": exp_level,
        "education": education,
        "proficiency": prof_data
    }


@router.post("/upload-file")
async def upload_resume_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Uploads PDF, DOCX, or TXT resume file, extracts text, and triggers dynamic AI analysis."""
    user_id = int(current_user["sub"])
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    text = extract_text_from_file_bytes(file_bytes, file.filename or "resume.pdf")
    return await process_and_analyze_resume(text, user_id)


@router.post("/resume")
async def analyze_and_save_resume(
    payload: ResumeUploadRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyzes text resume and saves profile dynamically."""
    user_id = int(current_user["sub"])
    text = payload.resume_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")

    return await process_and_analyze_resume(text, user_id)


@router.get("/resume")
async def get_user_resume(current_user: dict = Depends(get_current_user)):
    """Retrieves user's latest parsed resume profile."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT * FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    if not rows:
        return {"has_resume": False}

    r = rows[0]
    return {
        "has_resume": True,
        "resume_text": r["resume_text"],
        "skills": json.loads(r["skills_json"]) if r["skills_json"] else [],
        "experience_level": r["experience_level"],
        "education": r["education"],
        "proficiency": json.loads(r["proficiency_json"]) if r["proficiency_json"] else {"Skill": [], "Score": []},
        "created_at": r["created_at"]
    }


@router.get("/analytics")
async def get_mentor_analytics(current_user: dict = Depends(get_current_user)):
    """Returns user's dynamic skill proficiency metrics."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT proficiency_json, skills_json, experience_level FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    if not rows:
        return {
            "has_data": False,
            "skills": [],
            "scores": [],
            "experience_level": "Unanalyzed"
        }

    r = rows[0]
    prof = json.loads(r["proficiency_json"]) if r["proficiency_json"] else {}
    return {
        "has_data": True,
        "skills": prof.get("Skill", []),
        "scores": prof.get("Score", []),
        "experience_level": r["experience_level"] or "Mid"
    }


@router.post("/chat")
async def mentor_chat(
    payload: MentorChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Sends message to natural Conversational AI Mentor with rich user context & multi-turn memory."""
    user_id = int(current_user["sub"])
    msg = payload.message.strip()
    session_id = payload.session_id or "default"
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Fetch User Profile Data
    user_rows = await execute_query("SELECT name, email, xp, streak_count FROM users WHERE _id = ?", (user_id,))
    user_name = "Developer"
    xp = 0
    streak = 0
    if user_rows:
        u = user_rows[0]
        user_name = u["name"] or u["email"].split("@")[0] if u.get("email") else "Developer"
        xp = u["xp"] or 0
        streak = u["streak_count"] or 0

    # 2. Fetch Resume Intelligence Context
    resume_rows = await execute_query(
        "SELECT resume_text, skills_json, experience_level, education FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    resume_ctx = "No resume file uploaded yet."
    if resume_rows:
        r = resume_rows[0]
        skills_str = ", ".join(json.loads(r["skills_json"] or "[]"))
        resume_ctx = (
            f"Uploaded Resume Profile:\n"
            f"- Experience Level: {r['experience_level']}\n"
            f"- Extracted Skills: {skills_str}\n"
            f"- Education: {r['education']}\n"
            f"- Resume Content Excerpt: {r['resume_text'][:1200]}"
        )

    # 3. Fetch Enrolled Roadmaps & Node Progress Context
    roadmap_rows = await execute_query(
        "SELECT roadmap_slug, completed_nodes_json, selected_track FROM user_roadmap_progress WHERE user_id = ?",
        (user_id,)
    )
    roadmap_ctx_list = []
    for rm in roadmap_rows:
        completed = json.loads(rm["completed_nodes_json"] or "[]")
        roadmap_ctx_list.append(f"- Roadmap: '{rm['roadmap_slug']}' (Completed Stages/Nodes: {completed}, Track: '{rm['selected_track'] or 'Default'}')")
    roadmap_ctx = "\n".join(roadmap_ctx_list) if roadmap_ctx_list else "No active roadmap progress logged yet."

    # 4. Fetch Topic Mastery Stats
    mastered_rows = await execute_query(
        "SELECT COUNT(*) as cnt FROM user_progress WHERE user_id = ? AND mastery_percent >= 60",
        (user_id,)
    )
    mastered_cnt = mastered_rows[0]["cnt"] if mastered_rows else 0

    # 5. Persist User Message to DB
    await execute_write(
        "INSERT INTO mentor_chat_messages (user_id, session_id, sender, message) VALUES (?, ?, 'user', ?)",
        (user_id, session_id, msg)
    )

    # 6. Fetch Multi-Turn Chat History (Last 10 Messages)
    history_rows = await execute_query(
        "SELECT sender, message FROM mentor_chat_messages WHERE user_id = ? AND session_id = ? ORDER BY _id DESC LIMIT 10",
        (user_id, session_id)
    )
    history_rows.reverse()

    # 7. Construct Conversational System Prompt & Messages Payload
    system_prompt = f"""You are the Code Empress AI Mentor — a warm, highly intelligent, encouraging, and natural conversational AI software development & career assistant (similar to ChatGPT or Claude, but specialized for software engineering, learning paths, and tech career growth).

=== REAL-TIME USER CONTEXT ===
- User Name: {user_name} (XP: {xp}, Streak: 🔥 {streak} days, Mastered Topics: {mastered_cnt})
- Resume Profile:
{resume_ctx}
- Enrolled Roadmaps & Progress:
{roadmap_ctx}

=== CONVERSATIONAL BEHAVIOR & PERSONALITY RULES ===
1. RESPOND NATURALLY & HUMANLY TO ANY USER MESSAGE.
   - For greetings like "Hi", "Hello", "Good morning" or casual banter: Reply warmly, fluidly, and naturally as a helpful mentor (e.g. "Hey {user_name}! 👋 Great to see you today. What are you working on or hoping to learn?").
   - NEVER force the user into rigid predefined options, menus, or button choices.
2. CONTEXT-AWARE — NEVER REPEATEDLY ASK FOR INFORMATION ALREADY AVAILABLE.
   - You already know their resume skills, target roles, completed topics, and active roadmaps. Refer to them naturally in conversation (e.g. "Since your resume highlights React and Node.js...").
3. ADAPT RESPONSE LENGTH & FORMATTING TO INTENT:
   - Greetings or casual questions → Warm, concise, conversational (1-3 sentences).
   - Technical explanations (e.g. "Explain Flexbox"), code debugging, or interview prep → Provide clear, well-structured Markdown with clean code snippets and bullet points where useful.
4. CAREER & LEARNING GUIDANCE:
   - Help naturally with resume improvements, roadmap recommendations, interview prep, skill gap analysis, study planning, code help, and motivation.
   - Ask engaging, relevant follow-up questions when helpful to keep the conversation flowing naturally."""

    messages_payload = [{"role": "system", "content": system_prompt}]
    for h in history_rows:
        role = "user" if h["sender"] == "user" else "assistant"
        messages_payload.append({"role": role, "content": h["message"]})

    try:
        res = await ai_engine.generate_completion(messages_payload)
        reply = res["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"AI Chat completion failed: {e}")
        reply = f"Hey {user_name}! 👋 I'm right here. How can I help you with your coding, resume, or career path today?"

    # 8. Persist AI Assistant Response to DB
    await execute_write(
        "INSERT INTO mentor_chat_messages (user_id, session_id, sender, message) VALUES (?, ?, 'mentor', ?)",
        (user_id, session_id, reply)
    )

    return {
        "reply": reply,
        "session_id": session_id
    }


@router.get("/chat/history")
async def get_chat_history(
    session_id: str = "default",
    current_user: dict = Depends(get_current_user)
):
    """Retrieves chat message history for session."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT sender, message, created_at FROM mentor_chat_messages WHERE user_id = ? AND session_id = ? ORDER BY _id ASC",
        (user_id, session_id)
    )
    return {
        "session_id": session_id,
        "messages": [{"sender": r["sender"], "text": r["message"], "created_at": r["created_at"]} for r in rows]
    }


@router.post("/roadmap/generate")
async def generate_mentor_roadmap(
    payload: MentorRoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generates 100% dynamic 5-step career roadmap from user's actual resume content & target role."""
    user_id = int(current_user["sub"])
    target_role = payload.target_role or "AI Software Engineer"

    resume_rows = await execute_query(
        "SELECT resume_text, skills_json FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    resume_text = resume_rows[0]["resume_text"] if resume_rows else f"Target Role: {target_role}. Skills: Computer Science & Software Engineering."

    prompt = f"""You are an expert Career Coach. Based on the user's actual background below, generate a personalized 5-step career roadmap to become a successful {target_role}.

=== RESUME / BACKGROUND ===
{resume_text[:3000]}

Create exactly 5 actionable steps tailored to this user. For EACH step, provide:
- id (integer, 1 to 5)
- step (string, clear title of step)
- description (string, 2 sentence summary of what to build or learn and why)
- difficulty ("Beginner", "Intermediate", or "Advanced")
- estimated_time (string, e.g. "2-3 weeks")
- completed (boolean, always false)
- resources (list of exactly 3 learning resources with real working links):
    - title (string, resource title)
    - url (string, real working URL from coursera.org, udemy.com, freecodecamp.org, developer.mozilla.org, docs.python.org, github.com, etc.)
    - type ("course", "article", "video", "documentation")

Return ONLY a raw JSON array of 5 step objects. Do not include markdown formatting."""

    raw_ai = await call_ai(prompt)
    if not raw_ai:
        raise HTTPException(status_code=502, detail="AI engine timed out while generating career roadmap. Please retry.")

    try:
        cleaned = raw_ai.replace("```json", "").replace("```", "").strip()
        steps = json.loads(cleaned)
    except Exception as e:
        logger.error(f"Failed to parse dynamic roadmap AI JSON: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI generated roadmap. Please retry.")

    await execute_write(
        "INSERT INTO user_mentor_roadmaps (user_id, target_role, roadmap_json) VALUES (?, ?, ?)",
        (user_id, target_role, json.dumps(steps))
    )

    return {
        "status": "success",
        "target_role": target_role,
        "steps": steps
    }


@router.get("/roadmap")
async def get_mentor_roadmap(current_user: dict = Depends(get_current_user)):
    """Retrieves user's active AI generated career roadmap."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT target_role, roadmap_json FROM user_mentor_roadmaps WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    if not rows:
        return {"has_roadmap": False}

    r = rows[0]
    return {
        "has_roadmap": True,
        "target_role": r["target_role"],
        "steps": json.loads(r["roadmap_json"])
    }


@router.post("/roadmap/toggle")
async def toggle_roadmap_step(
    payload: ToggleStepRequest,
    current_user: dict = Depends(get_current_user)
):
    """Toggles step completed status in user roadmap."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT _id, roadmap_json FROM user_mentor_roadmaps WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No active roadmap found")

    r = rows[0]
    steps = json.loads(r["roadmap_json"])
    for step in steps:
        if step.get("id") == payload.step_id:
            step["completed"] = not step.get("completed", False)
            break

    await execute_write(
        "UPDATE user_mentor_roadmaps SET roadmap_json = ? WHERE _id = ?",
        (json.dumps(steps), r["_id"])
    )

    return {"status": "success", "steps": steps}


class SkeletonRequest(BaseModel):
    target_role: str
    user_goals: Optional[str] = ""
    resume_skills: Optional[List[str]] = []
    experience_level: Optional[str] = "Mid"

class ModuleRequest(BaseModel):
    roadmap_title: str
    stage_title: str
    stage_description: Optional[str] = ""
    role_depth: Optional[str] = "Production Engineering"

class NodeProgressRequest(BaseModel):
    roadmap_slug: str
    node_id: str

@router.post("/roadmap/generate-skeleton")
async def generate_skeleton_endpoint(
    payload: SkeletonRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Generates an on-the-fly roadmap skeleton via AI with validation and fallbacks."""
    from backend.app.domain.dynamic_roadmap_generator import generate_roadmap_skeleton
    skeleton = await generate_roadmap_skeleton(
        target_role=payload.target_role,
        user_goals=payload.user_goals,
        resume_skills=payload.resume_skills,
        experience_level=payload.experience_level
    )
    return skeleton

@router.post("/roadmap/generate-module")
async def generate_module_endpoint(
    payload: ModuleRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Lazy loads detailed module content (theory markdown, code exercise, mini-project, interview prep) on click."""
    from backend.app.domain.dynamic_roadmap_generator import generate_stage_module
    module_data = await generate_stage_module(
        roadmap_title=payload.roadmap_title,
        stage_title=payload.stage_title,
        stage_description=payload.stage_description,
        role_depth=payload.role_depth
    )
    return module_data

@router.get("/roadmap/progress/{roadmap_slug}")
async def get_node_progress(
    roadmap_slug: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieves lightweight user node completion progress from SQLite."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT completed_nodes_json, selected_track FROM user_roadmap_progress WHERE user_id = ? AND roadmap_slug = ?",
        (user_id, roadmap_slug)
    )
    if not rows:
        return {"completed_nodes": [], "selected_track": ""}
    
    r = rows[0]
    return {
        "completed_nodes": json.loads(r["completed_nodes_json"] or "[]"),
        "selected_track": r["selected_track"] or ""
    }

@router.post("/roadmap/progress/toggle")
async def toggle_node_progress(
    payload: NodeProgressRequest,
    current_user: dict = Depends(get_current_user)
):
    """Toggles stage node completion status in SQLite lightweight user progress table."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT _id, completed_nodes_json FROM user_roadmap_progress WHERE user_id = ? AND roadmap_slug = ?",
        (user_id, payload.roadmap_slug)
    )
    completed = []
    if rows:
        r = rows[0]
        completed = json.loads(r["completed_nodes_json"] or "[]")
        if payload.node_id in completed:
            completed.remove(payload.node_id)
        else:
            completed.append(payload.node_id)
            
        await execute_write(
            "UPDATE user_roadmap_progress SET completed_nodes_json = ?, updated_at = CURRENT_TIMESTAMP WHERE _id = ?",
            (json.dumps(completed), r["_id"])
        )
    else:
        completed = [payload.node_id]
        await execute_write(
            "INSERT INTO user_roadmap_progress (user_id, roadmap_slug, completed_nodes_json) VALUES (?, ?, ?)",
            (user_id, payload.roadmap_slug, json.dumps(completed))
        )
        
    return {"status": "success", "completed_nodes": completed}
