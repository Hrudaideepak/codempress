import json
import logging
import hashlib
import time
from typing import Dict, Any, List
from backend.infrastructure.services.ai_service import ai_engine

logger = logging.getLogger("codempress.dynamic_roadmap_generator")

# In-memory LRU Cache for skeletons and lazy-loaded stage modules
_SKELETON_CACHE: Dict[str, Dict[str, Any]] = {}
_MODULE_CACHE: Dict[str, Dict[str, Any]] = {}

def _make_hash(key_str: str) -> str:
    return hashlib.md5(key_str.encode("utf-8")).hexdigest()[:10]

def validate_roadmap_skeleton(data: Any, target_role: str) -> Dict[str, Any]:
    """Validates LLM JSON output for a roadmap skeleton. Returns fallback if invalid."""
    if not isinstance(data, dict):
        logger.warning("Skeleton output is not a dict. Falling back.")
        return _build_fallback_skeleton(target_role)
    
    stages = data.get("stages")
    if not isinstance(stages, list) or len(stages) == 0:
        logger.warning("Skeleton stages list missing or empty. Falling back.")
        return _build_fallback_skeleton(target_role)

    # Ensure required fields
    return {
        "slug": data.get("slug") or f"custom-{target_role.lower().replace(' ', '-')}-{_make_hash(target_role)}",
        "title": data.get("title") or f"{target_role} Career Roadmap",
        "tagline": data.get("tagline") or f"Master production-grade skills for {target_role}.",
        "target_role": target_role,
        "estimated_weeks": data.get("estimated_weeks") or "8 - 12 weeks",
        "overview": data.get("overview") or f"Personalized learning path tailored for {target_role}.",
        "capstone_project": data.get("capstone_project") or f"Build & Ship a Production {target_role} Capstone System",
        "skills_extracted": data.get("skills_extracted") if isinstance(data.get("skills_extracted"), list) else [],
        "skills_to_bridge": data.get("skills_to_bridge") if isinstance(data.get("skills_to_bridge"), list) else [],
        "stages": [
            {
                "stage_id": st.get("stage_id") or f"stage-{idx+1}",
                "title": st.get("title") or f"Stage {idx+1}: Core Principles",
                "description": st.get("description") or f"Fundamental concepts for {target_role}.",
                "skills": st.get("skills") if isinstance(st.get("skills"), list) else ["Core Engineering"],
                "topics": st.get("topics") if isinstance(st.get("topics"), list) else [
                    {"topic_id": f"top-{idx+1}-1", "title": "Foundation Concepts", "overview": "Core fundamentals"}
                ]
            }
            for idx, st in enumerate(stages)
        ]
    }

