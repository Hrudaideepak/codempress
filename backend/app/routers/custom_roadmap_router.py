"""
FastAPI Router for Custom Career Roadmaps and Resume Skill Analysis
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.app.domain.custom_roadmap_engine import custom_roadmap_engine

router = APIRouter(prefix="/api/custom-roadmap", tags=["custom-roadmap"])
logger = logging.getLogger(__name__)

# Request models
class TextRoadmapRequest(BaseModel):
    goal: str
    target_role: Optional[str] = "AI Agent Architect"
    available_time: Optional[str] = "20 hours/week"
    target_date: Optional[str] = "6 months"

class ResumeRoadmapRequest(BaseModel):
    resume_text: str
    certifications: Optional[List[str]] = []
    target_role: Optional[str] = "AI Agent Architect"

# In-memory storage cache for generated custom roadmaps
CUSTOM_ROADMAP_STORE = {}

@router.post("/text")
def generate_roadmap_from_text(req: TextRoadmapRequest):
    """Generate personalized roadmap from user's natural language goal."""
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal text cannot be empty.")
    
    roadmap = custom_roadmap_engine.generate_custom_roadmap(
        goal_text=req.goal,
        target_role=req.target_role or "AI Agent Architect"
    )
    CUSTOM_ROADMAP_STORE[roadmap["roadmap_id"]] = roadmap
    return roadmap

@router.post("/resume")
def generate_roadmap_from_resume(req: ResumeRoadmapRequest):
    """Analyze resume text & certifications to compute match score and custom roadmap."""
    if not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")

    roadmap = custom_roadmap_engine.generate_custom_roadmap(
        resume_text=req.resume_text,
        certifications=req.certifications or [],
        target_role=req.target_role or "AI Agent Architect"
    )
    CUSTOM_ROADMAP_STORE[roadmap["roadmap_id"]] = roadmap
    return roadmap

@router.get("/{roadmap_id}")
def get_custom_roadmap(roadmap_id: str):
    """Fetch a saved custom roadmap by ID."""
    roadmap = CUSTOM_ROADMAP_STORE.get(roadmap_id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="Custom roadmap not found.")
    return roadmap
