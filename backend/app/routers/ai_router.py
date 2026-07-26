import json
import time
import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from backend.database import execute_query
from backend.auth import get_current_user, get_current_user_optional
from backend.ai_engine import ai_engine

logger = logging.getLogger("codempress.ai_router")
router = APIRouter(prefix="/api/ai", tags=["AI Mentor"])

class ChatRequest(BaseModel):
    topic_id: int
    message: str

SOCRATIC_SYSTEM_PROMPT = """
You are the Codempress Socratic AI Mentor. Your goal is to guide Computer Science students to understand concepts deeply.
- NEVER give direct solutions or complete code answers to homework/quiz questions.
- Ask guiding questions that help the student spot their own conceptual gap.
- Be encouraging, clear, concise, and structured.
"""

@router.post("/chat")
async def socratic_mentor_chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    topic_rows = await execute_query("SELECT title, subject_name FROM topics WHERE _id = ?", (request.topic_id,))
    topic_context = f"Topic: {topic_rows[0]['title']} ({topic_rows[0]['subject_name']})" if topic_rows else "General CS Topic"
    
    messages = [
        {"role": "system", "content": SOCRATIC_SYSTEM_PROMPT},
        {"role": "user", "content": f"Context: {topic_context}\nStudent Question: {request.message}"}
    ]

    try:
        completion = await ai_engine.generate_completion(messages, temperature=0.7)
        reply_text = completion["choices"][0]["message"]["content"]
        return {"reply": reply_text, "context": topic_context}
    except Exception as e:
        logger.error(f"Socratic AI Mentor error: {e}")
        return {
            "reply": "I'm having trouble connecting to AI services right now. Try breaking your question into smaller parts, or review the topic code example!",
            "context": topic_context
        }

@router.get("/status")
async def get_ai_status():
    """Health check endpoint showing active cooldown status of AI models."""
    return {
        "status": "online",
        "active_cooldowns": {k: int(v - time.time()) for k, v in ai_engine.cooldowns.items() if v > time.time()}
    }

class HintRequest(BaseModel):
    topic_id: int
    exercise_title: Optional[str] = "Interactive Exercise"
    code_snippet: Optional[str] = ""

@router.post("/hints")
async def get_progressive_hints(req: HintRequest):
    """Returns 4 progressive hints (Level 1 nudge to Level 4 complete solution) according to Content Production Guide v2.0."""
    from backend.app.domain.content_pipeline import generate_progressive_hints
    topic_rows = await execute_query("SELECT title FROM topics WHERE _id = ?", (req.topic_id,))
    title = topic_rows[0]['title'] if topic_rows else "Topic"
    hints = generate_progressive_hints(title, req.exercise_title, req.code_snippet)
    return {"topic_id": req.topic_id, "hints": hints}

class MisconceptionRequest(BaseModel):
    topic_id: int
    wrong_answer_index: int

@router.post("/misconception")
async def analyze_misconception(req: MisconceptionRequest):
    """Provides targeted misconception detection and grounding analogy for wrong quiz answers."""
    from backend.app.domain.content_pipeline import detect_misconceptions
    result = detect_misconceptions(req.topic_id, req.wrong_answer_index)
    return {"topic_id": req.topic_id, "analysis": result}