def _build_fallback_skeleton(target_role: str, resume_skills: List[str] = None) -> Dict[str, Any]:
    skills = resume_skills or ["Python", "JavaScript", "Software Architecture"]
    return {
        "slug": f"custom-{target_role.lower().replace(' ', '-')}-{_make_hash(target_role)}",
        "title": f"Tailored {target_role} Roadmap",
        "tagline": f"AI-orchestrated milestone path for {target_role}.",
        "target_role": target_role,
        "estimated_weeks": "10 - 14 weeks",
        "overview": f"Comprehensive career path structured specifically for {target_role}.",
        "capstone_project": f"Production Capstone: Build & Deploy an Enterprise {target_role} Application",
        "skills_extracted": skills[:4],
        "skills_to_bridge": ["System Architecture", "Production Observability", "CI/CD & Testing"],
        "stages": [
            {
                "stage_id": "stage-1",
                "title": "Stage 1: Role Foundations & Core Tools",
                "description": f"Master fundamental tools and language paradigms required for {target_role}.",
                "skills": [skills[0] if skills else "Core Tech", "CLI Tooling", "Git"],
                "topics": [
                    {"topic_id": "top-1-1", "title": "Environment Setup & Syntax Foundations", "overview": "Setting up production development workspace."},
                    {"topic_id": "top-1-2", "title": "Core Paradigms & Code Patterns", "overview": "Clean code standards and modular architecture."}
                ]
            },
            {
                "stage_id": "stage-2",
                "title": "Stage 2: Applied Architecture & Systems",
                "description": f"Design scalable components and system boundaries for {target_role}.",
                "skills": ["System Design", "APIs", "Data Structures"],
                "topics": [
                    {"topic_id": "top-2-1", "title": "API Design & Data Flow Specifications", "overview": "RESTful interfaces and error handling."},
                    {"topic_id": "top-2-2", "title": "State Persistence & Caching Strategies", "overview": "Optimizing data storage and query performance."}
                ]
            },
            {
                "stage_id": "stage-3",
                "title": "Stage 3: Advanced Optimization & Security",
                "description": "Harden application security, perform profiling, and optimize runtime complexity.",
                "skills": ["Security Hardening", "Performance Profiling", "Testing"],
                "topics": [
                    {"topic_id": "top-3-1", "title": "Security Best Practices & Auth Patterns", "overview": "OWASP top 10 and secure authentication."},
                    {"topic_id": "top-3-2", "title": "Performance Optimization & Benchmarking", "overview": "Latency reduction and memory profiling."}
                ]
            },
            {
                "stage_id": "stage-4",
                "title": "Stage 4: Flagship Capstone & Interview Mastery",
                "description": "Ship your production capstone project and master role-specific technical interview scenarios.",
                "skills": ["Production Deployment", "System Architecture Interviews", "Code Review"],
                "topics": [
                    {"topic_id": "top-4-1", "title": "Production Deployment & Cloud CI/CD", "overview": "Containerization and continuous deployment."},
                    {"topic_id": "top-4-2", "title": "Technical Interview Mock & System Architecture", "overview": "Deep dive technical Q&A preparation."}
                ]
            }
        ]
    }

async def generate_roadmap_skeleton(
    target_role: str,
    user_goals: str = "",
    resume_skills: List[str] = None,
    experience_level: str = "Mid"
) -> Dict[str, Any]:
    """Generates a snappy structured roadmap skeleton on the fly via AI in ~1-2s."""
    skills_str = ", ".join(resume_skills) if resume_skills else "General Computer Science"
    cache_key = _make_hash(f"{target_role}:{user_goals}:{skills_str}:{experience_level}")
    
    if cache_key in _SKELETON_CACHE:
        logger.info(f"Returning cached skeleton for {target_role}")
        return _SKELETON_CACHE[cache_key]

    prompt = f"""
    You are an expert Principal Software Architect.
    Generate a concise JSON roadmap skeleton for target role: '{target_role}'.
    User Background: Experience Level = {experience_level}, Existing Skills = {skills_str}, Goals = {user_goals}.

    Return ONLY a valid JSON object matching this exact structure (no markdown wrapper, no extra text):
    {{
      "slug": "tailored-{target_role.lower().replace(' ', '-')}-{cache_key}",
      "title": "Tailored {target_role} Roadmap",
      "tagline": "Concise tagline explaining career trajectory",
      "estimated_weeks": "8 - 12 weeks",
      "overview": "Detailed overview of the personalized path",
      "capstone_project": "Flagship Capstone Project Title",
      "skills_extracted": ["Skill1", "Skill2"],
      "skills_to_bridge": ["BridgeSkill1", "BridgeSkill2"],
      "stages": [
        {{
          "stage_id": "stage-1",
          "title": "Stage 1: [Stage Name]",
          "description": "Brief description of stage",
          "skills": ["SkillA", "SkillB"],
          "topics": [
            {{"topic_id": "top-1-1", "title": "[Topic Title]", "overview": "Brief overview"}}
          ]
        }}
      ]
    }}
    Include 4 distinct stages tailored to this role.
    """

    try:
        raw_resp = await ai_engine.generate_text(prompt, max_tokens=1200)
        cleaned = raw_resp.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
        
        parsed = json.loads(cleaned)
        validated = validate_roadmap_skeleton(parsed, target_role)
        _SKELETON_CACHE[cache_key] = validated
        return validated
    except Exception as e:
        logger.error(f"Error generating AI roadmap skeleton: {e}. Returning fallback.")
        fallback = _build_fallback_skeleton(target_role, resume_skills)
        _SKELETON_CACHE[cache_key] = fallback
        return fallback

