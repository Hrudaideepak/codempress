"""
Codempress Phase 2: Global Knowledge Graph & Master Engineering Ontology Engine
-------------------------------------------------------------------------------
Establishes a 10-level hierarchical ontology powering personalized learning paths,
prerequisite dependency graphs, skill-gap analysis, and AI mentor recommendations.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# -------------------------------------------------------------------------
# 10-Level Curriculum Ontology Hierarchy
# -------------------------------------------------------------------------

ONTOLOGY_HIERARCHY_LEVELS = [
    "Domain",         # Level 1: Core discipline (e.g., Artificial Intelligence, Backend Systems)
    "Category",       # Level 2: Subject domain (e.g., Agentic Systems, Distributed Databases)
    "Module",         # Level 3: Learning unit (e.g., Model Context Protocol, Graph-RAG)
    "Submodule",      # Level 4: Specific capability (e.g., Tool Registration, Vector Indexing)
    "Topic",          # Level 5: Core theory unit (e.g., MCP Client Protocol, Cosine Similarity)
    "Subtopic",       # Level 6: Technical depth (e.g., JSON-RPC Transport, HNSW Graphs)
    "Lesson",         # Level 7: Guided learning prose & code examples
    "Concept",        # Level 8: Discrete engineering principle (e.g., Idempotency, Vector Norm)
    "Exercise",       # Level 9: Interactive code challenge / sandbox prompt
    "Assessment"      # Level 10: MCQ quiz evaluation & mastery calculation
]


# -------------------------------------------------------------------------
# Master Knowledge Graph Core Domains (Phase 2)
# -------------------------------------------------------------------------

CORE_KNOWLEDGE_DOMAINS: List[Dict[str, Any]] = [
    {
        "id": "dom_ai",
        "name": "Artificial Intelligence & Autonomous Systems",
        "categories_count": 8,
        "description": "GenAI, LLMOps, RAG, Agentic AI, Model Context Protocol, Context Engineering, AI Security.",
        "categories": [
            "Agentic AI Frameworks (LangGraph, CrewAI, AutoGen)",
            "Model Context Protocol (MCP Clients & Servers)",
            "Context Engineering & Long Window Optimization",
            "Retrieval-Augmented Generation (RAG & Graph-RAG)",
            "Vector Databases & Semantic Embeddings",
            "LLM Inference Systems (vLLM, Ollama, Quantization)",
            "AI Security & Red Teaming (Guardrails, Injection Defense)",
            "AI Benchmarking & Evaluation (Ragas, LLM-as-a-Judge)"
        ]
    },
    {
        "id": "dom_web",
        "name": "Full-Stack Web & Systems Engineering",
        "categories_count": 8,
        "description": "React 19, TypeScript, FastAPI, High-Throughput REST, GraphQL, Systems Architecture.",
        "categories": [
            "React 19 & Modern UI Engineering",
            "TypeScript Architecture & Type Systems",
            "FastAPI & High-Performance Python Backends",
            "SQL & Relational Storage (SQLite, PostgreSQL)",
            "NoSQL & In-Memory Caching (Redis)",
            "API Security & Authentication (JWT, OAuth2)",
            "Microservices & Event-Driven Architecture",
            "Web Vitals & Client-Side Performance"
        ]
    },
    {
        "id": "dom_infra",
        "name": "Cloud Infrastructure & DevOps",
        "categories_count": 6,
        "description": "Docker, Kubernetes, GPU Scheduling, CI/CD Pipelines, Infrastructure as Code.",
        "categories": [
            "Docker Containerization & Multi-Stage Builds",
            "Kubernetes & GPU Node Pool Orchestration",
            "GitHub Actions CI/CD & Automated Auditing",
            "Terraform & Multi-Region Cloud Provisioning",
            "Prometheus & Real-Time System Observability",
            "Air-Gapped & On-Premise Enterprise AI Hosting"
        ]
    },
    {
        "id": "dom_exclusive",
        "name": "Codempress Exclusive Builder Specializations",
        "categories_count": 6,
        "description": "AI Founders, Indie Hackers, Workflow Designers, DevEx Engineers, Forward Deployed Engineers.",
        "categories": [
            "AI SaaS Founder & Monetization Architecture",
            "Indie Hacker Vibe Coding & Rapid Prototyping",
            "AI Creator & Automated Media Production",
            "n8n & Enterprise AI Workflow Automation",
            "AI Developer Productivity & Subagent Engineering",
            "Forward Deployed AI Engineering (FDE) & Client Systems"
        ]
    }
]


# -------------------------------------------------------------------------
# Skill-Gap Analysis & Personalization Engine
# -------------------------------------------------------------------------

class SkillGapRequest(BaseModel):
    user_id: Optional[int] = 1
    roadmap_slug: str
    completed_topic_ids: List[int] = []


class SkillGapResponse(BaseModel):
    roadmap_slug: str
    roadmap_title: str
    target_role: str
    total_milestones: int
    completion_percentage: float
    mastered_skills: List[str]
    missing_skills: List[str]
    recommended_next_topics: List[Dict[str, Any]]
    daily_learning_plan: List[Dict[str, Any]]
    estimated_hours_remaining: int


def analyze_roadmap_skill_gap(
    roadmap: Dict[str, Any], 
    completed_topic_ids: List[int]
) -> SkillGapResponse:
    """Calculates user skill-gap, missing prerequisites, and a 7-day personalized action plan."""
    milestones = roadmap.get("milestones", [])
    total_milestones = len(milestones)
    
    # Estimate completion based on completed topics
    completed_count = len(completed_topic_ids)
    total_required_topics = sum(m.get("topics_count", 15) for m in milestones)
    completion_pct = min(100.0, round((completed_count / max(1, total_required_topics)) * 100, 1))

    all_skills = []
    for m in milestones:
        all_skills.extend(m.get("skills", []))
    all_skills = list(set(all_skills))

    # Mock partition based on progress
    mastered_cutoff = int(len(all_skills) * (completion_pct / 100.0))
    mastered_skills = all_skills[:mastered_cutoff]
    missing_skills = all_skills[mastered_cutoff:]

    # Generate 7-Day Action Plan
    daily_plan = [
        {"day": "Day 1", "focus": f"Milestone 1: {milestones[0]['title'] if milestones else 'Foundations'}", "action": "Read core theory & complete diagnostic quiz", "target_xp": 100},
        {"day": "Day 2", "focus": "Prerequisite Concept Mastery", "action": "Implement interactive code challenge", "target_xp": 150},
        {"day": "Day 3", "focus": f"Skill Integration ({missing_skills[0] if missing_skills else 'Core Tools'})", "action": "Build mini-project module", "target_xp": 120},
        {"day": "Day 4", "focus": "Deep Dive & AI Mentor Querying", "action": "Consult Socratic AI Mentor on edge cases", "target_xp": 80},
        {"day": "Day 5", "focus": f"Advanced Skill ({missing_skills[1] if len(missing_skills)>1 else 'Architecture'})", "action": "Refactor codebase to Clean Architecture", "target_xp": 140},
        {"day": "Day 6", "focus": "Capstone Project Preparation", "action": "Scaffolding capstone repository & dependencies", "target_xp": 200},
        {"day": "Day 7", "focus": "Portfolio Evaluation & Benchmark", "action": "Submit capstone for automated evaluation", "target_xp": 250}
    ]

    # RecommendedNextTopics
    next_topics = [
        {"id": 1741, "title": "What is Agentic AI? — Definition", "subject": "Agentic AI", "reason": "Recommended prerequisite for " + roadmap.get("title", "")},
        {"id": 1742, "title": "ReAct Pattern & Tool Calling Mechanics", "subject": "Agentic AI", "reason": "Core milestone skill"},
        {"id": 1743, "title": "Model Context Protocol (MCP) Architecture", "subject": "Agentic AI", "reason": "High-priority industry skill"}
    ]

    remaining_hours = max(10, int((1.0 - (completion_pct / 100.0)) * 60))

    return SkillGapResponse(
        roadmap_slug=roadmap.get("slug", ""),
        roadmap_title=roadmap.get("title", ""),
        target_role=roadmap.get("target_role", ""),
        total_milestones=total_milestones,
        completion_percentage=completion_pct,
        mastered_skills=mastered_skills,
        missing_skills=missing_skills,
        recommended_next_topics=next_topics,
        daily_learning_plan=daily_plan,
        estimated_hours_remaining=remaining_hours
    )
