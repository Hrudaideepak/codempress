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