async def generate_stage_module(
    roadmap_title: str,
    stage_title: str,
    stage_description: str,
    role_depth: str = "Production Engineering"
) -> Dict[str, Any]:
    """Lazy loads detailed stage content (theory markdown, code exercise, mini-project, interview prep) on click."""
    cache_key = _make_hash(f"{roadmap_title}:{stage_title}")
    if cache_key in _MODULE_CACHE:
        logger.info(f"Returning cached lazy module for {stage_title}")
        return _MODULE_CACHE[cache_key]

    prompt = f"""
    You are a Senior Technical Curriculum Specialist.
    Generate lazy-loaded detailed learning module content for:
    Roadmap: '{roadmap_title}'
    Stage: '{stage_title}'
    Description: '{stage_description}'
    Role Depth: '{role_depth}'

    Return ONLY a valid JSON object matching this structure (no markdown block wrapper):
    {{
      "stage_title": "{stage_title}",
      "role_depth_focus": "{role_depth} Focus: Deep dive concepts and implementation standards.",
      "theory_markdown": "### {stage_title}\\n\\nDetailed technical explanation covering architectural concepts, code patterns, and production standards...",
      "code_example": {{
        "title": "{stage_title} Implementation Example",
        "code": "// Runnable code example demonstrating {stage_title}\\nfunction executeModule() {{\\n  console.log('Running {stage_title}');\\n}}",
        "explanation": "Clear line-by-line explanation of code mechanics."
      }},
      "mini_project": {{
        "title": "Stage Hands-On Mini-Project",
        "instructions": "Build a functional module implementing the stage concepts.",
        "deliverables": ["Production code module", "Unit tests", "Architecture README"]
      }},
      "interview_prep": [
        {{
          "question": "What is the primary architectural trade-off when implementing this stage pattern?",
          "answer": "Detailed technical interview response explaining trade-offs, latency, and scalability implications."
        }},
        {{
          "question": "How do you handle error recovery and resilience under high load?",
          "answer": "Explanation of circuit breakers, retries, and fallback strategies."
        }}
      ]
    }}
    """

    try:
        raw_resp = await ai_engine.generate_text(prompt, max_tokens=1500)
        cleaned = raw_resp.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
        
        parsed = json.loads(cleaned)
        _MODULE_CACHE[cache_key] = parsed
        return parsed
    except Exception as e:
        logger.error(f"Error lazy loading stage module: {e}. Returning fallback module.")
        fallback = {
            "stage_title": stage_title,
            "role_depth_focus": f"{role_depth} Focus",
            "theory_markdown": f"### {stage_title}\n\nComprehensive technical guide covering production implementation patterns, architecture choices, and security standards for {roadmap_title}.",
            "code_example": {
                "title": f"{stage_title} Production Pattern",
                "code": f"// {stage_title} Implementation\nasync function executeStage() {{\n  console.log('Executing {stage_title} for {roadmap_title}');\n}}",
                "explanation": f"Demonstrates production pattern for {stage_title}."
            },
            "mini_project": {
                "title": f"{stage_title} Practical Project",
                "instructions": f"Implement and verify {stage_title} components in a isolated environment.",
                "deliverables": ["Working code module", "Integration tests", "Deployment documentation"]
            },
            "interview_prep": [
                {
                    "question": f"How do you design and test components for {stage_title} in production?",
                    "answer": "Focus on modular component isolation, automated integration testing, and telemetry metrics."
                }
            ]
        }
        _MODULE_CACHE[cache_key] = fallback
        return fallback
