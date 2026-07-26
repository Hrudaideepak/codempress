import json
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends

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

class ResumeUploadRequest(BaseModel):
    resume_text: str

class MentorChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class MentorRoadmapRequest(BaseModel):
    target_role: Optional[str] = "AI Software Engineer"

class ToggleStepRequest(BaseModel):
    step_id: int

@router.post("/resume")
async def analyze_and_save_resume(
    payload: ResumeUploadRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyzes resume text using GitHub Models AI engine, extracts skills & proficiency, and saves profile."""
    user_id = int(current_user["sub"])
    text = payload.resume_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")

    prompt = f"""You are an expert Resume Analyzer and Data Scientist for Career Growth.
Analyze the following resume text carefully:

=== RESUME ===
{text[:4000]}

Extract details and return ONLY a valid JSON object with exact keys:
{{
  "skills": ["Python", "React", "FastAPI", "Docker", "SQL"],
  "experience_level": "Junior" or "Mid" or "Senior",
  "education": "Brief 1-sentence summary of degree/background",
  "proficiency": {{
    "Skill": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
    "Score": [85, 75, 70, 65, 60]
  }}
}}
Return raw JSON only without markdown codeblocks."""

    raw_ai = await call_ai(prompt)
    skills = ["Software Engineering", "Problem Solving", "Git", "Python"]
    exp_level = "Mid"
    education = "Computer Science / Software Engineering Background"
    prof_data = {
        "Skill": ["Software Engineering", "Python", "Web Development", "Git", "System Design"],
        "Score": [85, 80, 75, 70, 65]
    }

    try:
        cleaned = raw_ai.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        if "skills" in parsed:
            skills = parsed["skills"]
        if "experience_level" in parsed:
            exp_level = parsed["experience_level"]
        if "education" in parsed:
            education = parsed["education"]
        if "proficiency" in parsed and isinstance(parsed["proficiency"], dict):
            prof_data = parsed["proficiency"]
    except Exception as e:
        logger.warning(f"Failed to parse resume AI JSON output: {e}")

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

@router.get("/resume")
async def get_user_resume(current_user: dict = Depends(get_current_user)):
    """Retrieves current user's latest parsed resume profile."""
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
    """Returns top 5 skill proficiency breakdown & radar chart data."""
    user_id = int(current_user["sub"])
    rows = await execute_query(
        "SELECT proficiency_json, skills_json, experience_level FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    if not rows:
        # Default starter baseline metrics
        return {
            "has_data": False,
            "skills": ["Problem Solving", "Data Structures", "System Design", "Python", "Git"],
            "scores": [75, 70, 65, 80, 85],
            "experience_level": "Apprentice"
        }

    r = rows[0]
    prof = json.loads(r["proficiency_json"]) if r["proficiency_json"] else {}
    return {
        "has_data": True,
        "skills": prof.get("Skill", ["Python", "JavaScript", "SQL", "Git", "Algorithms"]),
        "scores": prof.get("Score", [80, 75, 70, 85, 65]),
        "experience_level": r["experience_level"] or "Mid"
    }

@router.post("/chat")
async def mentor_chat(
    payload: MentorChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Sends message to Socratic AI Career Mentor with resume context & chat history."""
    user_id = int(current_user["sub"])
    msg = payload.message.strip()
    session_id = payload.session_id or "default"
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Save user message
    await execute_write(
        "INSERT INTO mentor_chat_messages (user_id, session_id, sender, message) VALUES (?, ?, 'user', ?)",
        (user_id, session_id, msg)
    )

    # Fetch resume context
    resume_rows = await execute_query(
        "SELECT resume_text, skills_json, experience_level, education FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    resume_ctx = "No resume uploaded yet."
    if resume_rows:
        r = resume_rows[0]
        resume_ctx = f"Resume Summary:\n- Level: {r['experience_level']}\n- Skills: {r['skills_json']}\n- Education: {r['education']}\n\nExcerpts:\n{r['resume_text'][:1500]}"

    # Fetch recent session history (last 6 messages)
    history_rows = await execute_query(
        "SELECT sender, message FROM mentor_chat_messages WHERE user_id = ? AND session_id = ? ORDER BY _id DESC LIMIT 6",
        (user_id, session_id)
    )
    history_rows.reverse()
    history_ctx = "\n".join([f"{h['sender'].upper()}: {h['message']}" for h in history_rows[:-1]])

    prompt = f"""You are a Personal AI Career Mentor & Senior Engineering Director.
You give actionable, empathetic, and highly targeted career advice.

=== USER BACKGROUND CONTEXT ===
{resume_ctx}

=== CONVERSATION HISTORY ===
{history_ctx or 'Start of conversation.'}

=== USER'S CURRENT QUESTION ===
{msg}

INSTRUCTIONS:
- Answer directly and reference their background/skills when relevant.
- Be concise (2-3 short paragraphs maximum).
- Suggest 1 clear next action step or resource."""

    reply = await call_ai(prompt)

    # Save mentor reply
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
    """Generates personalized 5-step career roadmap from user's resume & target role."""
    user_id = int(current_user["sub"])
    target_role = payload.target_role or "AI Software Engineer"

    # Fetch resume text
    resume_rows = await execute_query(
        "SELECT resume_text, skills_json FROM user_resumes WHERE user_id = ? ORDER BY _id DESC LIMIT 1",
        (user_id,)
    )
    resume_text = resume_rows[0]["resume_text"] if resume_rows else f"Target Role: {target_role}. Skills: Computer Science & Software Engineering."

    prompt = f"""You are an expert Career Coach. Based on the user's background below, generate a personalized career roadmap to become a successful {target_role}.

=== RESUME / BACKGROUND ===
{resume_text[:3000]}

Create exactly 5 actionable steps. For EACH step, provide:
- id (integer, 1 to 5)
- step (string, title of step)
- description (string, 2 sentence summary of what to do)
- difficulty ("Beginner", "Intermediate", or "Advanced")
- estimated_time (string, e.g. "2-3 weeks")
- completed (boolean, always false)
- resources (list of exactly 3 learning resources):
    - title (string, resource title)
    - url (string, real URL from coursera.org, udemy.com, freecodecamp.org, developer.mozilla.org, docs.python.org, github.com, etc.)
    - type ("course", "article", "video", "documentation")

Return ONLY a raw JSON array of 5 step objects. Do not include markdown codeblocks."""

    raw_ai = await call_ai(prompt)
    steps = [
        {
          "id": 1,
          "step": f"1. {target_role} Core Foundations",
          "description": "Master core syntax, architecture patterns, and fundamental tooling.",
          "difficulty": "Beginner",
          "estimated_time": "2 weeks",
          "completed": False,
          "resources": [
            {"title": "FreeCodeCamp Developer Certification", "url": "https://www.freecodecamp.org", "type": "course"},
            {"title": "MDN Web & API Documentation", "url": "https://developer.mozilla.org", "type": "documentation"},
            {"title": "Official Python Documentation", "url": "https://docs.python.org/3/", "type": "documentation"}
          ]
        },
        {
          "id": 2,
          "step": "2. Production System Architecture",
          "description": "Learn REST APIs, async database connections, and microservices decoupling.",
          "difficulty": "Intermediate",
          "estimated_time": "3 weeks",
          "completed": False,
          "resources": [
            {"title": "FastAPI Web Framework Tutorial", "url": "https://fastapi.tiangolo.com", "type": "documentation"},
            {"title": "System Design Primer Repository", "url": "https://github.com/donnemartin/system-design-primer", "type": "article"},
            {"title": "PostgreSQL Architecture Guide", "url": "https://www.postgresql.org/docs/", "type": "documentation"}
          ]
        },
        {
          "id": 3,
          "step": "3. AI Integration & Vector Search",
          "description": "Implement RAG pipelines, vector embeddings, and LLM model orchestration.",
          "difficulty": "Intermediate",
          "estimated_time": "3 weeks",
          "completed": False,
          "resources": [
            {"title": "OpenAI API Integration Docs", "url": "https://platform.openai.com/docs", "type": "documentation"},
            {"title": "Pinecone Vector DB Quickstart", "url": "https://docs.pinecone.io", "type": "documentation"},
            {"title": "LangChain Python Tutorial", "url": "https://python.langchain.com", "type": "course"}
          ]
        },
        {
          "id": 4,
          "step": "4. Docker Containerization & CI/CD Pipelines",
          "description": "Automate deployment with Docker containers and GitHub Actions workflows.",
          "difficulty": "Advanced",
          "estimated_time": "2 weeks",
          "completed": False,
          "resources": [
            {"title": "Docker Official Docs", "url": "https://docs.docker.com", "type": "documentation"},
            {"title": "GitHub Actions Automation Guide", "url": "https://docs.github.com/en/actions", "type": "article"},
            {"title": "Vercel Deployment Architecture", "url": "https://vercel.com/docs", "type": "documentation"}
          ]
        },
        {
          "id": 5,
          "step": "5. Full-Stack Capstone Project",
          "description": "Build & deploy an end-to-end production AI SaaS platform with live telemetry.",
          "difficulty": "Advanced",
          "estimated_time": "4 weeks",
          "completed": False,
          "resources": [
            {"title": "Build a Full-Stack AI App (YouTube)", "url": "https://www.youtube.com", "type": "video"},
            {"title": "Clean Architecture Guide", "url": "https://blog.cleancoder.com", "type": "article"},
            {"title": "GitHub Portfolio Showcase", "url": "https://github.com", "type": "tool"}
          ]
        }
    ]

    try:
        cleaned = raw_ai.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and len(parsed) > 0:
            steps = parsed
    except Exception as e:
        logger.warning(f"Failed to parse roadmap AI JSON: {e}")

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
