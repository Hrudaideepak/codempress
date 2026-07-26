"""
Codempress Curriculum SDK & Universal Schema Engine
---------------------------------------------------
Provides a declarative, schema-driven specification for building the world's
largest open AI Engineering & Computer Science Curriculum.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# -------------------------------------------------------------------------
# Universal Curriculum Schema Models
# -------------------------------------------------------------------------

class SkillRef(BaseModel):
    id: str
    name: str
    category: str # 'AI/ML', 'Frontend', 'Backend', 'DevOps', 'Systems', 'SoftSkills'
    level: str # 'Beginner', 'Intermediate', 'Advanced', 'Master'


class ProjectBrief(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str # 'Beginner', 'Intermediate', 'Advanced', 'Capstone'
    deliverables: List[str]
    tech_stack: List[str]


class MilestoneNode(BaseModel):
    id: str
    title: str
    description: str
    prerequisites: List[str] = []
    skills: List[str] = []
    estimated_hours: int = 10
    topics_count: int = 15
    project: Optional[ProjectBrief] = None


class CareerRoadmapSchema(BaseModel):
    id: int
    slug: str
    title: str
    category: str # 'ai_native', 'exclusive', 'legacy'
    icon: str
    rating: str
    tagline: str
    target_role: str
    estimated_weeks: str
    overview: str
    capstone_project: str
    skill_taxonomy: List[str] = []
    milestones: List[MilestoneNode] = []


# -------------------------------------------------------------------------
# Master Skill Taxonomy (Phase 3 Engine)
# -------------------------------------------------------------------------

MASTER_SKILL_TAXONOMY: Dict[str, List[str]] = {
    "AI_GenAI": [
        "OpenAI / Gemini SDKs",
        "Anthropic Claude API",
        "Model Context Protocol (MCP)",
        "Retrieval-Augmented Generation (RAG)",
        "Vector DBs (Qdrant, Pinecone, pgvector)",
        "LangGraph",
        "CrewAI",
        "AutoGen",
        "NeMo Guardrails",
        "vLLM & PagedAttention",
        "Ollama Local Models",
        "LoRA & QLoRA Quantization",
        "LLM-as-a-Judge Evaluation",
        "Ragas Benchmarking",
        "Prompt Architecture",
        "Context Compression",
        "Knowledge Graphs (Neo4j)"
    ],
    "Frontend_UI": [
        "React 19",
        "TypeScript",
        "Vite Engine",
        "TailwindCSS",
        "CSS Grid & Flexbox",
        "Three.js 3D Visualizer",
        "Vercel AI SDK",
        "Server-Sent Events (SSE)",
        "WCAG AA Accessibility",
        "Web Vitals Optimization"
    ],
    "Backend_Systems": [
        "Python 3.10+",
        "FastAPI",
        "Asyncio Concurrency",
        "Pydantic v2",
        "SQLite Thread-Local",
        "PostgreSQL",
        "Redis Caching",
        "REST APIs & OpenAPI",
        "JWT HS256 & OAuth2",
        "Distributed Locks"
    ],
    "DevOps_Cloud": [
        "Docker Containerization",
        "Kubernetes & Helm",
        "GitHub Actions CI/CD",
        "NVIDIA Container Toolkit",
        "Render Cloud Hosting",
        "Vercel Serverless",
        "Prometheus & Telemetry",
        "Air-Gapped AI Deployment"
    ],
    "Exclusive_Specializations": [
        "Vibe Coding",
        "Claude Code CLI",
        "Antigravity CLI Agent Suite",
        "n8n Workflow Automation",
        "LemonSqueezy / Stripe Billing",
        "Forward Deployed AI Engineering (FDE)",
        "Micro-SaaS Scaffolding",
        "Indie Hacker Distribution"
    ]
}


# -------------------------------------------------------------------------
# Global Knowledge Graph Stats Generator (Phase 2 & 4 Engine)
# -------------------------------------------------------------------------

def get_curriculum_sdk_overview() -> Dict[str, Any]:
    return {
        "version": "1.0.0-universal",
        "architecture_phase": "Phase 1 - 6 Unified Engine",
        "master_skills_count": sum(len(skills) for skills in MASTER_SKILL_TAXONOMY.values()),
        "categories_count": len(MASTER_SKILL_TAXONOMY),
        "skill_categories": list(MASTER_SKILL_TAXONOMY.keys()),
        "taxonomy": MASTER_SKILL_TAXONOMY
    }


class CurriculumSDK:
    def __init__(self):
        self.taxonomies = MASTER_SKILL_TAXONOMY


curriculum_sdk = CurriculumSDK()
